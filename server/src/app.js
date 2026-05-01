const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { env } = require("./config/env");
const logger = require("./config/logger");
const chatRoutes = require("./routes/chatRoutes");
const emailRoutes = require("./routes/emailRoutes");
const authRoutes = require("./routes/authRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const userRoutes = require("./routes/userRoutes");
const { AppError, errorHandler, notFoundHandler } = require("./utils/errors");

const app = express();

app.use(
  cors({
    origin: env.clientUrl
  })
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(
  morgan("dev", {
    stream: {
      write: (message) => logger.http(message.trim())
    }
  })
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Agentic AI backend is running."
  });
});

app.get("/health", async (req, res, next) => {
  try {
    const emailService = req.app.locals.emailService;
    const emailStatus = typeof emailService?.isConfigured === "function" ? emailService.isConfigured() : false;

    res.json({
      success: true,
      status: "ok",
      services: {
        aiProviders: req.app.locals.aiAssistantService?.getStatus() || {},
        email: emailStatus
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

app.use("/chat", chatRoutes);
app.use("/send-email", emailRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);

app.use((req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
