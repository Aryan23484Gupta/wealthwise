# WealthWise Backend

Express and MongoDB API for the WealthWise personal finance app.

## Responsibilities

- User signup, OTP verification, login, session restore, logout, and password reset.
- Profile, preferences, budget, savings goals, and account management.
- Income and expense transaction management.
- Daily financial highlight notifications.
- AI assistant chat through OpenAI, Groq, or Gemini-compatible providers.
- Email delivery for signup, welcome, and password-reset flows.

## Structure

```text
server/
  index.js
  dbconnection.js
  models/
  src/
    app.js
    server.js
    config/
    controllers/
    routes/
    services/
    utils/
  utils/
```

## Setup

```bash
npm install
npm run dev
```

Required environment:

```text
MONGO_URI=
CLIENT_URL=http://localhost:5173
```

Optional environment:

```text
OPENAI_API_KEY=
GROQ_API_KEY=
GEMINI_API_KEY=
MAIL_ENABLED=false
MAIL_FROM=
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

## Endpoints

- `GET /health`
- `POST /chat`
- `POST /api/auth/signup/request-otp`
- `POST /api/auth/signup/verify-otp`
- `POST /api/auth/signup/resend-otp`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `POST /api/auth/password/forgot`
- `POST /api/auth/password/reset`
- `GET /api/notifications`
- `PUT /api/notifications/read`
- `DELETE /api/notifications`
- `GET /api/transactions`
- `POST /api/transactions`
- `PUT /api/transactions/:transactionId`
- `DELETE /api/transactions/:transactionId`
- `DELETE /api/transactions`
- `PUT /api/users/profile`
- `PUT /api/users/preferences`
- `PUT /api/users/budget`
- `PUT /api/users/password`
- `DELETE /api/users/account`
- `POST /api/users/goals`
- `POST /api/users/goals/:goalId/contribute`
- `DELETE /api/users/goals/:goalId`
