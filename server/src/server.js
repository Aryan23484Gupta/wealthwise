const http = require("http");

const app = require("./app");
const { env } = require("./config/env");
const logger = require("./config/logger");
const connectDB = require("../dbconnection");
const EmailService = require("./services/emailService");
const GeminiService = require("./services/geminiService");
const AgentService = require("./services/agentService");

function createServices() {
  const emailService = new EmailService(env);
  const geminiService = new GeminiService(env);
  const agentService = new AgentService({
    geminiService,
    emailService,
    logger
  });

  app.locals.emailService = emailService;
  app.locals.geminiService = geminiService;
  app.locals.agentService = agentService;
}

async function startServer() {
  try {
    if (env.mongoUri) {
      await connectDB();
      logger.info("MongoDB connected");
    } else {
      logger.warn("Skipping MongoDB connection because MONGO_URI is not configured.");
    }

    createServices();

    const server = http.createServer(app);

    server.listen(env.port, () => {
      logger.info(`Server running on port ${env.port}`);
      logger.info(`Chat endpoint available at http://localhost:${env.port}/chat`);
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

module.exports = {
  startServer
};
