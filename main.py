from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel, EmailStr
from jose import jwt
from datetime import datetime, timedelta
import sqlite3
import hashlib

# ================= APP =================

app = FastAPI(title="Bus Tracking System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "secret123"
ALGORITHM = "HS256"
EXPIRE_MIN = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

USER_DB = "users.db"
BUS_DB = "bus_system.db"

# ================= DB INIT =================

def init_db():

    conn = sqlite3.connect(USER_DB)
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        student_id TEXT,
        phone TEXT
    )
    """)

    conn.commit()
    conn.close()

    conn = sqlite3.connect(BUS_DB)
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS BusInfo (
        stop_name TEXT PRIMARY KEY,
        bus_no TEXT,
        time TEXT,
        driver_name TEXT,
        driver_mobile TEXT,
        conductor_name TEXT,
        conductor_mobile TEXT,
        route TEXT
    )
    """)

    conn.commit()
    conn.close()

init_db()

# ================= MODELS =================

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    student_id: str = None
    phone: str = None


class Search(BaseModel):
    pickup: str
    drop: str


class BusData(BaseModel):
    stop_name: str
    bus_no: str
    time: str
    driver_name: str
    driver_mobile: str
    conductor_name: str
    conductor_mobile: str
    route: str

# ================= HASH =================

def hash_pass(p):
    return hashlib.sha256(p.encode()).hexdigest()


def verify_pass(p, h):
    return hashlib.sha256(p.encode()).hexdigest() == h

# ================= TOKEN =================

def create_token(data):
    expire = datetime.utcnow() + timedelta(minutes=EXPIRE_MIN)
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

# ================= SIGNUP =================

@app.post("/api/signup")
def signup(user: UserSignup):

    conn = sqlite3.connect(USER_DB)
    c = conn.cursor()

    c.execute("SELECT * FROM users WHERE email=?", (user.email,))
    if c.fetchone():
        raise HTTPException(status_code=400, detail="User already exists")

    c.execute("""
    INSERT INTO users(name,email,password,student_id,phone)
    VALUES (?,?,?,?,?)
    """, (
        user.name,
        user.email,
        hash_pass(user.password),
        user.student_id,
        user.phone
    ))

    conn.commit()
    conn.close()

    return {"message": "Signup successful"}

# ================= LOGIN =================

@app.post("/api/login")
def login(form: OAuth2PasswordRequestForm = Depends()):

    conn = sqlite3.connect(USER_DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT * FROM users WHERE email=?", (form.username,))
    user = c.fetchone()

    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email")

    if not verify_pass(form.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid password")

    token = create_token({"sub": user["email"]})

    return {"access_token": token, "token_type": "bearer"}

# ================= FORGOT PASSWORD =================

@app.post("/api/forgot-password")
def forgot(data: dict):

    email = data.get("email")
    new_password = data.get("new_password")

    if not email or not new_password:
        return {"error": "Email and new password required"}

    conn = sqlite3.connect(USER_DB)
    c = conn.cursor()

    c.execute("SELECT * FROM users WHERE email=?", (email,))
    user = c.fetchone()

    if not user:
        conn.close()
        return {"error": "User not found"}

    c.execute("""
    UPDATE users
    SET password=?
    WHERE email=?
    """, (hash_pass(new_password), email))

    conn.commit()
    conn.close()

    return {"message": "Password updated successfully"}

# ================= ADMIN UPDATE =================

@app.post("/admin/update")
def update_bus(bus: BusData):

    conn = sqlite3.connect(BUS_DB)
    c = conn.cursor()

    c.execute("""
    INSERT OR REPLACE INTO BusInfo
    VALUES (?,?,?,?,?,?,?,?)
    """, (
        bus.stop_name,
        bus.bus_no,
        bus.time,
        bus.driver_name,
        bus.driver_mobile,
        bus.conductor_name,
        bus.conductor_mobile,
        bus.route
    ))

    conn.commit()
    conn.close()

    return {"message": "Bus updated"}

# ================= ADMIN DASHBOARD =================

@app.get("/admin/all-buses")
def all_buses():

    conn = sqlite3.connect(BUS_DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT * FROM BusInfo")
    rows = c.fetchall()

    conn.close()

    return [dict(r) for r in rows]

# ================= SEARCH =================

@app.post("/search")
def search(data: Search):

    conn = sqlite3.connect(BUS_DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT * FROM BusInfo")
    rows = c.fetchall()

    conn.close()

    pickup = data.pickup.strip().lower()
    drop = data.drop.strip().lower()

    for r in rows:

        if not r["route"]:
            continue

        stops = [s.strip().lower() for s in r["route"].split("-")]

        if pickup in stops and drop in stops:

            p = stops.index(pickup)
            d = stops.index(drop)

            if p < d:

                return {
                    "nearest_stop": r["stop_name"],
                    "stop_name": stops[-1],
                    "bus_no": r["bus_no"],
                    "time": r["time"],
                    "driver_name": r["driver_name"],
                    "driver_mobile": r["driver_mobile"],
                    "conductor_name": r["conductor_name"],
                    "conductor_mobile": r["conductor_mobile"],
                    "route": r["route"]
                }

    return {"error": "No bus found"}

# ================= STOP SEARCH (DASHBOARD FIX) =================

@app.get("/stop")
def get_stop(stop_name: str):

    conn = sqlite3.connect(BUS_DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT * FROM BusInfo WHERE LOWER(stop_name)=LOWER(?)", (stop_name.strip(),))
    row = c.fetchone()

    conn.close()

    if not row:
        return {"error": "Stop not found"}

    return dict(row)

# ================= ROOT =================

@app.get("/")
def home():
    return {"message": "Bus Tracking System Running"}