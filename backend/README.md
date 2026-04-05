# Finance Data Processing and Access Control Backend

This API provides a fully-functional finance dashboard backend. It handles authentication, Role-Based Access Control (RBAC), secure storage, and complex dashboard aggregation using MongoDB.

## Tech Stack
- **Node.js** & **Express.js** 
- **MongoDB** & **Mongoose** (Database & ODM)
- **JWT (jsonwebtokens)** (Authentication stateless mechanism)
- **Joi** (Request Validation)
- **Bcrypt.js** (Password Hashing)

## Running the Application

1. Make sure you have MongoDB running locally, or replace the `MONGO_URI` in `.env`.
2. Copy the example `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Install Dependencies:
   ```bash
   npm install
   ```
4. Start the Application:
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:5000` 

## Interview Overview & Enhancements

### 1. Why Role-Based Access Control (RBAC) is used
RBAC limits what users can see and do based on their assigned role (`viewer`, `analyst`, `admin`). This provides:
- **Security:** Ensure users can only invoke endpoints and view data they are authorized to access.
- **Maintainability:** Abstracting role checks away from business logic via middleware (e.g. `authorizeRoles('admin', 'analyst')`) ensures adding new roles or permissions only requires changing middleware injections on routes, not refactoring controller logic.

### 2. How JWT (JSON Web Token) authentication works
Our application uses stateless API calls. Upon a successful login (`/api/auth/login`), the server signs a JWT containing a payload (the User's ID and `role`) using a strong secret key (`JWT_SECRET`). 
- **Statelessness:** The server does not store active tokens in memory or database. When the client sends the token in the `Authorization: Bearer <TOKEN>` header, the server decodes and validates the signature using the same secret. 
- **Efficiency:** This eliminates database lookups for session IDs. The `authenticateUser` middleware extracts the token, verifies it, fetches the user from MongoDB (to grab the latest status and verify the user wasn't deleted), and injects `req.user` for downstream routes.

### 3. How MongoDB aggregation is used for analytics
The reporting features in the `/api/dashboard/*` endpoints rely entirely on MongoDB aggregation pipelines rather than processing records in Node.js.
- By structuring sequential operations (like `$match`, `$group`, `$sort`), complex multi-metric math is pushed entirely to the database engine.
- For example, `getDashboardSummary` leverages conditional `$sum` operators (`$cond` evaluating the `$type` of the transaction) within a single `$group` stage. This avoids making two separate queries for total income vs overall expenses or returning thousands of records over the network to memory.

### 4. How indexing improves performance
Proper indexing ensures DB queries can rapidly sift through records as tables scale from thousands to millions of entries.
- **Unique Indexes:** A unique index is placed on `email` in the User model to guarantee data integrity across the database at runtime and speed up login lookups.
- **Compound Indexes:** In the `Record` schema, compound indexing such as on `{ date: -1, type: 1 }` enables our database to isolate specific time ranges or transaction types significantly faster without a full collection table-scan. This is especially vital for the monthly trend pipelines.
- **Conditional Indexes:** Soft delete patterns filter on the `isDeleted: false` flag. Indexing this flag dramatically speeds up practically all collection lookups.

### 5. How your architecture improves scalability and maintainability
We've utilized a clean **Controller-Service-Model** layer pattern:
- **Routes Layer:** Handles definitions, injects request validation schemas, and applies our RBAC middleware guards before moving to logic.
- **Controllers Layer:** Stripped completely of complex business logic. Controllers invoke service functions and send standardized HTTP responses using the utility helpers (`sendSuccess`, `sendError`).
- **Services Layer:** Contains the actual backend processing, database interaction, pagination, filtering, and aggregation abstractions. Services can be exported and reused elsewhere.
- **Error Handling:** Errors generated inside Services or Controllers are funneled through Express's `next(error)` mechanism into a centralized error handler (`errorMiddleware.js`), which parses Mongoose Validation exceptions vs generic codes gracefully ensuring consistent error models in client integrations.

This structure allows different modules to scale seamlessly. If the aggregation needs to move to its own microservice or if a secondary database driver must be introduced, only the data interactions in `services/` will need refactoring.
