const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
  quiet: true
});

function toBoolean(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  return String(value).toLowerCase() === "true";
}

function requiredIfMissing(key, value) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongoUri: process.env.MONGO_URI || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  openaiBaseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  groqBaseUrl: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  geminiBaseUrl: process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta",
  mailEnabled: toBoolean(process.env.MAIL_ENABLED, false),
  mailFrom: process.env.MAIL_FROM || process.env.GMAIL_USER || "",
  gmailUser: process.env.GMAIL_USER || "",
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD || "",
  gmailOauthClientId: process.env.GMAIL_OAUTH_CLIENT_ID || "",
  gmailOauthClientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET || "",
  gmailOauthRefreshToken: process.env.GMAIL_OAUTH_REFRESH_TOKEN || ""
};

if (!env.mongoUri) {
  console.warn("MONGO_URI is not configured. Auth and transaction routes will not work until it is set.");
}

if (!env.openaiApiKey || !env.groqApiKey || !env.geminiApiKey) {
  console.warn("One or more AI provider API keys are not configured. Add real keys before using that provider.");
}

if (env.mailEnabled) {
  requiredIfMissing("MAIL_FROM or GMAIL_USER", env.mailFrom);
  requiredIfMissing("GMAIL_USER", env.gmailUser);
}

module.exports = {
  env
};

