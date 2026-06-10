# RULES.md

This document establishes the strict development rules, validation logic, and architectural guardrails for the Jomoro Koffee codebase. All developers must follow these patterns without deviation.

---

## 1. Input Validation Guardrails (CRITICAL: Regular Expressions (ReGex) Banned)

To maintain extreme auditability and prevent ReGex-based Denial of Service (ReDoS) vulnerability patterns, **all Regular Expressions (ReGex) are strictly prohibited** in the codebase. All custom validations must use primitive TypeScript/JavaScript checks, loop constructions, and string/array manipulation techniques.

---

## 2. Detailed Algorithms for Input Validation

### A. Auth Service: User Registration Validation

The user registration endpoint (`POST /auth/register`) must validate three parameters: `name`, `email`, and `password`. These checks must be implemented within NestJS custom class-validator decorators or direct service-layer validation pipelines using the following programmatic logic:

#### 1. Name Check Algorithm
- **Constraint:** The name must be a string containing only uppercase and lowercase English letters (`A-Z`, `a-z`) and spaces. No numbers, symbols, punctuation, or special characters are allowed.
- **Programmatic Logic:**
  ```typescript
  function validateName(name: any): boolean {
    if (typeof name !== 'string' || name.length === 0) {
      return false;
    }
    
    for (let i = 0; i < name.length; i++) {
      const char = name[i];
      const code = name.charCodeAt(i);
      
      const isLowercase = code >= 97 && code <= 122; // a-z
      const isUppercase = code >= 65 && code <= 90;  // A-Z
      const isSpace = char === ' ';
      
      if (!isLowercase && !isUppercase && !isSpace) {
        return false; // Found an invalid character
      }
    }
    
    return true;
  }
  ```

#### 2. Email Check Algorithm
- **Constraint:** The email must be a non-empty string containing exactly one `@` character, at least one dot `.` in the domain portion, and must end with one of these approved suffixes: `.com`, `.net`, `.org`, or `.id`.
- **Programmatic Logic:**
  ```typescript
  function validateEmail(email: any): boolean {
    if (typeof email !== 'string' || email.length === 0) {
      return false;
    }
    
    // Count occurrences of "@"
    let atCount = 0;
    for (let i = 0; i < email.length; i++) {
      if (email[i] === '@') {
        atCount++;
      }
    }
    
    if (atCount !== 1) {
      return false; // Must contain exactly one '@'
    }
    
    // Split the email into local and domain parts
    const parts = email.split('@');
    const localPart = parts[0];
    const domainPart = parts[1];
    
    if (localPart.length === 0 || domainPart.length === 0) {
      return false; // Local part or domain part cannot be empty
    }
    
    // Check that there is at least one '.' in the domain part
    let dotCount = 0;
    for (let i = 0; i < domainPart.length; i++) {
      if (domainPart[i] === '.') {
        dotCount++;
      }
    }
    
    if (dotCount === 0) {
      return false; // Domain part must contain at least one dot
    }
    
    // Check approved suffixes
    const approvedSuffixes = ['.com', '.net', '.org', '.id'];
    let hasValidSuffix = false;
    for (let i = 0; i < approvedSuffixes.length; i++) {
      const suffix = approvedSuffixes[i];
      if (email.endsWith(suffix)) {
        hasValidSuffix = true;
        break;
      }
    }
    
    return hasValidSuffix;
  }
  ```

#### 3. Password Check Algorithm
- **Constraint:** The password must be at least 8 characters long, must contain no space characters, and must contain at least 2 numeric digits (`0-9`).
- **Programmatic Logic:**
  ```typescript
  function validatePassword(password: any): boolean {
    if (typeof password !== 'string' || password.length < 8) {
      return false; // Must be at least 8 characters
    }
    
    let digitCount = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password[i];
      
      if (char === ' ') {
        return false; // Spaces are strictly banned
      }
      
      if (char >= '0' && char <= '9') {
        digitCount++;
      }
    }
    
    return digitCount >= 2; // Must contain at least two numbers
  }
  ```

---

### B. Product Service: Product Name Word-Counter

When creating or updating products (`POST /admin/products` and `POST /admin/products/:id/update`), the product `name` must be checked to ensure it represents a descriptive product title.

- **Constraint:** The product name must contain at least 3 words.
- **Programmatic Logic:**
  ```typescript
  function validateProductName(name: any): boolean {
    if (typeof name !== 'string' || name.length === 0) {
      return false;
    }
    
    // Split the name using spaces
    const rawWords = name.split(' ');
    
    // Filter out empty entries resulting from multiple consecutive spaces
    const cleanWords: string[] = [];
    for (let i = 0; i < rawWords.length; i++) {
      const word = rawWords[i];
      if (word.length > 0) {
        cleanWords.push(word);
      }
    }
    
    return cleanWords.length >= 3;
  }
  ```

---

## 3. NestJS HttpException Error Mappings

To keep APIs consistent and clean, specific errors must map to exact NestJS standard HTTP Exceptions:

| Error Trigger | Target HTTP Status | NestJS Exception | Description |
| :--- | :---: | :--- | :--- |
| **Registration validation failure** (Name, email, or password rules failed) | `400 Bad Request` | `BadRequestException` | Input formatting constraints failed manual algorithmic checks. |
| **Email already registered** | `400 Bad Request` | `BadRequestException` | Attempting to sign up with an email that exists in the database. |
| **Invalid password / User not found** during login | `401 Unauthorized` | `UnauthorizedException` | Plain-text password mismatch or email look-up failed in users table. |
| **Invalid Access Token** on guarded route | `401 Unauthorized` | `UnauthorizedException` | Bearer token validation failed (missing, altered, or expired signature). |
| **Insufficient Access Permission** | `403 Forbidden` | `ForbiddenException` | Authenticated user is attempting to access a route guarded for another role. |
| **Product or Category not found** | `404 Not Found` | `NotFoundException` | Specified database ID does not map to any database records. |
| **Product stock reduction failure** | `400 Bad Request` | `BadRequestException` | Target product's stock is less than the requested decrement quantity. |

---

## 4. General Development Guardrails

1. **Strictly Plain-Text Passwords:**
   Do not use Bcrypt, Argon2, Scrypt, or any hashing algorithms. Passwords must be saved and verified using direct, plain-text equality comparisons.
2. **NestJS Validation Pipe Setup:**
   Every main entry point must bind the NestJS pipeline validation globally in `main.ts` using:
   ```typescript
   app.useGlobalPipes(
     new ValidationPipe({
       whitelist: true,
       transform: true,
       forbidNonWhitelisted: true,
     }),
   );
   ```
3. **CORS Activation:**
   Every NestJS microservice must explicitly enable Cross-Origin Resource Sharing in its `main.ts` file prior to listening:
   ```typescript
   app.enableCors({
     origin: '*', // Customize based on domain deployment
     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
     credentials: true,
   });
   ```
