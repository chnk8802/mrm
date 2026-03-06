# 📱 Mobile Repair App — MERN Project Setup

## Tech Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Frontend     | React (Vite) + Tailwind CSS + shadcn/ui |
| Backend      | Node.js + Express.js                    |
| Database     | MongoDB + Mongoose                      |
| Auth         | JWT (JSON Web Tokens)                   |
| Validation   | Zod (shared across frontend & backend)  |
| Monorepo     | Turborepo                               |
| Package Mgr  | npm (with workspaces)                   |

---

## 📁 Folder Structure

```
mobile-repair-app/
├── apps/
│   ├── client/                    # React Frontend (Vite)
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   ├── components/
│   │   │   │   └── ui/            # shadcn/ui auto-generated components
│   │   │   ├── context/           # React Context (Auth, etc.)
│   │   │   ├── hooks/             # Custom hooks
│   │   │   ├── lib/
│   │   │   │   └── utils.js       # shadcn/ui cn() utility
│   │   │   ├── pages/             # Page-level components
│   │   │   ├── services/          # Axios API calls
│   │   │   ├── utils/             # Helper functions
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   ├── index.html
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   ├── vite.config.js
│   │   └── package.json
│   │
│   └── server/                    # Express Backend
│       ├── config/
│       │   └── db.js              # MongoDB connection
│       ├── controllers/           # Route logic
│       ├── middleware/
│       │   ├── authMiddleware.js  # JWT verification
│       │   ├── validateMiddleware.js # Zod validation middleware
│       │   └── errorMiddleware.js
│       ├── models/                # Mongoose schemas
│       ├── routes/                # Express routes
│       ├── utils/                 # Token generator, etc.
│       ├── server.js              # Entry point
│       └── package.json
│
├── packages/
│   └── validators/                # 🔗 Shared Zod schemas (used by both apps)
│       ├── src/
│       │   ├── auth.schema.js     # Login, register schemas
│       │   └── repair.schema.js   # Repair job schemas
│       ├── index.js
│       └── package.json
│
├── turbo.json                     # Turborepo pipeline config
├── .env                           # Root env vars (DO NOT COMMIT)
├── .gitignore
└── package.json                   # Root — npm workspaces config
```

---

## 🚀 Step-by-Step Setup

### 1. Create Root Project with Turborepo

```bash
npx create-turbo@latest mobile-repair-app
cd mobile-repair-app
```

> Choose **npm** as the package manager when prompted. Turborepo will scaffold the monorepo with `apps/` and `packages/` folders automatically.

---

#### Root `package.json` (npm workspaces)

```json
{
  "name": "mobile-repair-app",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
```

---

#### `turbo.json` (Pipeline config)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {}
  }
}
```

---

### 2. Setup Shared Validators Package (`packages/validators/`)

This package holds all Zod schemas and is imported by **both** `client` and `server` — one source of truth for validation.

```bash
mkdir -p packages/validators/src
```

#### `packages/validators/package.json`

```json
{
  "name": "@repo/validators",
  "version": "1.0.0",
  "main": "./index.js",
  "dependencies": {
    "zod": "^3.22.4"
  }
}
```

---

#### `packages/validators/src/auth.schema.js`

```js
const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };
```

---

#### `packages/validators/src/repair.schema.js`

```js
const { z } = require('zod');

const repairSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  deviceType: z.string().min(1, 'Device type is required'),
  issue: z.string().min(5, 'Please describe the issue'),
  status: z.enum(['pending', 'in-progress', 'completed', 'cancelled']).default('pending'),
  cost: z.number().nonnegative('Cost cannot be negative').optional(),
});

module.exports = { repairSchema };
```

---

#### `packages/validators/index.js`

```js
const { registerSchema, loginSchema } = require('./src/auth.schema');
const { repairSchema } = require('./src/repair.schema');

module.exports = { registerSchema, loginSchema, repairSchema };
```

---

### 3. Setup Backend (`apps/server/`)

```bash
cd apps/server
npm init -y
```

#### Install Backend Dependencies

```bash
# Core
npm install express mongoose dotenv cors helmet

# Auth
npm install jsonwebtoken bcryptjs

# Validation (Zod — also pulled from shared package)
npm install zod

# Dev
npm install -D nodemon
```

#### `apps/server/package.json` scripts

```json
{
  "name": "server",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "@repo/validators": "*"
  }
}
```

---

#### `apps/server/.env`

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/mobile-repair
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

---

#### `apps/server/config/db.js`

```js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

---

#### `apps/server/server.js`

```js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes (uncomment as you build)
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/repairs', require('./routes/repairRoutes'));

app.get('/', (req, res) => res.send('Mobile Repair API Running...'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
```

---

#### `apps/server/middleware/authMiddleware.js`

```js
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
```

---

#### `apps/server/middleware/validateMiddleware.js` (Zod validation)

```js
// Reusable middleware — pass any Zod schema to validate req.body
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({ errors });
  }

  req.body = result.data; // replace with parsed & coerced data
  next();
};

module.exports = { validate };
```

Usage in a route:

```js
const { validate } = require('../middleware/validateMiddleware');
const { registerSchema } = require('@repo/validators');

router.post('/register', validate(registerSchema), registerUser);
```

---

#### `apps/server/utils/generateToken.js`

```js
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = generateToken;
```

---

### 4. Setup Frontend (`apps/client/`)

```bash
cd apps/client
npm create vite@latest . -- --template react
npm install
```

#### Install Frontend Dependencies

```bash
# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Routing & HTTP
npm install react-router-dom axios

# Validation & Forms (Zod + react-hook-form integration)
npm install zod react-hook-form @hookform/resolvers
```

---

#### Setup shadcn/ui

shadcn/ui requires a `jsconfig.json` (or `tsconfig.json`) with path aliases and a matching Vite config update first.

**`apps/client/vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**`apps/client/jsconfig.json`**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Then initialise shadcn/ui:

```bash
npx shadcn@latest init
```

> When prompted: choose **Default** style, **Slate** base color, and **yes** to CSS variables.

Install components as you need them, e.g.:

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add form
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add dialog
```

Each command drops the component source into `src/components/ui/` — you own the code and can customise freely.

#### `apps/client/package.json` — add shared validators

```json
{
  "name": "client",
  "dependencies": {
    "@repo/validators": "*"
  }
}
```

---

#### `apps/client/tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

---

#### `apps/client/src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

#### `apps/client/src/services/api.js` (Axios base setup)

```js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
```

---

#### Example: Using Zod + react-hook-form + shadcn/ui in a component

```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@repo/validators';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginForm() {
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data) => {
    // data is already validated by shared Zod schema
    console.log(data);
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl><Input type="password" placeholder="••••••" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" className="w-full">Login</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

---

### 5. `.gitignore` (Root)

```
node_modules/
.env
dist/
.turbo/
.DS_Store
```

---

## 📦 Summary of All Packages

### Shared (`packages/validators/`)
| Package  | Purpose                              |
|----------|--------------------------------------|
| zod      | Schema declaration & validation      |

### Backend (`apps/server/`)
| Package          | Purpose                      |
|------------------|------------------------------|
| express          | Web framework                |
| mongoose         | MongoDB ODM                  |
| dotenv           | Env variable management      |
| cors             | Cross-origin requests        |
| helmet           | HTTP security headers        |
| jsonwebtoken     | JWT creation & verification  |
| bcryptjs         | Password hashing             |
| zod              | Runtime request validation   |
| @repo/validators | Shared Zod schemas           |
| nodemon (dev)    | Auto-restart on file change  |

### Frontend (`apps/client/`)
| Package               | Purpose                           |
|-----------------------|-----------------------------------|
| react-router-dom      | Client-side routing               |
| axios                 | HTTP requests                     |
| tailwindcss           | Utility-first CSS                 |
| shadcn/ui             | Accessible, composable UI components |
| react-hook-form       | Form state management             |
| @hookform/resolvers   | Connects Zod to react-hook-form   |
| @repo/validators      | Shared Zod schemas                |

---

## ▶️ Running the App

```bash
# Run everything from the root (Turborepo runs both in parallel)
npm run dev
```

Or individually:

```bash
# Backend only (from apps/server)
npm run dev

# Frontend only (from apps/client)
npm run dev
```

Backend runs on: `http://localhost:5000`
Frontend runs on: `http://localhost:5173`

---

## 🔮 Next Steps (When You Start Building)

1. Add Zod schemas to `packages/validators/` as you define new features
2. Create `User` Mongoose model in `apps/server/models/`
3. Build `/api/auth` routes (register, login) using `validate(registerSchema)` middleware
4. Create `Repair` Mongoose model (customer name, device, issue, status, cost)
5. Build `/api/repairs` CRUD routes protected with `authMiddleware`
6. Build React pages: Login, Dashboard, Add Repair, Repair List
7. Use shared Zod schemas with `zodResolver` in all React forms

---

> ⚠️ **Never commit your `.env` file.** Make sure it's listed in `.gitignore` before your first commit.
