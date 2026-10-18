# Meridian

**A calm, deliberate operating layer for hospital pharmacies.**

[![Python](https://img.shields.io/badge/Python-3.10-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-005571?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Experiment-Complete-D97706)](#)

**Project type:** Full stack application  
**Current focus:** Pharmacy point of sale and inventory management

---

## The problem

Pharmacy floors are busy places. The software used to manage them should stay out of the way. However, inventory, dispensing, and financials are often scattered across three different tools that demand attention rather than reducing it.

Meridian explores how to unify these daily operations into a single, focused workspace. It enforces strict inventory rules at the database level and adapts the interface based on who is logged in, removing unnecessary noise from the screen.

## What I built

Meridian is a production-ready point of sale and inventory management system.

The core workflow covers the full dispensing lifecycle:

1. **Dispensing.** A cashier searches for medication, adds it to a cart, and processes a payment. Stock is decremented atomically at the database level to prevent overselling.
2. **Inventory management.** An inventory manager adds new products, assigns suppliers, and tracks low stock alerts.
3. **Access control.** An admin provisions accounts for the staff. Public registration is locked, ensuring only verified personnel can access the system.
4. **Auditing.** Every transaction generates an immutable receipt and payment record, tied to a specific customer and pharmacist.

## How the system works

### 1. Authentication and Roles

The application uses stateless JSON Web Tokens (JWT). Access tokens expire in 30 minutes, while refresh tokens last for 7 days. The frontend silently refreshes the access token when it expires, keeping the user logged in without interruption.

Role-Based Access Control (RBAC) is enforced on both the backend and the frontend.

| Role                  | Access Level                             |
| --------------------- | ---------------------------------------- |
| `admin`               | Full access, including user provisioning |
| `pharmacist`          | Sales, inventory, customers, suppliers   |
| `cashier`             | Point of sale, customers, sales history  |
| `inventory-manager`   | Inventory, suppliers, low stock alerts   |
| `pharmacy-technician` | Point of sale, customers                 |

### 2. Database and Inventory Rules

PostgreSQL is hosted on Supabase. The backend uses SQLAlchemy to manage relationships and enforce constraints.

When a sale is processed, the system does not simply subtract a number. The `create_sale_item` endpoint checks the current stock level, verifies the requested quantity, and performs an atomic decrement. If the requested quantity exceeds available stock, the transaction is rejected before any database writes occur.

### 3. Frontend Architecture

The frontend is built with Next.js 14 and Tailwind CSS. It uses Framer Motion for subtle transitions that make the interface feel responsive without being distracting.

All API calls are intercepted by a custom `api.ts` wrapper. If a request returns a `401 Unauthorized`, the wrapper attempts to use the refresh token to get a new access token, saves it, and retries the original request. If the refresh token is invalid, the user is cleanly logged out.

## Engineering decisions

- **Disable public registration.** The `/auth/register` endpoint requires an admin token. The first admin is generated via a server-side CLI script.
- **Atomic stock decrements.** Inventory is decremented inside the same database transaction that creates the sale item. This prevents race conditions.
- **Explicit RBAC routing.** The frontend evaluates the JWT role claim before rendering the sidebar. Unauthorized routes immediately redirect to the dashboard.
- **Serverless deployment.** The backend and frontend are configured to run as a monorepo on Vercel, routing `/api/*` traffic to FastAPI and everything else to Next.js.

## Technology

| Area        | Technology                           |
| ----------- | ------------------------------------ |
| Backend     | FastAPI, Python 3.10                 |
| Database    | PostgreSQL, SQLAlchemy 2.0, Supabase |
| Frontend    | Next.js 14, React, Tailwind CSS      |
| Auth        | PyJWT, Passlib, Bcrypt               |
| Environment | uv, Node.js                          |
| Deployment  | Vercel                               |

## Project structure

```text
meridian/
├── app/                  # FastAPI backend
│   ├── core/
│   ├── models/
│   ├── repositories/
│   ├── routers/
│   ├── schemas/
│   └── services/
├── frontend/             # Next.js frontend
│   ├── src/app/
│   ├── src/components/
│   └── src/lib/
├── tests/                # Pytest suite
├── vercel.json           # Monorepo deployment config
├── create_admin.py       # Production admin seeder
└── requirements.txt
```

## Running the project

### Requirements

- Python 3.10
- Node.js 18+
- [uv](https://docs.astral.sh/uv/)

### Set up the backend

From the project root:

```bash
uv venv venv --python 3.10
source venv/bin/activate
uv pip install -r requirements.txt
```

Configure your environment variables:

```bash
cp .env.example .env
# Edit .env with your Supabase DATABASE_URL and SECRET_KEY
```

Initialize the database and create the first admin:

```bash
python3 -c "from app.database import engine, Base; import app.models; Base.metadata.create_all(bind=engine)"
python3 create_admin.py --username admin --email admin@example.com --password Admin123!
```

Run the server:

```bash
uvicorn app.main:app --reload --port 8000
```

### Set up the frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

### Run the automated tests

The backend includes a test suite covering the RBAC matrix, token validation, and database constraints.

```bash
pytest -v
```

## Limitations and next steps

This version establishes a complete core loop for pharmacy operations.

The next steps are to:

1. Add end-of-day shift reports for cashiers.
2. Implement a printable receipt view.
3. Integrate a barcode scanner input for faster dispensing.
4. Add automated email delivery.
