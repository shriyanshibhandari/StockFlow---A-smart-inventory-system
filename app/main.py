from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from db import get_db
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime
from sqlalchemy import text, func
from fastapi.middleware.cors import CORSMiddleware
import threading
from fastapi import BackgroundTasks
from os_module import delivery_scheduler, resource_manager
from os_module.deadlock_manager import DeadlockManager
from os_module.resource_manager import dispatch_inventory


app = FastAPI(title="Smart Inventory System")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Welcome to Smart Inventory System!"}


@app.get("/health")
def health_check():
    return {"status": "Backend is running!"}


@app.get("/products")
def get_products(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM products"))
    products = result.mappings().all()

    return [dict(product) for product in products]

@app.get("/godowns")
def get_godowns(db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT * FROM godowns")
    ).mappings().all()

    return [dict(row) for row in result]

@app.get("/customers")
def get_customers(db: Session = Depends(get_db)):
    result = db.execute(
        text("""
            SELECT customer_id, customer_name, email, phone, address
            FROM customers
            ORDER BY customer_id
        """)
    ).mappings().all()

    return [dict(row) for row in result]

class CustomerCreate(BaseModel):
    customer_name: str
    email: str
    phone: str
    address: str

class SupplierCreate(BaseModel):
    supplier_name: str
    email: str | None = None
    phone: str | None = None
    address: str | None = None

@app.post("/customers")
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db)
):
    try:
        result = db.execute(
            text("""
                INSERT INTO customers (
                    customer_name,
                    email,
                    phone,
                    address
                )
                VALUES (
                    :customer_name,
                    :email,
                    :phone,
                    :address
                )
                RETURNING *
            """),
            customer.model_dump()
        )

        new_customer = dict(result.mappings().one())
        db.commit()

        return new_customer

    except Exception as e:
        db.rollback()
        print("CUSTOMER ERROR:", repr(e))
        raise HTTPException(
            status_code=400,
            detail="Could not create customer. Check customer details."
        )

@app.get("/suppliers")
def get_suppliers(db: Session = Depends(get_db)):
    result = db.execute(
        text("""
            SELECT *
            FROM suppliers
            ORDER BY supplier_id
        """)
    ).mappings().all()

    return [dict(row) for row in result]


@app.post("/suppliers")
def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db)
):
    try:
        result = db.execute(
            text("""
                INSERT INTO suppliers (
                    supplier_name,
                    email,
                    phone,
                    address
                )
                VALUES (
                    :supplier_name,
                    :email,
                    :phone,
                    :address
                )
                RETURNING *
            """),
            supplier.model_dump()
        )

        new_supplier = dict(result.mappings().one())
        db.commit()

        return new_supplier

    except Exception as e:
        db.rollback()
        print("SUPPLIER ERROR:", repr(e))
        raise HTTPException(
            status_code=400,
            detail="Could not create supplier."
        )

@app.get("/inventory")
def get_inventory(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            p.product_id,
            p.product_name,
            p.sku,
            g.godown_id,
            g.godown_name,
            i.quantity_on_hand,
            i.quantity_reserved,
            i.quantity_on_hand - i.quantity_reserved AS available_quantity,
            p.reorder_level
        FROM inventory i
        JOIN products p
            ON i.product_id = p.product_id
        JOIN godowns g
            ON i.godown_id = g.godown_id
        ORDER BY g.godown_name, p.product_name
    """)

    result = db.execute(query)
    inventory = result.mappings().all()

    return [dict(item) for item in inventory]


@app.get("/inventory/godown/{godown_id}")
def get_inventory_by_godown(
    godown_id: int,
    db: Session = Depends(get_db)
):
    query = text("""
        SELECT
            p.product_id,
            p.product_name,
            p.sku,
            g.godown_name,
            i.quantity_on_hand,
            i.quantity_reserved,
            i.quantity_on_hand - i.quantity_reserved AS available_quantity,
            p.reorder_level
        FROM inventory i
        JOIN products p
            ON i.product_id = p.product_id
        JOIN godowns g
            ON i.godown_id = g.godown_id
        WHERE g.godown_id = :godown_id
        ORDER BY p.product_name
    """)

    result = db.execute(query, {"godown_id": godown_id})
    inventory = result.mappings().all()

    return [dict(item) for item in inventory]


@app.get("/inventory/low-stock")
def get_low_stock(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            p.product_id,
            p.product_name,
            p.sku,
            g.godown_id,
            g.godown_name,
            i.quantity_on_hand,
            i.quantity_reserved,
            i.quantity_on_hand - i.quantity_reserved AS available_quantity,
            p.reorder_level
        FROM inventory i
        JOIN products p
            ON i.product_id = p.product_id
        JOIN godowns g
            ON i.godown_id = g.godown_id
        WHERE i.quantity_on_hand - i.quantity_reserved
              <= p.reorder_level
        ORDER BY available_quantity ASC
    """)

    result = db.execute(query)
    inventory = result.mappings().all()

    return [dict(item) for item in inventory]


class StockAdd(BaseModel):
    product_id: int = Field(gt=0)
    godown_id: int = Field(gt=0)
    quantity: int = Field(gt=0)
    notes: str | None = None


class StockDispatch(BaseModel):
    product_id: int = Field(gt=0)
    godown_id: int = Field(gt=0)
    quantity: int = Field(gt=0)
    notes: str | None = None

class StockTransfer(BaseModel):
    product_id: int = Field(gt=0)
    from_godown_id: int = Field(gt=0)
    to_godown_id: int = Field(gt=0)
    quantity: int = Field(gt=0)

class ProductCreate(BaseModel):
    sku: str
    product_name: str
    category_id: int | None = None
    unit_price: float = Field(gt=0)
    reorder_level: int = Field(default=10, ge=0)

class StockReservation(BaseModel):
    order_item_id: int = Field(gt=0)
    godown_id: int = Field(gt=0)
    quantity: int = Field(gt=0)

class ReservationRelease(BaseModel):
    reservation_id: int = Field(gt=0)

class OrderItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)

class OrderCreate(BaseModel):
    customer_id: int = Field(gt=0)
    delivery_address: str
    items: list[OrderItemCreate] = Field(min_length=1)

class PaymentCreate(BaseModel):
    order_id: int = Field(gt=0)
    payer_customer_id: int = Field(gt=0)
    amount: float = Field(gt=0)
    payment_method: str
    payment_channel: str
    transaction_reference: str | None = None

class DeadlockDependency(BaseModel):
    waiting_task: str = Field(min_length=1)
    holding_task: str = Field(min_length=1)


class DeadlockTaskDetails(BaseModel):
    priority: int = Field(default=1, ge=0)
    completed_work: int = Field(default=0, ge=0)
    recovery_cost: int = Field(default=0, ge=0)


class DeadlockSimulationRequest(BaseModel):
    dependencies: list[DeadlockDependency] = Field(min_length=1)
    task_details: dict[str, DeadlockTaskDetails] = Field(default_factory=dict)


@app.post("/payments")
def record_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    order = db.execute(
        text("""
            SELECT order_id, customer_id
            FROM orders
            WHERE order_id = :order_id
        """),
        {"order_id": payment.order_id}
    ).mappings().first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order["customer_id"] != payment.payer_customer_id:
        raise HTTPException(
            status_code=400,
            detail="Customer does not belong to this order"
        )

    result = db.execute(
        text("""
            INSERT INTO payments (
                order_id,
                payer_customer_id,
                amount,
                payment_method,
                payment_channel,
                status,
                transaction_reference,
                created_at
            )
            VALUES (
                :order_id,
                :payer_customer_id,
                :amount,
                :payment_method,
                :payment_channel,
                'succeeded',
                :transaction_reference,
                CURRENT_TIMESTAMP
            )
            RETURNING payment_id, order_id, amount, status, created_at
        """),
        {
            "order_id": payment.order_id,
            "payer_customer_id": payment.payer_customer_id,
            "amount": payment.amount,
            "payment_method": payment.payment_method,
            "payment_channel": payment.payment_channel,
            "transaction_reference": payment.transaction_reference
        }
    ).mappings().first()

    db.commit()

    return dict(result)


@app.get("/payments")
def get_payments(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            payment_id,
            order_id,
            payer_customer_id,
            amount,
            payment_method,
            payment_channel,
            status,
            transaction_reference,
            created_at
        FROM payments
        ORDER BY created_at DESC
    """)

    result = db.execute(query)
    payments = result.mappings().all()

    return [dict(payment) for payment in payments]


@app.post("/products")
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    query = text("""
        INSERT INTO products (
            sku,
            product_name,
            category_id,
            unit_price,
            reorder_level
        )
        VALUES (
            :sku,
            :product_name,
            :category_id,
            :unit_price,
            :reorder_level
        )
        RETURNING *
    """)

    try:
        result = db.execute(query, product.model_dump())
        new_product = dict(result.mappings().one())
        db.commit()
        return new_product
    except Exception as e:
        db.rollback()
        print("PRODUCT ERROR:", repr(e))
        raise HTTPException(
            status_code=400,
            detail="Could not create product. Check the SKU, category, and product details."
        )


@app.put("/products/{product_id}")
def update_product(
    product_id: int,
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    query = text("""
        UPDATE products
        SET
            sku = :sku,
            product_name = :product_name,
            category_id = :category_id,
            unit_price = :unit_price,
            reorder_level = :reorder_level
        WHERE product_id = :product_id
        RETURNING *
    """)

    values = product.model_dump()
    values["product_id"] = product_id

    result = db.execute(query, values)
    updated_product = result.mappings().first()

    if updated_product is None:
        db.rollback()
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    db.commit()
    return dict(updated_product)


@app.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    query = text("""
        DELETE FROM products
        WHERE product_id = :product_id
        RETURNING product_id, product_name
    """)

    result = db.execute(query, {"product_id": product_id})
    deleted_product = result.mappings().first()

    if deleted_product is None:
        db.rollback()
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    db.commit()

    return {
        "message": "Product deleted successfully",
        "deleted_product": dict(deleted_product)
    }


@app.post("/inventory/add-stock")
def add_stock(
    stock: StockAdd,
    db: Session = Depends(get_db)
):
    try:
        inventory_query = text("""
            INSERT INTO inventory (
                product_id,
                godown_id,
                quantity_on_hand,
                quantity_reserved,
                updated_at
            )
            VALUES (
                :product_id,
                :godown_id,
                :quantity,
                0,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (godown_id, product_id)
            DO UPDATE SET
                quantity_on_hand =
                    inventory.quantity_on_hand
                    + EXCLUDED.quantity_on_hand,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        """)

        result = db.execute(
            inventory_query,
            {
                "product_id": stock.product_id,
                "godown_id": stock.godown_id,
                "quantity": stock.quantity
            }
        )

        movement_query = text("""
            INSERT INTO stock_movements (
                product_id,
                godown_id,
                movement_type,
                quantity,
                created_at,
                notes
            )
            VALUES (
                :product_id,
                :godown_id,
                'receipt',
                :quantity,
                CURRENT_TIMESTAMP,
                :notes
            )
        """)

        db.execute(
            movement_query,
            {
                "product_id": stock.product_id,
                "godown_id": stock.godown_id,
                "quantity": stock.quantity,
                "notes": stock.notes
            }
        )

        db.commit()

        return {
            "message": "Stock added successfully",
            "inventory": dict(result.mappings().one())
        }

    except Exception as e:
        db.rollback()
        print("STOCK ERROR:", repr(e))
        raise HTTPException(
            status_code=400,
            detail="Could not add stock. Check the product, godown, and inventory constraints."
        )


@app.post("/inventory/dispatch-stock")
def dispatch_stock(stock: StockDispatch, db: Session = Depends(get_db)):
    try:
        updated_inventory = dispatch_inventory(
            db=db,
            product_id=stock.product_id,
            godown_id=stock.godown_id,
            quantity=stock.quantity,
            notes=stock.notes
        )

        db.commit()

        return {
            "message": "Stock dispatched successfully",
            "inventory": updated_inventory
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()
        print("DISPATCH ERROR:", repr(e))
        raise HTTPException(
            status_code=400,
            detail="Could not dispatch stock"
        )


@app.post("/inventory/transfer-stock")
def transfer_stock(
    transfer: StockTransfer,
    db: Session = Depends(get_db)
):
    if transfer.from_godown_id == transfer.to_godown_id:
        raise HTTPException(
            status_code=400,
            detail="Source and destination godowns must be different"
        )

    try:
        result = db.execute(
            text("""
                UPDATE inventory
                SET quantity_on_hand = quantity_on_hand - :quantity,
                    updated_at = CURRENT_TIMESTAMP
                WHERE product_id = :product_id
                  AND godown_id = :godown_id
                  AND quantity_on_hand - quantity_reserved >= :quantity
                RETURNING product_id
            """),
            {
                "product_id": transfer.product_id,
                "godown_id": transfer.from_godown_id,
                "quantity": transfer.quantity
            }
        )

        if result.first() is None:
            raise HTTPException(
                status_code=400,
                detail="Insufficient stock or source inventory not found"
            )

        db.execute(
            text("""
                INSERT INTO inventory (
                    product_id, godown_id, quantity_on_hand,
                    quantity_reserved, updated_at
                )
                VALUES (
                    :product_id, :godown_id, :quantity,
                    0, CURRENT_TIMESTAMP
                )
                ON CONFLICT (godown_id, product_id)
                DO UPDATE SET
                    quantity_on_hand =
                        inventory.quantity_on_hand + EXCLUDED.quantity_on_hand,
                    updated_at = CURRENT_TIMESTAMP
            """),
            {
                "product_id": transfer.product_id,
                "godown_id": transfer.to_godown_id,
                "quantity": transfer.quantity
            }
        )

        transfer_result = db.execute(
            text("""
                INSERT INTO stock_transfers (
                    from_godown_id, to_godown_id, status, created_at
                )
                VALUES (
                    :from_id, :to_id, 'completed', CURRENT_TIMESTAMP
                )
                RETURNING transfer_id
            """),
            {
                "from_id": transfer.from_godown_id,
                "to_id": transfer.to_godown_id
            }
        )

        transfer_id = transfer_result.scalar_one()

        db.execute(
            text("""
                INSERT INTO stock_transfer_items (
                    transfer_id, product_id, quantity
                )
                VALUES (:transfer_id, :product_id, :quantity)
            """),
            {
                "transfer_id": transfer_id,
                "product_id": transfer.product_id,
                "quantity": transfer.quantity
            }
        )

        for godown_id, movement_type in [
            (transfer.from_godown_id, "transfer_out"),
            (transfer.to_godown_id, "transfer_in")
        ]:
            db.execute(
                text("""
                    INSERT INTO stock_movements (
                        product_id, godown_id, movement_type,
                        quantity, created_at, notes
                    )
                    VALUES (
                        :product_id, :godown_id, :movement_type,
                        :quantity, CURRENT_TIMESTAMP, :notes
                    )
                """),
                {
                    "product_id": transfer.product_id,
                    "godown_id": godown_id,
                    "movement_type": movement_type,
                    "quantity": transfer.quantity,
                    "notes": f"Transfer ID: {transfer_id}"
                }
            )

        db.commit()

        return {
            "message": "Stock transferred successfully",
            "transfer_id": transfer_id,
            "quantity": transfer.quantity
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print("TRANSFER ERROR:", repr(e))
        raise HTTPException(
            status_code=400,
            detail="Could not transfer stock"
        )


@app.get("/transfers")
def get_transfers(db: Session = Depends(get_db)):
    result = db.execute(
        text("""
            SELECT
                st.transfer_id,
                st.from_godown_id,
                source.godown_name AS from_godown,
                st.to_godown_id,
                destination.godown_name AS to_godown,
                st.status,
                st.created_at,
                p.product_name,
                sti.product_id,
                sti.quantity
            FROM stock_transfers st
            JOIN godowns source
                ON st.from_godown_id = source.godown_id
            JOIN godowns destination
                ON st.to_godown_id = destination.godown_id
            JOIN stock_transfer_items sti
                ON st.transfer_id = sti.transfer_id
            JOIN products p
                ON sti.product_id = p.product_id
            ORDER BY st.created_at DESC
        """)
    ).mappings().all()

    return [dict(row) for row in result]

@app.post("/inventory/reserve-stock")
def reserve_stock(data: StockReservation, db: Session = Depends(get_db)):
    try:
        order_item = db.execute(
            text("""
                SELECT product_id, quantity
                FROM order_items
                WHERE order_item_id = :order_item_id
                FOR UPDATE
            """),
            {"order_item_id": data.order_item_id}
        ).fetchone()

        if not order_item:
            raise HTTPException(status_code=404, detail="Order item not found")

        reserved = db.execute(
            text("""
                SELECT COALESCE(SUM(quantity), 0)
                FROM stock_reservations
                WHERE order_item_id = :order_item_id
                AND status = 'active'
            """),
            {"order_item_id": data.order_item_id}
        ).scalar()

        if reserved + data.quantity > order_item.quantity:
            raise HTTPException(
                status_code=400,
                detail="Reservation exceeds order quantity"
            )

        inventory = db.execute(
            text("""
                UPDATE inventory
                SET quantity_reserved = quantity_reserved + :quantity
                WHERE product_id = :product_id
                AND godown_id = :godown_id
                AND quantity_on_hand - quantity_reserved >= :quantity
                RETURNING quantity_reserved
            """),
            {
                "quantity": data.quantity,
                "product_id": order_item.product_id,
                "godown_id": data.godown_id
            }
        ).fetchone()

        if not inventory:
            raise HTTPException(
                status_code=400,
                detail="Insufficient available stock"
            )

        result = db.execute(
            text("""
                INSERT INTO stock_reservations
                (order_item_id, godown_id, quantity, status, reserved_at)
                VALUES (:order_item_id, :godown_id, :quantity, 'active', NOW())
                RETURNING reservation_id
            """),
            {
                "order_item_id": data.order_item_id,
                "godown_id": data.godown_id,
                "quantity": data.quantity
            }
        ).fetchone()

        db.commit()

        return {
            "message": "Stock reserved successfully",
            "reservation_id": result.reservation_id,
            "quantity_reserved": data.quantity
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/inventory/release-reservation")
def release_reservation(
    data: ReservationRelease,
    db: Session = Depends(get_db)
):
    try:
        reservation = db.execute(
            text("""
                SELECT reservation_id, godown_id, quantity
                FROM stock_reservations
                WHERE reservation_id = :reservation_id
                AND status = 'active'
                FOR UPDATE
            """),
            {"reservation_id": data.reservation_id}
        ).fetchone()

        if not reservation:
            raise HTTPException(
                status_code=404,
                detail="Active reservation not found"
            )

        inventory = db.execute(
            text("""
                UPDATE inventory
                SET quantity_reserved = quantity_reserved - :quantity
                WHERE godown_id = :godown_id
                AND quantity_reserved >= :quantity
                RETURNING quantity_reserved
            """),
            {
                "quantity": reservation.quantity,
                "godown_id": reservation.godown_id
            }
        ).fetchone()

        if not inventory:
            raise HTTPException(
                status_code=400,
                detail="Reserved inventory quantity is inconsistent"
            )

        db.execute(
            text("""
                UPDATE stock_reservations
                SET status = 'released',
                    released_at = NOW()
                WHERE reservation_id = :reservation_id
            """),
            {"reservation_id": data.reservation_id}
        )

        db.commit()

        return {
            "message": "Reservation released successfully",
            "reservation_id": data.reservation_id,
            "quantity_released": reservation.quantity
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/orders")
def create_order(data: OrderCreate, db: Session = Depends(get_db)):
    try:
        customer = db.execute(
            text("""
                SELECT customer_id
                FROM customers
                WHERE customer_id = :customer_id
            """),
            {"customer_id": data.customer_id}
        ).fetchone()

        if not customer:
            raise HTTPException(
                status_code=404,
                detail="Customer not found"
            )

        for item in data.items:
            product = db.execute(
                text("""
                    SELECT product_id, unit_price
                    FROM products
                    WHERE product_id = :product_id
                    AND is_active = TRUE
                """),
                {"product_id": item.product_id}
            ).fetchone()

            if not product:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product {item.product_id} not found or inactive"
                )

        order = db.execute(
            text("""
                INSERT INTO orders (customer_id, delivery_address)
                VALUES (:customer_id, :delivery_address)
                RETURNING order_id
            """),
            {
                "customer_id": data.customer_id,
                "delivery_address": data.delivery_address
            }
        ).fetchone()

        for item in data.items:
            product = db.execute(
                text("""
                    SELECT unit_price
                    FROM products
                    WHERE product_id = :product_id
                """),
                {"product_id": item.product_id}
            ).fetchone()

            db.execute(
                text("""
                    INSERT INTO order_items
                    (order_id, product_id, quantity, unit_price)
                    VALUES (:order_id, :product_id, :quantity, :unit_price)
                """),
                {
                    "order_id": order.order_id,
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "unit_price": product.unit_price
                }
            )

        db.commit()

        return {
            "message": "Order created successfully",
            "order_id": order.order_id,
            "status": "pending"
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/orders/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.execute(
        text("""
            SELECT o.order_id, o.customer_id, c.customer_name,
                   o.order_date, o.status, o.delivery_address
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            WHERE o.order_id = :order_id
        """),
        {"order_id": order_id}
    ).mappings().first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    items = db.execute(
        text("""
            SELECT oi.order_item_id, oi.product_id, p.product_name,
                   oi.quantity, oi.unit_price,
                   oi.quantity * oi.unit_price AS total_price
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = :order_id
        """),
        {"order_id": order_id}
    ).mappings().all()

    return {
        "order": dict(order),
        "items": [dict(item) for item in items]
    }


@app.get("/orders")
def get_all_orders(db: Session = Depends(get_db)):
    orders = db.execute(
        text("""
            SELECT o.order_id, o.customer_id, c.customer_name,
                   o.order_date, o.status, o.delivery_address,
                   COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_amount
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            GROUP BY o.order_id, c.customer_name
            ORDER BY o.order_date DESC
        """)
    ).mappings().all()

    return [dict(order) for order in orders]


class OrderStatusUpdate(BaseModel):
    status: str


@app.put("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    db: Session = Depends(get_db)
):
    allowed_statuses = [
        "pending",
        "confirmed",
        "processing",
        "dispatched",
        "delivered",
        "cancelled"
    ]

    if data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid order status"
        )

    result = db.execute(
        text("""
            UPDATE orders
            SET status = :status
            WHERE order_id = :order_id
            RETURNING order_id, status
        """),
        {"status": data.status, "order_id": order_id}
    ).mappings().first()

    if not result:
        db.rollback()
        raise HTTPException(status_code=404, detail="Order not found")

    db.commit()

    return {
        "message": "Order status updated successfully",
        "order_id": result["order_id"],
        "status": result["status"]
    }


@app.get("/deliveries")
def get_deliveries(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            delivery_id,
            order_id,
            personnel_id,
            vehicle_id,
            godown_id,
            priority,
            estimated_duration_minutes,
            status,
            assigned_at,
            delivered_at
        FROM deliveries
        ORDER BY priority ASC, delivery_id ASC
    """)

    result = db.execute(query)
    deliveries = result.mappings().all()

    return [dict(delivery) for delivery in deliveries]


scheduler_state = {
    "running": False,
    "message": "Scheduler is idle"
}

scheduler_state_lock = threading.Lock()


def run_delivery_scheduler():
    try:
        delivery_scheduler.load_deliveries()

        workers = [
            threading.Thread(
                target=delivery_scheduler.process_delivery
            )
            for _ in range(3)
        ]

        for worker in workers:
            worker.start()

        for worker in workers:
            worker.join()

        with scheduler_state_lock:
            scheduler_state["message"] = "All deliveries processed"

    except Exception as e:
        with scheduler_state_lock:
            scheduler_state["message"] = f"Scheduler error: {e}"

    finally:
        with scheduler_state_lock:
            scheduler_state["running"] = False


@app.post("/deliveries/scheduler/start")
def start_delivery_scheduler(background_tasks: BackgroundTasks):
    with scheduler_state_lock:
        if scheduler_state["running"]:
            raise HTTPException(
                status_code=409,
                detail="Scheduler is already running"
            )

        scheduler_state["running"] = True
        scheduler_state["message"] = "Scheduler is processing deliveries"

    background_tasks.add_task(run_delivery_scheduler)

    return {
        "message": "Delivery scheduler started",
        "status": "running"
    }


@app.get("/deliveries/scheduler/status")
def get_scheduler_status():
    with scheduler_state_lock:
        return dict(scheduler_state)


@app.get("/os/activity")
def get_os_activity():
    return resource_manager.get_activity_events()


@app.get("/os/monitor/status")
def get_os_monitor_status(db: Session = Depends(get_db)):
    delivery_counts = db.execute(text("""
        SELECT
            COUNT(*) AS total_deliveries,
            COUNT(*) FILTER (WHERE status = 'assigned') AS assigned_deliveries,
            COUNT(*) FILTER (WHERE status = 'in_transit') AS in_transit_deliveries,
            COUNT(*) FILTER (WHERE status = 'delivered') AS delivered_deliveries
        FROM deliveries
    """)).mappings().one()

    events = resource_manager.get_activity_events()
    with scheduler_state_lock:
        current_scheduler = dict(scheduler_state)

    return {
        "scheduler": current_scheduler,
        "worker_count": 3,
        "delivery_queue_size": delivery_scheduler.delivery_queue.qsize(),
        "deliveries": dict(delivery_counts),
        "recent_event_count": len(events),
        "warning_count": sum(1 for event in events if event.get("event_type") == "warning"),
        "lock_status": {
            "inventory_lock_busy": resource_manager.inventory_lock.locked(),
            "delivery_lock_busy": resource_manager.delivery_lock.locked(),
        },
        "monitor_status": "operational",
    }


@app.post("/os/resource-manager/dispatch")
def os_resource_manager_dispatch(
    stock: StockDispatch,
    db: Session = Depends(get_db)
):
    try:
        updated_inventory = resource_manager.dispatch_inventory(
            db=db,
            product_id=stock.product_id,
            godown_id=stock.godown_id,
            quantity=stock.quantity,
            notes=stock.notes,
        )
        db.commit()
        return {
            "message": "Stock dispatched successfully through the OS Resource Manager",
            "inventory": updated_inventory,
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        resource_manager.log_event(
            "Dispatch failed",
            f"Unexpected error during dispatch: {exc}",
            "warning",
        )
        raise HTTPException(
            status_code=500,
            detail="Resource Manager could not complete the dispatch",
        )


@app.get("/os/resource-manager/status")
def os_resource_manager_status(db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT
            COUNT(*) AS inventory_rows,
            COALESCE(SUM(quantity_on_hand), 0) AS total_on_hand,
            COALESCE(SUM(quantity_reserved), 0) AS total_reserved,
            COALESCE(SUM(quantity_on_hand - quantity_reserved), 0) AS total_available,
            COUNT(*) FILTER (WHERE quantity_reserved > 0) AS allocated_inventory_rows
        FROM inventory
    """)).mappings().one()

    return {
        **dict(result),
        "lock_strategy": "Python thread locks + conditional PostgreSQL UPDATE",
        "locks": {
            "inventory_lock_busy": resource_manager.inventory_lock.locked(),
            "delivery_lock_busy": resource_manager.delivery_lock.locked(),
        },
        "status": "operational",
    }


@app.post("/os/resource-manager/synchronization-test")
def run_resource_synchronization_test():
    """Run two concurrent lock-order demonstrations without changing database stock."""
    workers = [
        threading.Thread(target=resource_manager.manage_resources, args=(1,)),
        threading.Thread(target=resource_manager.manage_resources, args=(2,)),
    ]

    for worker in workers:
        worker.start()
    for worker in workers:
        worker.join()

    resource_manager.log_event(
        "Synchronization test completed",
        "Two worker threads acquired inventory and delivery locks in the same order",
        "success",
    )

    return {
        "message": "Synchronization test completed successfully",
        "workers": 2,
        "lock_order": ["inventory_lock", "delivery_lock"],
        "database_stock_changed": False,
    }

deadlock_state = {
    "status": "idle",
    "deadlock_detected": False,
    "cycle": [],
    "victim": None,
    "recovery_completed": False,
    "final_graph": {}
}

deadlock_state_lock = threading.Lock()

@app.post("/os/deadlock/simulate")
def simulate_deadlock(data: DeadlockSimulationRequest):

    manager = DeadlockManager()

    # Build the Wait-For Graph.
    for dependency in data.dependencies:
        manager.add_dependency(
            dependency.waiting_task,
            dependency.holding_task
        )

    # Prepare task details, including defaults.
    task_details = {}

    for task in manager.get_wait_for_graph():
        details = data.task_details.get(task)

        if details:
            task_details[task] = details.model_dump()
        else:
            task_details[task] = {
                "priority": 1,
                "completed_work": 0,
                "recovery_cost": 0
            }

    # Detect a cycle before attempting recovery.
    cycle = manager.detect_deadlock()
    victim = manager.handle_deadlock(task_details) if cycle else None

    result = {
        "status": "recovered" if victim else ("deadlock_detected" if cycle else "no_deadlock"),
        "deadlock_detected": cycle is not None,
        "cycle": cycle or [],
        "victim": victim,
        "recovery_completed": victim is not None,
        "final_graph": manager.get_wait_for_graph(),
        "last_updated": datetime.now().astimezone().isoformat(timespec="seconds"),
    }

    if cycle:
        resource_manager.log_event(
            "Deadlock detected",
            "Circular wait: " + " -> ".join(cycle),
            "warning",
        )
        if victim:
            resource_manager.log_event(
                "Victim selected",
                f"Task {victim} selected for deadlock recovery",
                "info",
            )
            resource_manager.log_event(
                "Deadlock recovery completed",
                f"Recovery simulation removed the deadlock by selecting {victim}",
                "success",
            )
        else:
            resource_manager.log_event(
                "Deadlock recovery incomplete",
                "A cycle was detected but no victim was returned by the recovery manager",
                "warning",
            )
    else:
        resource_manager.log_event(
            "Deadlock check completed",
            "No circular wait was found in the supplied wait-for graph",
            "success",
        )

    with deadlock_state_lock:
        deadlock_state.clear()
        deadlock_state.update(result)

    return result


@app.get("/os/deadlock/status")
def get_deadlock_status():

    with deadlock_state_lock:
        return dict(deadlock_state)


@app.get("/os/deadlock/history")
def get_deadlock_history():

    events = resource_manager.get_activity_events()

    deadlock_events = [
        event for event in events
        if any(
            keyword in event["event"].lower()
            for keyword in ["deadlock", "victim", "recovery"]
        )
    ]

    return deadlock_events
# ============================================================
# ADDITIONAL STOCKFLOW MODULES
# Purchase Orders, Stock Movements, Refunds, Notifications,
# Vehicles and Delivery Personnel
# ============================================================

class PurchaseOrderItemInput(BaseModel):
    product_id: int = Field(gt=0)
    quantity_ordered: int = Field(gt=0)
    unit_cost: float = Field(ge=0)


class PurchaseOrderCreate(BaseModel):
    supplier_id: int = Field(gt=0)
    created_by_user_id: int | None = Field(default=None, gt=0)
    items: list[PurchaseOrderItemInput] = Field(min_length=1)


class PurchaseOrderStatusUpdate(BaseModel):
    status: str


class PurchaseOrderReceive(BaseModel):
    purchase_item_id: int = Field(gt=0)
    godown_id: int = Field(gt=0)
    quantity: int = Field(gt=0)
    notes: str | None = None


class RefundCreate(BaseModel):
    payment_id: int = Field(gt=0)
    amount: float = Field(gt=0)
    reason: str | None = None
    recorded_by_user_id: int | None = Field(default=None, gt=0)


class RefundStatusUpdate(BaseModel):
    status: str


class VehicleCreate(BaseModel):
    registration_number: str = Field(min_length=1, max_length=30)
    vehicle_type: str = Field(min_length=1, max_length=50)
    capacity: int = Field(gt=0)
    availability_status: str = "available"


class VehicleStatusUpdate(BaseModel):
    availability_status: str
    is_active: bool = True


class DeliveryPersonnelCreate(BaseModel):
    personnel_name: str = Field(min_length=1, max_length=100)
    user_id: int | None = Field(default=None, gt=0)
    phone: str | None = Field(default=None, max_length=20)
    availability_status: str = "available"


class DeliveryPersonnelStatusUpdate(BaseModel):
    availability_status: str
    is_active: bool = True


@app.get("/purchase-orders")
def get_purchase_orders(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT po.purchase_order_id, po.supplier_id, s.supplier_name,
               po.created_by_user_id, po.order_date, po.status,
               poi.purchase_item_id, poi.product_id, p.product_name,
               poi.quantity_ordered, poi.quantity_received, poi.unit_cost
        FROM purchase_orders po
        JOIN suppliers s ON s.supplier_id = po.supplier_id
        LEFT JOIN purchase_order_items poi
            ON poi.purchase_order_id = po.purchase_order_id
        LEFT JOIN products p ON p.product_id = poi.product_id
        ORDER BY po.order_date DESC, po.purchase_order_id DESC,
                 poi.purchase_item_id
    """)).mappings().all()
    orders = {}
    for row in rows:
        item = dict(row)
        order_id = item["purchase_order_id"]
        if order_id not in orders:
            orders[order_id] = {
                "purchase_order_id": order_id,
                "supplier_id": item["supplier_id"],
                "supplier_name": item["supplier_name"],
                "created_by_user_id": item["created_by_user_id"],
                "order_date": item["order_date"],
                "status": item["status"],
                "items": []
            }
        if item["purchase_item_id"] is not None:
            orders[order_id]["items"].append({
                "purchase_item_id": item["purchase_item_id"],
                "product_id": item["product_id"],
                "product_name": item["product_name"],
                "quantity_ordered": item["quantity_ordered"],
                "quantity_received": item["quantity_received"],
                "unit_cost": float(item["unit_cost"])
            })
    return list(orders.values())


@app.post("/purchase-orders")
def create_purchase_order(data: PurchaseOrderCreate, db: Session = Depends(get_db)):
    try:
        supplier = db.execute(text(
            "SELECT supplier_id FROM suppliers WHERE supplier_id = :id"
        ), {"id": data.supplier_id}).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        order_result = db.execute(text("""
            INSERT INTO purchase_orders (supplier_id, created_by_user_id, status)
            VALUES (:supplier_id, :created_by_user_id, 'draft')
            RETURNING purchase_order_id
        """), {
            "supplier_id": data.supplier_id,
            "created_by_user_id": data.created_by_user_id
        })
        purchase_order_id = order_result.scalar_one()
        for item in data.items:
            product = db.execute(text(
                "SELECT product_id FROM products WHERE product_id = :id"
            ), {"id": item.product_id}).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
            db.execute(text("""
                INSERT INTO purchase_order_items
                    (purchase_order_id, product_id, quantity_ordered, quantity_received, unit_cost)
                VALUES (:purchase_order_id, :product_id, :quantity_ordered, 0, :unit_cost)
            """), {
                "purchase_order_id": purchase_order_id,
                "product_id": item.product_id,
                "quantity_ordered": item.quantity_ordered,
                "unit_cost": item.unit_cost
            })
        db.commit()
        return {"message": "Purchase order created", "purchase_order_id": purchase_order_id}
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        print("PURCHASE ORDER ERROR:", repr(exc))
        raise HTTPException(status_code=400, detail="Could not create purchase order")


@app.put("/purchase-orders/{purchase_order_id}/status")
def update_purchase_order_status(
    purchase_order_id: int, data: PurchaseOrderStatusUpdate,
    db: Session = Depends(get_db)
):
    if data.status not in ["draft", "ordered", "cancelled"]:
        raise HTTPException(status_code=400, detail="Use the receive-stock action to mark items received")
    result = db.execute(text("""
        UPDATE purchase_orders SET status = :status
        WHERE purchase_order_id = :id AND status NOT IN ('received', 'cancelled')
        RETURNING purchase_order_id, status
    """), {"status": data.status, "id": purchase_order_id}).mappings().first()
    if not result:
        db.rollback()
        raise HTTPException(status_code=404, detail="Purchase order not found or cannot be updated")
    db.commit()
    return dict(result)


@app.post("/purchase-orders/{purchase_order_id}/receive")
def receive_purchase_order_stock(
    purchase_order_id: int, data: PurchaseOrderReceive,
    db: Session = Depends(get_db)
):
    try:
        order_status = db.execute(text("""
            SELECT status FROM purchase_orders
            WHERE purchase_order_id = :id
            FOR UPDATE
        """), {"id": purchase_order_id}).scalar_one_or_none()
        if order_status not in ["ordered", "partially_received"]:
            raise HTTPException(status_code=400, detail="Only ordered purchase orders can receive stock")

        item = db.execute(text("""
            UPDATE purchase_order_items
            SET quantity_received = quantity_received + :quantity
            WHERE purchase_item_id = :purchase_item_id
              AND purchase_order_id = :purchase_order_id
              AND quantity_received + :quantity <= quantity_ordered
            RETURNING product_id, quantity_received, quantity_ordered
        """), {
            "quantity": data.quantity,
            "purchase_item_id": data.purchase_item_id,
            "purchase_order_id": purchase_order_id
        }).mappings().first()
        if not item:
            raise HTTPException(status_code=400, detail="Purchase item not found or received quantity exceeds ordered quantity")
        db.execute(text("""
            INSERT INTO inventory (product_id, godown_id, quantity_on_hand, quantity_reserved, updated_at)
            VALUES (:product_id, :godown_id, :quantity, 0, CURRENT_TIMESTAMP)
            ON CONFLICT (godown_id, product_id)
            DO UPDATE SET quantity_on_hand = inventory.quantity_on_hand + EXCLUDED.quantity_on_hand,
                          updated_at = CURRENT_TIMESTAMP
        """), {
            "product_id": item["product_id"], "godown_id": data.godown_id,
            "quantity": data.quantity
        })
        db.execute(text("""
            INSERT INTO stock_movements
                (product_id, godown_id, movement_type, quantity, purchase_item_id, created_at, notes)
            VALUES (:product_id, :godown_id, 'receipt', :quantity, :purchase_item_id,
                    CURRENT_TIMESTAMP, :notes)
        """), {
            "product_id": item["product_id"], "godown_id": data.godown_id,
            "quantity": data.quantity, "purchase_item_id": data.purchase_item_id,
            "notes": data.notes or "Received against purchase order"
        })
        remaining = db.execute(text("""
            SELECT COUNT(*) FROM purchase_order_items
            WHERE purchase_order_id = :id AND quantity_received < quantity_ordered
        """), {"id": purchase_order_id}).scalar_one()
        total_items = db.execute(text("""
            SELECT COUNT(*) FROM purchase_order_items WHERE purchase_order_id = :id
        """), {"id": purchase_order_id}).scalar_one()
        status = "received" if remaining == 0 else "partially_received"
        db.execute(text("""
            UPDATE purchase_orders SET status = :status WHERE purchase_order_id = :id
        """), {"status": status, "id": purchase_order_id})
        db.commit()
        return {"message": "Stock received and inventory updated", "status": status,
                "quantity_received": item["quantity_received"]}
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        print("PURCHASE RECEIPT ERROR:", repr(exc))
        raise HTTPException(status_code=400, detail="Could not receive purchase order stock")


@app.get("/stock-movements")
def get_stock_movements(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT sm.movement_id, sm.product_id, p.product_name,
               sm.godown_id, g.godown_name, sm.movement_type, sm.quantity,
               sm.purchase_item_id, sm.order_item_id, sm.created_by_user_id,
               sm.created_at, sm.notes
        FROM stock_movements sm
        JOIN products p ON p.product_id = sm.product_id
        JOIN godowns g ON g.godown_id = sm.godown_id
        ORDER BY sm.created_at DESC, sm.movement_id DESC
    """)).mappings().all()
    return [dict(row) for row in rows]


@app.get("/refunds")
def get_refunds(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT r.refund_id, r.payment_id, r.amount, r.reason, r.status,
               r.recorded_by_user_id, r.created_at, r.completed_at,
               p.order_id, p.payer_customer_id, c.customer_name
        FROM refunds r
        JOIN payments p ON p.payment_id = r.payment_id
        LEFT JOIN customers c ON c.customer_id = p.payer_customer_id
        ORDER BY r.created_at DESC, r.refund_id DESC
    """)).mappings().all()
    return [dict(row) for row in rows]


@app.post("/refunds")
def create_refund(data: RefundCreate, db: Session = Depends(get_db)):
    try:
        payment = db.execute(text("""
            SELECT payment_id, amount FROM payments WHERE payment_id = :id
        """), {"id": data.payment_id}).mappings().first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        refunded = db.execute(text("""
            SELECT COALESCE(SUM(amount), 0) FROM refunds
            WHERE payment_id = :id AND status IN ('pending', 'succeeded')
        """), {"id": data.payment_id}).scalar_one()
        if float(refunded) + data.amount > float(payment["amount"]):
            raise HTTPException(status_code=400, detail="Total refunds cannot exceed the payment amount")
        result = db.execute(text("""
            INSERT INTO refunds (payment_id, amount, reason, status, recorded_by_user_id)
            VALUES (:payment_id, :amount, :reason, 'pending', :recorded_by_user_id)
            RETURNING *
        """), data.model_dump()).mappings().one()
        db.commit()
        return dict(result)
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        print("REFUND ERROR:", repr(exc))
        raise HTTPException(status_code=400, detail="Could not create refund")


@app.put("/refunds/{refund_id}/status")
def update_refund_status(refund_id: int, data: RefundStatusUpdate, db: Session = Depends(get_db)):
    if data.status not in ["pending", "succeeded", "failed"]:
        raise HTTPException(status_code=400, detail="Invalid refund status")
    result = db.execute(text("""
        UPDATE refunds
        SET status = :status,
            completed_at = CASE WHEN :status IN ('succeeded', 'failed') THEN CURRENT_TIMESTAMP ELSE NULL END
        WHERE refund_id = :id
        RETURNING refund_id, status, completed_at
    """), {"status": data.status, "id": refund_id}).mappings().first()
    if not result:
        db.rollback()
        raise HTTPException(status_code=404, detail="Refund not found")
    db.commit()
    return dict(result)


@app.get("/vehicles")
def get_vehicles(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM vehicles ORDER BY vehicle_id")).mappings().all()
    return [dict(row) for row in rows]


@app.post("/vehicles")
def create_vehicle(data: VehicleCreate, db: Session = Depends(get_db)):
    if data.availability_status not in ["available", "in_use", "maintenance"]:
        raise HTTPException(status_code=400, detail="Invalid vehicle availability status")
    try:
        result = db.execute(text("""
            INSERT INTO vehicles (registration_number, vehicle_type, capacity, availability_status, is_active)
            VALUES (:registration_number, :vehicle_type, :capacity, :availability_status, TRUE)
            RETURNING *
        """), data.model_dump()).mappings().one()
        db.commit()
        return dict(result)
    except Exception as exc:
        db.rollback()
        print("VEHICLE ERROR:", repr(exc))
        raise HTTPException(status_code=400, detail="Could not add vehicle. Registration number may already exist.")


@app.put("/vehicles/{vehicle_id}/status")
def update_vehicle_status(vehicle_id: int, data: VehicleStatusUpdate, db: Session = Depends(get_db)):
    if data.availability_status not in ["available", "in_use", "maintenance"]:
        raise HTTPException(status_code=400, detail="Invalid vehicle availability status")
    result = db.execute(text("""
        UPDATE vehicles SET availability_status = :availability_status, is_active = :is_active
        WHERE vehicle_id = :id RETURNING *
    """), {"availability_status": data.availability_status, "is_active": data.is_active,
           "id": vehicle_id}).mappings().first()
    if not result:
        db.rollback()
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.commit()
    return dict(result)


@app.get("/delivery-personnel")
def get_delivery_personnel(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM delivery_personnel ORDER BY personnel_id")).mappings().all()
    return [dict(row) for row in rows]


@app.post("/delivery-personnel")
def create_delivery_personnel(data: DeliveryPersonnelCreate, db: Session = Depends(get_db)):
    if data.availability_status not in ["available", "on_delivery", "unavailable"]:
        raise HTTPException(status_code=400, detail="Invalid personnel availability status")
    try:
        result = db.execute(text("""
            INSERT INTO delivery_personnel (user_id, personnel_name, phone, availability_status, is_active)
            VALUES (:user_id, :personnel_name, :phone, :availability_status, TRUE)
            RETURNING *
        """), data.model_dump()).mappings().one()
        db.commit()
        return dict(result)
    except Exception as exc:
        db.rollback()
        print("PERSONNEL ERROR:", repr(exc))
        raise HTTPException(status_code=400, detail="Could not add delivery personnel. Check phone and user ID uniqueness.")


@app.put("/delivery-personnel/{personnel_id}/status")
def update_delivery_personnel_status(
    personnel_id: int, data: DeliveryPersonnelStatusUpdate,
    db: Session = Depends(get_db)
):
    if data.availability_status not in ["available", "on_delivery", "unavailable"]:
        raise HTTPException(status_code=400, detail="Invalid personnel availability status")
    result = db.execute(text("""
        UPDATE delivery_personnel
        SET availability_status = :availability_status, is_active = :is_active
        WHERE personnel_id = :id RETURNING *
    """), {"availability_status": data.availability_status, "is_active": data.is_active,
           "id": personnel_id}).mappings().first()
    if not result:
        db.rollback()
        raise HTTPException(status_code=404, detail="Delivery personnel not found")
    db.commit()
    return dict(result)


@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db)):
    low_stock = db.execute(text("""
        SELECT p.product_name, g.godown_name,
               i.quantity_on_hand - i.quantity_reserved AS available_quantity,
               p.reorder_level
        FROM inventory i
        JOIN products p ON p.product_id = i.product_id
        JOIN godowns g ON g.godown_id = i.godown_id
        WHERE i.quantity_on_hand - i.quantity_reserved <= p.reorder_level
        ORDER BY available_quantity ASC
    """)).mappings().all()
    pending_orders = db.execute(text("""
        SELECT order_id, status, order_date AS created_at
        FROM orders
        WHERE status IN ('pending', 'confirmed', 'processing')
        ORDER BY created_at DESC
    """)).mappings().all()
    notifications = []
    for row in low_stock:
        notifications.append({
            "type": "low_stock", "severity": "warning",
            "title": "Low stock: " + row["product_name"],
            "message": f"{row['godown_name']} has {row['available_quantity']} available; reorder level is {row['reorder_level']}.",
            "created_at": None
        })
    for row in pending_orders:
        notifications.append({
            "type": "order", "severity": "info",
            "title": f"Order #{row['order_id']} needs attention",
            "message": f"Current order status: {row['status']}.",
            "created_at": row["created_at"]
        })
    return notifications
