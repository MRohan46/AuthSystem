# 🔐 Node.js Auth System

A **beginner-friendly**, **production-ready** authentication system built with Node.js, Express, and MongoDB. This project is designed to teach secure authentication fundamentals through clean, well-commented code.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-blue)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen)](https://mongoosejs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 📚 What You'll Learn

- How JWTs (JSON Web Tokens) work and why we use two of them (access + refresh)
- How to hash passwords securely with bcrypt
- How to protect routes with middleware
- How to prevent common attacks: XSS, NoSQL injection, brute-force, CSRF
- Clean project structure for a real Node.js backend

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔑 JWT Authentication | Short-lived access tokens + long-lived refresh tokens |
| 🍪 HttpOnly Cookies | Refresh tokens stored in secure cookies (safe from XSS) |
| 🔒 Password Hashing | bcrypt with 12 salt rounds |
| 🛡️ Account Lockout | Auto-locks after 5 failed login attempts (15 min) |
| 🔄 Token Rotation | Refresh tokens are rotated and hashed in DB |
| 🚫 Rate Limiting | 10 auth attempts / 100 API requests per 15 min |
| 🧹 Input Validation | express-validator on all user inputs |
| 💉 NoSQL Injection Guard | express-mongo-sanitize strips dangerous operators |
| 🧼 XSS Protection | xss-clean strips malicious HTML/JS from inputs |
| 🪖 Security Headers | helmet sets safe HTTP headers |
| 👑 Role-Based Access | `user` and `admin` roles with middleware guards |
| 📱 Multi-Device Logout | Logout from current device or all sessions |

---

## 🗂️ Project Structure

```
auth-system/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js  # register, login, refresh, logout
│   │   └── userController.js  # profile & admin operations
│   ├── middleware/
│   │   ├── auth.js            # protect & authorize middleware
│   │   ├── errorHandler.js    # global error handler
│   │   ├── rateLimiter.js     # brute-force protection
│   │   └── validate.js        # input validation rules
│   ├── models/
│   │   └── User.js            # Mongoose User schema
│   ├── routes/
│   │   ├── authRoutes.js      # /api/auth/*
│   │   └── userRoutes.js      # /api/users/*
│   ├── utils/
│   │   ├── jwt.js             # token helpers
│   │   └── response.js        # standardized API responses
│   ├── app.js                 # Express app setup
│   └── server.js              # Entry point
├── .env.example               # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) (local) or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free tier works)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/node-auth-system.git
cd node-auth-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
# Copy the template
cp .env.example .env
```

Open `.env` and fill in your values:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/auth_system

# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=your_very_long_random_secret_here
JWT_REFRESH_SECRET=another_very_long_random_secret_here

JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CLIENT_URL=http://localhost:3000
```

### 4. Run the Server

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

You should see:
```
✅ MongoDB Connected: localhost
🚀 Server running in development mode on port 5000
```

---

## 📡 API Reference

### Auth Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Create a new account | ❌ |
| `POST` | `/api/auth/login` | Log in | ❌ |
| `POST` | `/api/auth/refresh` | Get new access token | ❌ (uses cookie) |
| `POST` | `/api/auth/logout` | Log out current session | ✅ |
| `POST` | `/api/auth/logout-all` | Log out all devices | ✅ |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users/me` | Get your profile | ✅ |
| `PATCH` | `/api/users/me` | Update your name | ✅ |
| `GET` | `/api/users` | List all users | ✅ Admin only |
| `PATCH` | `/api/users/:id/deactivate` | Deactivate a user | ✅ Admin only |

### Example Requests

**Register:**
```json
POST /api/auth/register
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Secret123"
}
```

**Login:**
```json
POST /api/auth/login
{
  "email": "jane@example.com",
  "password": "Secret123"
}
```

**Protected Route (include the access token):**
```
GET /api/users/me
Authorization: Bearer <your_access_token_here>
```

---

## 🔐 Security Concepts Explained

### Why two tokens?

| Token | Lifetime | Where Stored | Purpose |
|---|---|---|---|
| **Access Token** | 15 min | Client memory (JS variable) | Sent with every API request |
| **Refresh Token** | 7 days | HttpOnly Cookie | Used to get a new access token |

Short-lived access tokens limit the damage if stolen. The refresh token is in an HttpOnly cookie, so JavaScript can't read it — protecting against XSS attacks.

### What is bcrypt?

bcrypt is a one-way hashing function. You can't "decode" a bcrypt hash — you can only check if a password matches it. This means even if your database is leaked, attackers can't recover user passwords.

### What is token rotation?

Every time a refresh token is used, it's replaced with a new one. If the old token is used again, all sessions are immediately revoked. This detects stolen tokens.

### Rate limiting

The auth routes allow only **10 requests per 15 minutes per IP**. An attacker trying 10,000 passwords would be blocked after the first 10 attempts.

---

## 🤝 Contributing

Pull requests are welcome! Please open an issue first to discuss major changes.

---

## 📄 License

MIT — free to use for learning and personal projects.