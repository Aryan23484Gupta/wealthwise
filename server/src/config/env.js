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
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
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

if (!env.geminiApiKey) {
  console.warn("GEMINI_API_KEY is not configured. Chat agent route will not work until it is set.");
}

if (env.mailEnabled) {
  requiredIfMissing("MAIL_FROM or GMAIL_USER", env.mailFrom);
  requiredIfMissing("GMAIL_USER", env.gmailUser);
}

module.exports = {
  env
};

