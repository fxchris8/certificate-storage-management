# 🚀 Express + TypeScript + Prisma + PostgreSQL Boilerplate (2025 Edition)

This is a backend built with Node.js, Express, TypeScript, and Prisma ORM. It follows modern best practices for API development, including strict type safety, structured error handling, security measures, and environment validation.

Designed to be modular and maintainable, the project features a clean architecture, making it easy to extend with new functionalities.

## Google Drive certificate storage

New certificate uploads are stored in Google Drive using an OAuth2 user account. Configure
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`,
`GOOGLE_REDIRECT_URI`, and `GDRIVE_FOLDER_ID` in the root `.env` file. The refresh
token must have access to Google Drive and the configured user must be able to write
to the target folder.

The database stores an internal `gdrive://<file-id>` reference. View and download
requests are proxied through the backend, so Drive files do not need public sharing.
Existing local paths and external HTTP URLs remain readable for backward compatibility.

## ✨ Features

🛠️ Core Features\
✅ TypeScript – Fully typed backend for maintainability\
✅ Express.js – Lightweight and fast web framework\
✅ Prisma ORM – Type-safe database interactions
✅ PostgreSQL – Relational database\
\
🎯 Development & Code Quality\
✅ Feature-Based Structure – Each feature has its own folder, keeping everything related to a feature (routes, schemas, types, services, controllers, repositories) together for better maintainability and scalability\
✅ ESLint + Prettier – Code linting, formatting and autoformat on save\
✅ Zod Validation – Strict schema validation for request & environment variables\
✅ VSCode debugger\
\
🔐 Environment & Security\
✅ Environment Validation – Ensures required .env variables exist\
✅ Helmet & Security Headers – Protects against web vulnerabilities\
✅ Rate Limiter, Host whitelisting middleware\
\
⚡ API & Middleware\
✅ Request Validation – Uses Zod for body, params, and query validation\
✅ Error Handling Middleware – Centralized error handling with PostgreSQL error handling [(Ref)](https://www.prisma.io/docs/orm/reference/error-reference)\
✅ Unified Response Structure – Uses [uni-response](https://github.com/sushantrahate/uni-response) for consistent API responses\
\
🧪 Testing & CI/CD\
✅ Vitest – Unit and integration testing\
✅ Husky + Lint-Staged – Enforces pre-commit linting and testing\
\
🛑 Server Management\
✅ Graceful Shutdown – Ensures proper cleanup of database & open connections during shutdown [(Ref)](https://github.com/sushantrahate/secure-nodejs-backend/tree/main/graceful-shutdown)

## 🛠️ Clean Architecture & Feature-Based Structure

### 📌 Clean Architecture & Framework-Agnostic Design

This project follows a feature-based modular structure, where each feature (e.g., user) has its own isolated folder containing everything related to that feature.

📂 Project Structure:

```bash
src/
│── config/         # Configuration (e.g., environment variables, Prisma, security)
│── constants/      # Shared constants (messages, enums, etc.)
│── features/       # Feature-based modular structure
│   ├── user/       # User feature module
│   │   ├── __tests__/      # Unit tests (vitest)
│   │   ├── controllers/    # Handles HTTP requests (Express-dependent)
│   │   ├── repositories/   # Database interactions (Prisma-dependent)
│   │   ├── routes/         # Express API routes (Express-dependent)
│   │   ├── schemas/        # Zod validation schemas (Framework-agnostic)
│   │   ├── services/       # Business logic (Completely framework-independent)
│   │   ├── types/          # TypeScript interfaces & types
│── middleware/      # Global Express middlewares
│── utils/           # Helper functions
│── app.ts           # Express app setup
│── server.ts        # Entry point
```
### 📌 Layer-by-Layer Breakdown

### 1️⃣ Feature Modules (e.g., user/)

Each feature is self-contained, meaning everything related to "users" is inside `features/user/`

🎯 Benefit:\
💡 You can easily add or remove features without affecting other parts of the app.

🔹 **No Cluttering, Even as the Project Grows Large –** The feature-based structure ensures that related files stay together, preventing scattered code.\
🔹 **Everything in One Place –** Developers can find all logic related to a feature (controllers, services, repositories, schemas) in a single folder, reducing confusion.\
🔹 **No Ambiguity in Large Systems –** Since each feature is self-contained, developers always know which controller, service, or repository to use, making onboarding and scaling easier.\
🔹 **Scalability & Maintainability –** Adding a new feature means simply creating a new folder under features/, without modifying unrelated parts of the app.

### 2️⃣ Controllers (controllers/)

✅ Handles HTTP requests and responses\
✅ Calls the service layer for business logic\
✅ Only responsible for Express-specific logic

📄 Example: user.controller.ts

```ts
import { Request, Response } from "express";
import { UserService } from "../services/user.service";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getUsers(req: Request, res: Response) {
    const users = await this.userService.getAllUsers();
    res.json({ success: true, data: users });
  }
}
```

### 🛠️ Why This Structure?\

Express-specific logic stays here (e.g., req, res)\
Business logic is in the service layer (so it’s framework-agnostic)

🎯 Benefit:\
💡 Can switch from Express to Fastify/NestJS by just changing the controllers.

### 3️⃣ Services (services/)

✅ Contains core business logic\
✅ Does NOT depend on Express or Prisma\
✅ Interacts with repositories for data retrieval\

📄 Example: user.service.ts

```ts
import { UserRepository } from "../repositories/user.repository";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getAllUsers() {
    return await this.userRepository.getUsers();
  }
}
```

### 🛠️ Why This Structure?

- No dependency on Express or HTTP requests
- Calls repository for database access

🎯 Benefit:\
💡 Can be reused in a CLI app, background worker, or GraphQL API without changes.


### 4️⃣ Repositories (repositories/)

✅ Handles all database queries\
✅ Uses Prisma (or any ORM, easily replaceable)\
✅ Interacts only with services/, never controllers

📄 Example: user.repository.ts

```ts
import { prisma } from "@/config/prisma.config";

export class UserRepository {
  async getUsers() {
    return await prisma.user.findMany();
  }
}
```

### 🛠️ Why This Structure?

- Keeps database logic separate from business logic
- Easy to swap Prisma for another ORM (e.g., Drizzle, TypeORM)

🎯 Benefit:\
💡 Can change the database or ORM without affecting services/controllers.

### 5️⃣ Routes (routes/)

✅ Defines API endpoints\
✅ Maps controllers to Express routes

📄 Example: user.routes.ts

```ts
import { Router } from "express";
import { UserController } from "../controllers/user.controller";

const router = Router();
const userController = new UserController();

router.get("/", (req, res) => userController.getUsers(req, res));

export default router;
```

### 🛠️ Why This Structure?

- Controllers are injected into routes for better testability
- Only Express-dependent part is here

🎯 Benefit:\
💡 Can switch to NestJS, Fastify, or Hono by only changing routes & controllers.

### 6️⃣ Validation Schemas (schemas/)

✅ Uses Zod for request validation
✅ Completely framework-independent

📄 Example: user.schema.ts

```ts
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});
```

### 🛠️ Why This Structure?

- Schemas don’t depend on Express, so they can be used anywhere
- Validation logic is reusable (can be used in GraphQL, CLI, or workers)
- 
🎯 Benefit:\
💡 Easier to enforce validation rules across different application layers.

### 🛠️ Final Benefits Summary
<table>
  <thead>
    <tr>
      <th>Layer</th>
      <th>Purpose</th>
      <th>Benefit</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Controllers</strong></td>
      <td>Handle HTTP requests</td>
      <td>Framework-dependent, easily replaceable</td>
    </tr>
    <tr>
      <td><strong>Services</strong></td>
      <td>Business logic</td>
      <td>Framework-agnostic, reusable anywhere</td>
    </tr>
    <tr>
      <td><strong>Repositories</strong></td>
      <td>Database interactions</td>
      <td>Can switch ORM (Prisma, TypeORM, Drizzle)</td>
    </tr>
    <tr>
      <td><strong>Routes</strong></td>
      <td>Maps controllers to APIs</td>
      <td>Only responsible for Express routing</td>
    </tr>
    <tr>
      <td><strong>Schemas</strong></td>
      <td>Data validation</td>
      <td>Reusable validation logic across app</td>
    </tr>
  </tbody>
</table>

## ✨ Setup from scratch

## ⚡ TypeScript & Development Dependencies Setup

```bash
mkdir express-ts-prisma && cd express-ts-prisma
npm init -y
```

```bash
npm install --save-dev typescript tsx nodemon @types/node tsc-alias
```

> Create `tsconfig.json`

## ⚡ Add Express, CORS, and .env Setup

```bash
npm install express cors dotenv
npm install --save-dev @types/express @types/cors
```

> Create `.env.dev` File from `.env.example`
> Create src/config/env-config.ts // Env Configuration file
> Create src/config/env-schema.ts // Schema for environment variables

## ⚡ ESLint, Prettier & Linting Plugins

```bash
npm install --save-dev eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-prettier eslint-plugin-node eslint-plugin-import eslint-plugin-simple-import-sort eslint-plugin-unicorn eslint-plugin-security eslint-config-prettier
```

> Create `eslint.config.js`

> Create `.prettierrc.json`

> Create `.prettierignore`

📌 Prettier will ignore these files & folders (same format as `.gitignore`).

> create `.vscode/settings.json` to Autoformat using Prettier on save

## ⚡ Setup Prisma & PostgreSQL

> Create Database and Shadow Database

> Update `.env.dev` File

```ini
DATABASE_URL="postgresql://dev_user:dev_password@localhost:5432/dev_db"
SHADOW_DATABASE_URL="postgresql://dev_user:dev_password@localhost:5432/dev_db_shadow"
```

### Install Prisma

```bash
npm install @prisma/client
npm install --save-dev prisma
```

### Initialize Prisma

```bash
npx prisma init
```

### Modify prisma/schema.prisma

```js
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
```

### Run Migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

## ⚡ Create Express Server

### Create `src/server.ts`

## ⚡ Setup Husky + Lint-Staged

```bash
npm install --save-dev husky lint-staged
```

### Enable Husky

```bash
npx husky install
npm set-script prepare "husky install"
```

### Add Pre-commit Hook

```bash
npx husky add .husky/pre-commit "npx lint-staged"
```

Modify `package.json`

```json
// Runs linters (ESLint, Prettier) only on changed files before committing.
"lint-staged": {
   "**/*.{ts,json,md}": ["eslint --fix", "prettier --write"]
}
```

Add Pre-Push Hook

```sh
// Before git push trigger tests & build validation.
npx husky add .husky/pre-push "npm run lint && npm run format && npm run test && npm run build"
```

## ⚡ Add Scripts in package.json

```json
"scripts": {
    "prebuild": "npm run lint && npm run format && npm run test",
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "nodemon --ext ts --exec tsx src/server.ts",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext ts --fix",
    "format": "prettier --write .",
    "test": "vitest",
    "prepare": "npx husky install"
  }
```

## ⚡ Run the Project

```bash
# Start Dev Server
npm run dev

# Lint Code
npm run lint
npm run lint:fix

# Format Code
npm run format
```

## ⚡ Vitest for Unit Testing

```bash
npm install --save-dev vitest @vitest/coverage-v8 @types/jest supertest @types/supertest
```

Create test files at `src\features\user\__tests__`

## ⚡ Security

```sh
npm i helmet express-rate-limit
```

## ⚡ Logger

```bash
npm install pino pino-pretty pino-http
npm install -D @types/pino @types/pino-pretty @types/pino-http
```

Create src\middleware\pino-logger.ts

## ⚡ Constants

## ⚡ Middleware

## ⚡ Utils

If you liked it then please show your love by ⭐ the repo
