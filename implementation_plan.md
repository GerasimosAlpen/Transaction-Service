# Orders & Checkout Implementation Plan

This plan details the implementation of the Order History and Checkout Process features for the `transaction-service` as outlined in the requirements.

## User Review Required

Please review the proposed plan below. Let me know if you approve or have any changes before I begin execution.

## Open Questions

> [!WARNING]
> **Authentication for Stock Reduction in Product Service:**
> During the checkout process (`POST /orders`), the transaction service needs to call `POST /admin/products/:id/reduce` on the Product Service to decrease stock. According to `DESIGN.md`, this endpoint is protected for the `ADMIN` role. Since the user initiating the checkout has a `CUSTOMER` role, their JWT token will be rejected by the Product Service. 
> 
> **Question:** How should the transaction service authenticate with the Product Service for stock reduction?
> 1. Should the transaction service sign a temporary JWT with the `ADMIN` role using the shared `JWT_SECRET`? (Note: The requirements state "Token generation is exclusively handled in Auth Service", but this might be an exception for service-to-service communication).
> 2. Is there a specific bypass or API Key we should use in the HTTP headers when calling the Product Service? 
> 3. Should we forward the customer's JWT and expect the Product Service to have an exception for stock reduction?

## Proposed Changes

### `transaction-service/src/orders`

We will create a new NestJS module for Orders.

#### [NEW] `orders.module.ts`
- Register `OrdersController` and `OrdersService`.
- Import `PrismaModule`.

#### [NEW] `orders.controller.ts`
Define the endpoints protected by `JwtAuthGuard` and `RolesGuard`:
- `@Get()` -> `getOrders`: Restricted to `CUSTOMER` and `ADMIN`.
- `@Post(':id')` -> `getOrderDetails`: Restricted to `CUSTOMER` and `ADMIN`.
- `@Post()` -> `checkout`: Restricted to `CUSTOMER`.

#### [NEW] `orders.service.ts`
Implement the business logic:
- `getOrders(userId, role)`: Fetch orders from Prisma. If `ADMIN`, return all orders. Otherwise, return orders where `userId` matches.
- `getOrderDetails(orderId, userId, role)`: Fetch order items from Prisma. Make parallel requests to the Product Service (`GET /products/:id`) to hydrate product details.
- `checkout(userId, token)`: 
  1. Fetch cart items from DB.
  2. Throw `BadRequestException` if cart is empty.
  3. Validate product stock via `GET /products/:id` on Product Service.
  4. Calculate total amount.
  5. Reduce stock via `POST /admin/products/:id/reduce` on Product Service.
  6. Execute a Prisma transaction to: create Order, create OrderItems, and delete CartItems.
  7. Return formatted success response matching the `TransformInterceptor`.

### `transaction-service/src/app.module.ts`

#### [MODIFY] `app.module.ts`
- Import `OrdersModule` into the main application module.

## Verification Plan

### Automated Tests
- Build the application using `npm run build` to ensure no TypeScript compilation errors.

### Manual Verification
- Test `GET /orders` via standard HTTP request (expecting empty list initially).
- To fully test the checkout process, the Product Service must be running. We will mock the required conditions or ask the user to test the E2E flow using Swagger/Postman once deployed locally.
