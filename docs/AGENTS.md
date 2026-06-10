# AGENTS.md

This document establishes the resource allocation, ownership boundaries, and operational structures for the Jomoro Koffee backend engineering squad. It delineates the specific roles and endpoint assignments for developers Alven, Ansel, and Jota.

---

## 1. RACI Responsibilities Matrix

The matrix below defines the project responsibility structure:
- **R (Responsible):** The engineer who does the work to achieve the task.
- **A (Accountable):** The person ultimately answerable for the correct and thorough completion of the task (usually the lead/owner).
- **C (Consulted):** Those whose opinions are sought, typically subject matter experts.
- **I (Informed):** Those kept up-to-date on progress or decisions.

| Functional Component / Epic | Alven | Ansel | Jota |
| :--- | :---: | :---: | :---: |
| **Core Authentication & User Management** | R/A | C | C |
| **Product Catalog & Category Engine** | C | R/A | R |
| **Cart Subsystem & Hydration Mesh** | C | C | R/A |
| **Transaction Checkout Pipeline** | R/A | C | C |
| **Central Database Schema (.sql Initializer)** | C | R/A | C |
| **Prisma ORM Configurations (per service)** | R | R/A | R |
| **Inter-Service Mesh Integration (Axios/Fetch)** | R | C | R |
| **Global Swagger Portals & CORS Policies** | I | R/A | I |

---

## 2. Port Mapping & Endpoint Ownership Matrix

The system consists of three independent NestJS services, running on dedicated local ports and separate Git repository origins. The 19 endpoints are distributed as follows:

### Auth Service (Port 3001)
- **Base URL:** `http://localhost:3001`
- **Git Repo Context:** `/auth-service`

| Path | Method | Assignee | Reviewers | JWT Shield | Role Allowed |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `/auth/register` | `POST` | **Alven** | Ansel, Jota | No | Public / Guest |
| `/auth/login` | `POST` | **Alven** | Ansel, Jota | No | Public / Guest |
| `/profiles` | `GET` | **Ansel** | Alven, Jota | Yes | CUSTOMER, ADMIN |

---

### Product Service (Port 3002)
- **Base URL:** `http://localhost:3002`
- **Git Repo Context:** `/product-service`

| Path | Method | Assignee | Reviewers | JWT Shield | Role Allowed |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `/products` | `GET` | **Ansel** | Alven, Jota | No | Public / Guest |
| `/products/:id` | `GET` | **Ansel** | Alven, Jota | No | Public / Guest |
| `/categories` | `GET` | **Jota** | Alven, Ansel | No | Public / Guest |
| `/categories/:categoryId/products` | `GET` | **Alven** | Ansel, Jota | No | Public / Guest |
| `/admin/products` | `POST` | **Ansel** | Alven, Jota | Yes | ADMIN |
| `/admin/products/:id/update` | `POST` | **Ansel** | Alven, Jota | Yes | ADMIN |
| `/admin/products/:id/delete` | `POST` | **Ansel** | Alven, Jota | Yes | ADMIN |
| `/admin/products/:id/reduce` | `POST` | **Alven** | Ansel, Jota | Yes | ADMIN (Internal Mesh Authorized) |

---

### Transaction Service (Port 3003)
- **Base URL:** `http://localhost:3003`
- **Git Repo Context:** `/transaction-service`

| Path | Method | Assignee | Reviewers | JWT Shield | Role Allowed |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `/cart` | `GET` | **Jota** | Alven, Ansel | Yes | CUSTOMER |
| `/cart` | `POST` | **Jota** | Alven, Ansel | Yes | CUSTOMER |
| `/cart/:product_id/update` | `POST` | **Jota** | Alven, Ansel | Yes | CUSTOMER |
| `/cart/:product_id/delete` | `POST` | **Jota** | Alven, Ansel | Yes | CUSTOMER |
| `/cart/clear` | `POST` | **Jota** | Alven, Ansel | Yes | CUSTOMER |
| `/orders` | `GET` | **Alven** | Ansel, Jota | Yes | CUSTOMER, ADMIN |
| `/orders/:id` | `POST` | **Alven** | Ansel, Jota | Yes | CUSTOMER, ADMIN |
| `/orders` | `POST` | **Alven** | Ansel, Jota | Yes | CUSTOMER |

---

## 3. Cross-Service Collaboration Boundaries

### Code Review and Pairing Rules
1. **Contract Locking:** Before writing any inter-service code (e.g., fetching product details from port 3003 to port 3002), the developers involved must lock down the JSON request/response schema. This mock schema must be declared as a TypeScript interface and stored in a shared docs file or documented in the respective service's API contract directory.
2. **Review Requirement:** Every pull request requires at least one approval from a designated reviewer (as specified in the tables above) before merging into target development branches.
3. **Local Testing Requirements:** Any changes to endpoints that communicate over the service mesh must be verified locally with all three services running simultaneously on ports 3001, 3002, and 3003.

---

## 4. Shared DevOps & Config Owners

### Environment Variables Matrix
The squad shares a centralized environment template. Ansel is the primary maintainer of all `.env.example` configurations.

| Variable Name | Description | Scope | Maintenance Owner |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | MySQL Connection String | All Services | Ansel |
| `JWT_SECRET` | Secret key used to sign and verify claims | Auth, Product, Transaction | Alven |
| `PORT` | Local service listener port (3001, 3002, 3003) | Individual Services | Assignees |
| `PRODUCT_SERVICE_URL` | Microservice mesh HTTP base path for Product-Service | Transaction Service | Jota |

### Database Governance
1. **Schema Updates:** Any schema change must first be updated in the root database setup script (`init.sql`).
2. **Prisma Generation:** If table attributes are altered, the respective database/service owners must run local schema pulls (`npx prisma db pull`) and generate clients (`npx prisma generate`) in sync. No service-specific migration may bypass Ansel's review.
