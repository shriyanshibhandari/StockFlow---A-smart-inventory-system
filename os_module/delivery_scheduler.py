import threading
import time
from queue import PriorityQueue
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from db import SessionLocal
from sqlalchemy import text
from os_module.resource_manager import log_event

delivery_queue = PriorityQueue()
delivery_lock = threading.Lock()


def fetch_pending_deliveries():
    db = SessionLocal()
    try:
        query = text("""
            SELECT delivery_id, order_id, priority, status
            FROM deliveries
            WHERE status = 'assigned'
            ORDER BY priority ASC, delivery_id ASC
        """)
        deliveries = db.execute(query).mappings().all()
        return [dict(delivery) for delivery in deliveries]
    finally:
        db.close()


def load_deliveries():
    deliveries = fetch_pending_deliveries()
    for delivery in deliveries:
        add_delivery(
            delivery["delivery_id"],
            delivery["order_id"],
            delivery["priority"]
        )
    log_event("Scheduler queue loaded", f"{len(deliveries)} assigned deliveries queued", "info")
    print(f"Total assigned deliveries loaded: {len(deliveries)}")
    return len(deliveries)


def update_delivery_status(delivery_id, status):
    db = SessionLocal()
    try:
        query = text("""
            UPDATE deliveries
            SET status = :status
            WHERE delivery_id = :delivery_id
        """)
        db.execute(query, {"status": status, "delivery_id": delivery_id})
        db.commit()
        log_event("Delivery status updated", f"Delivery #{delivery_id} changed to {status.replace('_', ' ')}", "success")
    finally:
        db.close()


def add_delivery(delivery_id, order_id, priority):
    delivery = {
        "delivery_id": delivery_id,
        "order_id": order_id,
        "status": "waiting",
        "priority": priority
    }
    delivery_queue.put((priority, delivery_id, delivery))
    log_event("Delivery queued", f"Delivery #{delivery_id}, priority {priority}", "info")
    print(f"Delivery {delivery_id} added with priority {priority}")


def process_delivery():
    while not delivery_queue.empty():
        with delivery_lock:
            if delivery_queue.empty():
                return
            priority, delivery_id, delivery = delivery_queue.get()

        try:
            log_event("Worker started", f"Processing delivery #{delivery_id} at priority {priority}", "info")
            print(f"Processing delivery {delivery_id} (priority {priority})")
            update_delivery_status(delivery_id, "in_transit")
            time.sleep(2)
            log_event("Worker completed", f"Delivery #{delivery_id} processing simulation completed", "success")
            print(f"Delivery {delivery_id} processing simulation completed")
        except Exception as exc:
            log_event("Worker error", f"Delivery #{delivery_id}: {exc}", "warning")
        finally:
            delivery_queue.task_done()


if __name__ == "__main__":
    load_deliveries()
    workers = []
    for _ in range(3):
        worker = threading.Thread(target=process_delivery)
        workers.append(worker)
        worker.start()
    for worker in workers:
        worker.join()
    print("All assigned deliveries processed")
