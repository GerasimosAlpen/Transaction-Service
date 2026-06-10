# Jomoro Koffee - Microservices Backend Specifications

This repository serves as the central orchestration workspace for the development of the **Jomoro Koffee** backend engine. The system is split into three isolated NestJS applications, each running on a distinct port, maintained in its own GitHub repository, and interacting via a clean REST-based service mesh.

---

## 🛠️ System Overview & Port Mapping

| Service Name | Repository Path | Port | Primary Database Tables | Owner |
| :--- | :--- | :---: | :--- | :--- |
| **Auth Service** | `/auth-service` | `3001` | `users` | **Alven** |
| **Product Service** | `/product-service` | `3002` | `categories`, `products` | **Ansel** |
| **Transaction Service** | `/transaction-service` | `3003` | `cart_items`, `orders`, `order_items` | **Jota** |

---

## 🏗️ Architectural Specifications

### 1. Database Isolation
- **Central Instance:** A single MySQL instance is shared across services but logically segmented.
- **ORM Config:** Each service maintains its own Prisma schema mapping strictly to the database tables within its own context boundary. Cross-service joins at the DB level are banned; relations are hydrated programmatically at runtime.

### 2. Authorization & Claims
- **Provider:** All authentication credentials and claims verification occur in `/auth-service`.
- **Payload Structure:** Tokens encode verified claims payload: `{ "id": number, "role": "ADMIN" | "CUSTOMER" }`.
- **Bearer Tokens:** Clients authorize requests using standard `Authorization: Bearer <token>` HTTP headers, processed at each microservice boundary using Passport JWT strategies and roles-based guards.
- **Plain-text Security:** Passwords must be handled and verified using exact plain-text matching (no hashing/bcrypt algorithms).

### 3. Service Mesh & Integrations
- **Inter-service Calls:** Mesh hydration and order transactions must be executed via standard `fetch` methods or NestJS HttpService client requests between local ports.
- **CORS Configuration:** Active Cross-Origin Resource Sharing is enabled across all three microservice entry points.
- **Swagger Documentation:** Each microservice hosts a local Swagger interactive UI mapping out its respective controller routes.

### 4. Pipeline Input Validations
- **Execution:** Validation checks are configured globally at the NestJS pipeline level using `class-validator` and `class-transformer`.
- **Banned ReGex Policy:** Regular Expressions (ReGex) are completely prohibited in input checks. Validation rules (e.g. name syntax, email validation, password digits, product word count) must be written procedurally using native JavaScript loops and string methods.
