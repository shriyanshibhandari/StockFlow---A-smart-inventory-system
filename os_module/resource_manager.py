import threading
import time
from datetime import datetime
from sqlalchemy import text
from fastapi import HTTPException

inventory_lock = threading.Lock()
delivery_lock = threading.Lock()

# Recent OS events are kept in memory for the live activity monitor.
_activity_lock = threading.Lock()
_activity_events = []
MAX_ACTIVITY_EVENTS = 150


def log_event(event, details, event_type="info"):
    entry = {
        "timestamp": datetime.now().astimezone().isoformat(timespec="seconds"),
        "event": event,
        "details": details,
        "event_type": event_type,
    }
    with _activity_lock:
        _activity_events.insert(0, entry)
        del _activity_events[MAX_ACTIVITY_EVENTS:]
    print(f"[OS] {event}: {details}")
    return entry


def get_activity_events():
    with _activity_lock:
        return list(_activity_events)


def dispatch_inventory(db, product_id, godown_id, quantity, notes=None):
    """Perform an atomic, availability-checked stock dispatch in the DB transaction."""
    log_event("Dispatch requested", f"Product #{product_id}, godown #{godown_id}, quantity {quantity}", "info")
    try:
        # PostgreSQL's conditional UPDATE locks the matching row and checks
        # available stock atomically, including requests from other processes.
        with inventory_lock:
            log_event("Inventory lock acquired", f"Dispatching product #{product_id} from godown #{godown_id}", "lock")
            result = db.execute(
                text("""
                    UPDATE inventory
                    SET quantity_on_hand = quantity_on_hand - :quantity,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE product_id = :product_id
                      AND godown_id = :godown_id
                      AND quantity_on_hand - quantity_reserved >= :quantity
                    RETURNING product_id, godown_id, quantity_on_hand,
                              quantity_reserved, updated_at
                """),
                {
                    "product_id": product_id,
                    "godown_id": godown_id,
                    "quantity": quantity,
                },
            ).mappings().first()

            if result is None:
                log_event("Dispatch rejected", f"Insufficient available stock or inventory row missing (product #{product_id}, godown #{godown_id})", "warning")
                raise HTTPException(
                    status_code=400,
                    detail="Insufficient available stock or inventory record not found",
                )

            db.execute(
                text("""
                    INSERT INTO stock_movements (
                        product_id, godown_id, movement_type, quantity,
                        created_at, notes
                    )
                    VALUES (
                        :product_id, :godown_id, 'dispatch', :quantity,
                        CURRENT_TIMESTAMP, :notes
                    )
                """),
                {
                    "product_id": product_id,
                    "godown_id": godown_id,
                    "quantity": quantity,
                    "notes": notes or "OS Resource Manager dispatch",
                },
            )
            log_event("Stock dispatched", f"{quantity} units of product #{product_id}; remaining on hand: {result['quantity_on_hand']}", "success")
            return dict(result)
    finally:
        log_event("Inventory lock released", f"Dispatch operation ended for product #{product_id}", "lock")


def update_inventory(thread_id, quantity):
    log_event("Inventory thread started", f"Thread {thread_id} requested {quantity} units", "info")
    with inventory_lock:
        log_event("Inventory lock acquired", f"Thread {thread_id}", "lock")
        log_event("Demo dispatch completed", f"Thread {thread_id} simulated dispatch of {quantity} units", "success")
        time.sleep(1)
        log_event("Inventory lock released", f"Thread {thread_id}", "lock")


def manage_resources(thread_id):
    log_event("Resource request", f"Thread {thread_id} requesting inventory then delivery locks", "info")
    with inventory_lock:
        log_event("Inventory lock acquired", f"Thread {thread_id}", "lock")
        with delivery_lock:
            log_event("Delivery lock acquired", f"Thread {thread_id}", "lock")
            log_event("Resources managed", f"Thread {thread_id} safely acquired both locks", "success")
            time.sleep(0.2)
            log_event("Delivery lock released", f"Thread {thread_id}", "lock")
        log_event("Inventory lock released", f"Thread {thread_id}", "lock")


if __name__ == "__main__":
    stock = 100

    def demo_dispatch(thread_id, quantity):
        global stock
        log_event("Demo dispatch requested", f"Thread {thread_id} requested {quantity} units", "info")
        with inventory_lock:
            log_event("Inventory lock acquired", f"Thread {thread_id}", "lock")
            if stock >= quantity:
                stock -= quantity
                time.sleep(1)
                log_event("Demo dispatch completed", f"Thread {thread_id} dispatched {quantity}; remaining demo stock {stock}", "success")
            else:
                log_event("Demo dispatch rejected", f"Thread {thread_id}: insufficient demo stock", "warning")
            log_event("Inventory lock released", f"Thread {thread_id}", "lock")

    thread1 = threading.Thread(target=demo_dispatch, args=(1, 60))
    thread2 = threading.Thread(target=demo_dispatch, args=(2, 50))
    thread1.start()
    thread2.start()
    thread1.join()
    thread2.join()
    print("Final demo stock:", stock)

    print("\nTesting resource lock ordering")
    thread3 = threading.Thread(target=manage_resources, args=(3,))
    thread4 = threading.Thread(target=manage_resources, args=(4,))
    thread3.start()
    thread4.start()
    thread3.join()
    thread4.join()
    print("All resources handled safely")
