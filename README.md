# 💰 FinanceTracker — Full-Stack Finance Dashboard

A full-stack finance management system with **role-based access control**, real-time dashboard analytics, and complete transaction management.

---

## 🖥️ What Does This App Do?

| Feature | Description |
|---|---|
| 🔐 **Auth** | Register / Login with JWT tokens |
| 👥 **Roles** | Viewer · Analyst · Admin — each with different permissions |
| 📊 **Dashboard** | Live totals: income, expenses, net balance, monthly trends, category charts |
| 📋 **Records** | Add, view, filter, edit, and soft-delete financial transactions |
| 🛡️ **Access Control** | Enforced at the API level — not just on the frontend |

---

## 🏗️ Project Structure

```
FinanceTracker/
├── backend/          ← Node.js + Express API (port 5000)
│   ├── config/       ← MongoDB connection
│   ├── controllers/  ← Route handlers (thin layer, no business logic)
│   ├── middleware/   ← JWT auth + RBAC guards
│   ├── models/       ← Mongoose schemas (User, Record)
│   ├── routes/       ← API route definitions
│   ├── services/     ← Business logic + MongoDB aggregation pipelines
│   ├── utils/        ← JWT helpers, response formatter
│   ├── validations/  ← Joi input validation schemas
│   └── server.js     ← Entry point
│
└── frontend/         ← React + Vite app (port 5173)
    └── src/
        ├── components/   ← GlassCard, GlassButton, AddTransactionModal, Navbar
        ├── context/      ← AuthContext (global auth state)
        ├── pages/        ← Dashboard, Records, Login, Register
        └── services/     ← Axios API client
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or [MongoDB Atlas](https://cloud.mongodb.com))

---

### 1. Clone the Repository

```bash
git clone https://github.com/Mathesh-299/FinanceTracker.git
cd FinanceTracker
```

---

### 2. Setup the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/financetracker
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
```

> 💡 If using MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string.

Start the backend:

```bash
npm run dev
```

✅ API running at `http://localhost:5000`

---

### 3. Setup the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

✅ App running at `http://localhost:5173`

---

## 👤 User Roles & Permissions

| Action | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| View dashboard summary | ✅ | ✅ | ✅ |
| View records list | ❌ | ✅ | ✅ |
| Search & filter records | ❌ | ✅ | ✅ |
| Add new transaction | ❌ | ❌ | ✅ |
| Edit a transaction | ❌ | ❌ | ✅ |
| Delete a transaction | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

> To test as admin: register with `"role": "admin"` in the request body.

---

## 🔌 API Reference

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create a new user account |
| `POST` | `/api/auth/login` | Public | Login and receive a JWT token |
| `GET` | `/api/auth/me` | Any logged-in user | Get your own profile |

### Dashboard (all authenticated users)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/records/dashboard/summary` | Total income, expenses, net balance |
| `GET` | `/api/records/dashboard/recent` | Latest 10 transactions |
| `GET` | `/api/records/dashboard/monthly` | Monthly income/expense trends |
| `GET` | `/api/records/dashboard/categories` | Spending by category |

### Records

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/records` | Analyst + Admin | List records (with filters & pagination) |
| `GET` | `/api/records/:id` | Analyst + Admin | Get a single record |
| `POST` | `/api/records` | Admin only | Create a new transaction |
| `PATCH` | `/api/records/:id` | Admin only | Update a transaction |
| `DELETE` | `/api/records/:id` | Admin only | Soft-delete a transaction |

### Query Parameters for `GET /api/records`

```
?type=income|expense
?category=Food|Rent|Salary|...
?startDate=2024-01-01
?endDate=2024-12-31
?search=groceries
?page=1&limit=10
```

### Transaction Fields

```json
{
  "amount": 1500.00,
  "type": "income",
  "category": "Salary",
  "date": "2024-04-01",
  "notes": "April salary payment"
}
```

**Income categories:** `Salary` · `Freelance` · `Investment` · `Business`  
**Expense categories:** `Food` · `Rent` · `Transport` · `Utilities` · `Healthcare` · `Education` · `Entertainment` · `Other`

---

## 🛠️ Tech Stack

### Backend
| Package | Purpose |
|---|---|
| Express.js | Web framework |
| MongoDB + Mongoose | Database & ODM |
| JWT (jsonwebtoken) | Stateless authentication |
| Bcrypt.js | Password hashing |
| Joi | Request body validation |
| Helmet | HTTP security headers |
| Morgan | Request logging |
| Express Rate Limit | Brute-force protection (100 req / 15 min) |

### Frontend
| Package | Purpose |
|---|---|
| React 19 + Vite | UI framework + build tool |
| React Router v7 | Client-side routing |
| Axios | HTTP client with interceptors |
| Recharts | Area chart + Pie chart |
| Framer Motion | Animations & transitions |
| Tailwind CSS v4 | Utility-first styling |
| React Toastify | Toast notifications |
| Lucide React | Icon library |

---

## 🔒 Security Features

- **Passwords** are hashed with bcrypt (never stored in plain text)
- **JWT tokens** are signed with a server secret and expire after 7 days
- **RBAC middleware** protects every route at the API level
- **Soft delete** — records are marked `isDeleted: true`, never physically removed
- **Rate limiting** — 100 requests per 15 minutes per IP
- **Helmet** — sets secure HTTP headers automatically
- **Input validation** — all request bodies are validated with Joi before processing

---

## 📁 Key Design Decisions

### Controller → Service → Model Pattern
- **Controllers** are thin — they only validate input, call a service, and send the response
- **Services** contain all business logic, DB queries, and aggregation pipelines
- **Models** define the schema and indexes — nothing else

### MongoDB Aggregation for Dashboard
Instead of fetching all records into Node.js and computing totals in JavaScript, the dashboard uses **MongoDB aggregation pipelines** (`$group`, `$match`, `$sort`, `$cond`) to compute everything inside the database engine. This is much faster and scales well.

### Consistent API Response Shape
Every API response follows the same structure:
```json
{
  "success": true,
  "message": "Human readable message",
  "data": { }
}
```

---

## 🧪 Testing the API (Postman)

A ready-to-import Postman collection is included:

```
backend/finance_postman_collection.json
```

Import it into Postman → set the `base_url` variable to `http://localhost:5000` → run the **Register** and **Login** requests first to get your token → all other requests auto-attach it.

---

## 📌 Assumptions Made

1. **Role assignment at registration** — users self-select their role when signing up (in a real system, only admins would assign roles)
2. **No email verification** — registration is immediate
3. **Soft delete only** — deleted records stay in the database with `isDeleted: true` for audit purposes
4. **Single currency** — all amounts are treated as USD

---

## 👨‍💻 Author

**Mathesh Murugan**  
GitHub: [Mathesh-299](https://github.com/Mathesh-299)
