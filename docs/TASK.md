# TASK.md

This document serves as the main engineering checklist for the Jomoro Koffee backend implementation. Work is divided into six logical phases. Each task is bounded to its respective microservice directory and assigned to a specific engineer, complete with validation test scripts.

---

## Phase 1: Local repository initialization, remote mapping configurations, and Prisma baseline syncing

This phase covers environment preparation, directory partitioning, and database instantiation.

- [ ] **Task 1.1: Local Directory Partitioning & Git Setup**
  * **Assignee:** Ansel
  * **Scope:** `/` (Workspace Root)
  * **Description:** Initialize three empty NestJS codebases inside `/auth-service`, `/product-service`, and `/transaction-service`. Create independent Git instances inside each directory. Set up the root-level global `.gitignore`.
  * **Verification:** Run `git status` inside each service subdirectory to confirm they have independent repository histories.

- [ ] **Task 1.2: Central Database Initialization Script**
  * **Assignee:** Ansel
  * **Scope:** `/` (Workspace Root)
  * **Description:** Create the `init.sql` script containing the centralized table definitions (`users`, `categories`, `products`, `cart_items`, `orders`, `order_items`) using exact types (`VARCHAR`, `DOUBLE`, `DATETIME(0)`). Spin up the local MySQL container or local instance and execute the script.
  * **Verification Command:**
    ```bash
    mysql -u root -p -e "USE jomoro_koffee_db; SHOW TABLES;"
    ```

- [ ] **Task 1.3: Prisma Schema Mapping & Client Generation**
  * **Assignee:** Alven (Auth), Ansel (Product), Jota (Transaction)
  * **Scope:** `/auth-service`, `/product-service`, `/transaction-service`
  * **Description:** Create `prisma/schema.prisma` in each microservice folder. Configure each schema to match only the database tables owned by its context domain. Generate the Prisma Client within each service.
  * **Verification Command:** Run `npx prisma generate` in each service folder and ensure successful output.

---

## Phase 2: Core authentication engineering

This phase covers user accounts and secure token generation inside `auth-service`.

- [ ] **Task 2.1: Custom User Validation Decorators (Without ReGex)**
  * **Assignee:** Alven
  * **Scope:** `/auth-service`
  * **Description:** Implement custom validation classes or service layer functions implementing the regex-less algorithms for registration validation (checking alphabetic-only characters in name, single `@` and suffix-based endings in email, and counting 2 numeric digits in password).
  * **Verification:** Run unit tests or mock validators against name, email, and password scenarios.

- [ ] **Task 2.2: User Registration Endpoint (`POST /auth/register`)**
  * **Assignee:** Alven
  * **Scope:** `/auth-service`
  * **Description:** Create the controller and service layer logic for user registration. Verify input constraints, match plain-text passwords, and throw `BadRequestException` (400) if constraints fail.
  * **Verification Command:**
    ```bash
    curl -X POST http://localhost:3001/auth/register \
      -H "Content-Type: application/json" \
      -d '{"email":"alven@gmail.com","password":"p1234567","name":"Alven T"}'
    ```

- [ ] **Task 2.3: User Login & Claims Issuance (`POST /auth/login`)**
  * **Assignee:** Alven
  * **Scope:** `/auth-service`
  * **Description:** Implement credentials matching using plain-text checks. Issue a JWT containing payload `{ "id": number, "role": "ADMIN" | "CUSTOMER" }`. Throw `UnauthorizedException` (401) on invalid credentials.
  * **Verification Command:**
    ```bash
    curl -X POST http://localhost:3001/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"alven@gmail.com","password":"p1234567"}'
    ```

- [ ] **Task 2.4: Profile Details Endpoint (`GET /profiles`)**
  * **Assignee:** Ansel
  * **Scope:** `/auth-service`
  * **Description:** Expose a GET endpoint protected by the global or route-bound `JwtAuthGuard`. It must parse the claims, query the user from the database, and return user profile details.
  * **Verification Command:**
    ```bash
    curl -X GET http://localhost:3001/profiles \
      -H "Authorization: Bearer <JWT_TOKEN_FROM_LOGIN>"
    ```

---

## Phase 3: Catalog browsing and administrative access control routes

This phase covers the category and product management catalog in `product-service`.

- [ ] **Task 3.1: Global Product List (`GET /products`)**
  * **Assignee:** Ansel
  * **Scope:** `/product-service`
  * **Description:** Implement catalog retrieval returning all products. This is a public route.
  * **Verification Command:**
    ```bash
    curl -X GET http://localhost:3002/products
    ```

- [ ] **Task 3.2: Get Product by ID (`GET /products/:id`)**
  * **Assignee:** Ansel
  * **Scope:** `/product-service`
  * **Description:** Retrieve a single product by its database ID. Throw `NotFoundException` (404) if the ID does not exist.
  * **Verification Command:**
    ```bash
    curl -X GET http://localhost:3002/products/1
    ```

- [ ] **Task 3.3: Categories Management (`GET /categories`)**
  * **Assignee:** Jota
  * **Scope:** `/product-service`
  * **Description:** Retrieve all product categories.
  * **Verification Command:**
    ```bash
    curl -X GET http://localhost:3002/categories
    ```

- [ ] **Task 3.4: Category Products Querying (`GET /categories/:categoryId/products`)**
  * **Assignee:** Alven
  * **Scope:** `/product-service`
  * **Description:** Retrieve all products mapped to a specific category. Throw `NotFoundException` (404) if category does not exist.
  * **Verification Command:**
    ```bash
    curl -X GET http://localhost:3002/categories/1/products
    ```

- [ ] **Task 3.5: Create Product with Name Counter (`POST /admin/products`)**
  * **Assignee:** Ansel
  * **Scope:** `/product-service`
  * **Description:** Add an admin route for product insertion. Verify that the product name contains at least 3 words using custom array-splitting calculations. Protected by `JwtAuthGuard` and role validation metadata checking for `ADMIN`.
  * **Verification Command:**
    ```bash
    curl -X POST http://localhost:3002/admin/products \
      -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
      -H "Content-Type: application/json" \
      -d '{"name":"Jomoro Espresso Arabica","price":18000.0,"stock":50,"categoryId":1}'
    ```

- [ ] **Task 3.6: Update Product details (`POST /admin/products/:id/update`)**
  * **Assignee:** Ansel
  * **Scope:** `/product-service`
  * **Description:** Update product name, price, stock, or category. Verify the name contains at least 3 words. Throw `NotFoundException` (404) if the product is not found. Protected for `ADMIN`.
  * **Verification Command:**
    ```bash
    curl -X POST http://localhost:3002/admin/products/1/update \
      -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
      -H "Content-Type: application/json" \
      -d '{"name":"Jomoro Premium Blend","price":19000.0,"stock":45,"categoryId":1}'
    ```

- [ ] **Task 3.7: Delete Product (`POST /admin/products/:id/delete`)**
  * **Assignee:** Ansel
  * **Scope:** `/product-service`
  * **Description:** Delete a product from the database. Protected for `ADMIN`.
  * **Verification Command:**
    ```bash
    curl -X POST http://localhost:3002/admin/products/1/delete \
      -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
    ```

- [ ] **Task 3.8: Reduce Product Stock (`POST /admin/products/:id/reduce`)**
  * **Assignee:** Alven
  * **Scope:** `/product-service`
  * **Description:** Service mesh internal endpoint to reduce stock. Must throw `BadRequestException` (400) if the requested stock is greater than current stock.
  * **Verification Command:**
    ```bash
    curl -X POST http://localhost:3002/admin/products/1/reduce \
      -H "Authorization: Bearer <SERVICE_JWT_TOKEN>" \
      -H "Content-Type: application/json" \
      -d '{"amount":5}'
    ```

---

## Phase 4: Hydrated shopping cart systems and cross-service APIs

This phase covers cart storage inside `transaction-service` and fetching product details from `product-service`.

- [ ] **Task 4.1: Retrieve Cart with Mesh Hydration (`GET /cart`)**
  * **Assignee:** Jota
  * **Scope:** `/transaction-service`
  * **Description:** Get all items in the shopping cart for the active user. Use `fetch` or Axios to loop/batch queries to `product-service` (`GET /products/:id`) on port 3002 to hydrate the product details. Protected for `CUSTOMER`.
  * **Verification Command:**
    ```bash
    curl -X GET http://localhost:3003/cart \
      -H "Authorization: Bearer <CUSTOMER_JWT_TOKEN>"
    ```

- [ ] **Task 4.2: Add Product to Cart (`POST /cart`)**
  * **Assignee:** Jota
  * **Scope:** `/transaction-service`
  * **Description:** Insert an item into the `cart_items` table. Validate product existence in `product-service` before adding. If item already exists in cart, update the quantity. Protected for `CUSTOMER`.
  * **Verification Command:**
    ```bash
    curl -X POST http://localhost:3003/cart \
      -H "Authorization: Bearer <CUSTOMER_JWT_TOKEN>" \
      -H "Content-Type: application/json" \
      -d '{"productId":1,"quantity":2}'
    ```

- [ ] **Task 4.3: Update Cart Item Quantity (`POST /cart/:product_id/update`)**
  * **Assignee:** Jota
  * **Scope:** `/transaction-service`
  * **Description:** Update the quantity of a specific product in the cart. Protected for `CUSTOMER`.
  * **Verification Command:**
    ```bash
    curl -X POST http://localhost:3003/cart/1/update \
      -H "Authorization: Bearer <CUSTOMER_JWT_TOKEN>" \
      -H "Content-Type: application/json" \
      -d '{"quantity":5}'
    ```

- [ ] **Task 4.4: Delete Cart Item (`POST /cart/:product_id/delete`)**
  * **Assignee:** Jota
  * **Scope:** `/transaction-service`
  * **Description:** Remove a product row from the user's cart. Protected for `CUSTOMER`.
  * **Verification Command:**
    ```bash
    curl -X POST http://localhost:3003/cart/1/delete \
      -H "Authorization: Bearer <CUSTOMER_JWT_TOKEN>"
    ```

- [ ] **Task 4.5: Clear Cart (`POST /cart/clear`)**
  * **Assignee:** Jota
  * **Scope:** `/transaction-service`
  * **Description:** Clear all items from the user's shopping cart. Protected for `CUSTOMER`.
  * **Verification Command:**
    ```bash
    curl -X POST http://localhost:3003/cart/clear \
      -H "Authorization: Bearer <CUSTOMER_JWT_TOKEN>"
    ```

---

## Phase 5: Distributed transaction checkout pipelines

This phase covers order generation, cross-service stock reduction, and cart cleanup.

- [ ] **Task 5.1: Create Order & Execute Checkout Mesh (`POST /orders`)**
  * **Assignee:** Alven
  * **Scope:** `/transaction-service`
  * **Description:** Checkout endpoint. Retrieve the cart, verify inventory in `product-service`, calculate total price, decrement inventory via `/admin/products/:id/reduce` in `product-service`, insert order and order items, and clear the cart. Protected for `CUSTOMER`.
  * **Verification Command:**
    ```bash
    curl -X POST http://localhost:3003/orders \
      -H "Authorization: Bearer <CUSTOMER_JWT_TOKEN>"
    ```

- [ ] **Task 5.2: Get User Orders (`GET /orders`)**
  * **Assignee:** Alven
  * **Scope:** `/transaction-service`
  * **Description:** List orders for the authenticated user. If `role` is `ADMIN`, return all system orders. Protected for `CUSTOMER` and `ADMIN`.
  * **Verification Command:**
    ```bash
    curl -X GET http://localhost:3003/orders \
      -H "Authorization: Bearer <CUSTOMER_JWT_TOKEN>"
    ```

- [ ] **Task 5.3: Update Order Status / Get Details (`POST /orders/:id`)**
  * **Assignee:** Alven
  * **Scope:** `/transaction-service`
  * **Description:** View or update details/status for an order by ID. Protected for `CUSTOMER` and `ADMIN`.
  * **Verification Command:**
    ```bash
    curl -X POST http://localhost:3003/orders/1 \
      -H "Authorization: Bearer <CUSTOMER_JWT_TOKEN>" \
      -H "Content-Type: application/json" \
      -d '{"status":"COMPLETED"}'
    ```

---

## Phase 6: Unified Swagger end-to-end integration mapping

This phase maps and verifies swagger endpoints for public API compilation.

- [ ] **Task 6.1: Swagger UI Module Bindings**
  * **Assignee:** Ansel
  * **Scope:** `/auth-service`, `/product-service`, `/transaction-service`
  * **Description:** Initialize `@nestjs/swagger` in all three applications. Bind Swagger module on the base route `/api/docs` or equivalent path. Add correct OpenAPI operation tags and model annotations to controller handlers and DTO files.
  * **Verification:** Run all three microservices and navigate to:
    - `http://localhost:3001/api/docs` (Auth API)
    - `http://localhost:3002/api/docs` (Product API)
    - `http://localhost:3003/api/docs` (Transaction API)
