# Agentic AI Backend

This backend exposes an AI chatbot that analyzes intent with Gemini and sends Gmail emails with Nodemailer when the user request requires it.

## Folder structure

```text
backend/
  index.js
  package.json
  .env.example
  README.md
  examples/
    frontend-fetch-example.js
  src/
    app.js
    server.js
    config/
      env.js
      logger.js
    controllers/
      chatController.js
      emailController.js
    routes/
      chatRoutes.js
      emailRoutes.js
    services/
      agentService.js
      emailService.js
      geminiService.js
    utils/
      asyncHandler.js
      errors.js
```

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Copy the environment template:

```powershell
Copy-Item .env.example .env
```

3. Add your Gemini API key.

4. Configure Gmail SMTP:
   Use `GMAIL_APP_PASSWORD` for a simple setup, or the OAuth2 variables for a more production-friendly Gmail flow.

5. Start the API:

```bash
npm run dev
```

6. Test the health endpoint:

```text
GET http://localhost:5000/health
```

## API endpoints

### `POST /chat`

Request:

```json
{
  "message": "Send a budget alert email to finance@example.com saying we exceeded the travel budget."
}
```

Response:

```json
{
  "success": true,
  "message": "I sent the email alert and confirmed the travel budget issue.",
  "agent": {
    "action": "send_email",
    "confidence": 0.94,
    "reasoning": "User explicitly requested an email alert."
  },
  "email": {
    "sent": true,
    "messageId": "<example-message-id>"
  }
}
```

### `POST /send-email`

Request:

```json
{
  "to": "user@example.com",
  "subject": "Weekly report",
  "text": "Your weekly report is ready."
}
```

Response:

```json
{
  "success": true,
  "message": "Email sent successfully.",
  "data": {
    "messageId": "<example-message-id>",
    "accepted": ["user@example.com"],
    "rejected": []
  }
}
```

## Notes

- Nodemailer's Gmail guide says OAuth2 is the recommended option for new Gmail integrations, while App Passwords are acceptable when 2-Step Verification is enabled.
- The Gemini integration uses the official `@google/genai` SDK, which Google documents as the recommended JavaScript SDK.
- Gmail can block suspicious automated traffic and has sending limits, so for heavier production traffic you may eventually want a dedicated email provider.
