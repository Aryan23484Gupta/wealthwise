const { GoogleGenAI } = require("@google/genai");

const { AppError } = require("../utils/errors");

const decisionSchema = {
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: ["reply_only", "send_email"]
    },
    confidence: {
      type: "number"
    },
    reasoning: {
      type: "string"
    },
    reply: {
      type: "string"
    },
    email: {
      type: "object",
      properties: {
        to: { type: "string" },
        subject: { type: "string" },
        text: { type: "string" },
        html: { type: "string" }
      },
      required: ["to", "subject", "text"]
    }
  },
  required: ["action", "confidence", "reasoning", "reply"]
};

class GeminiService {
  constructor(env) {
    this.env = env;
    this.client = new GoogleGenAI({
      apiKey: env.geminiApiKey
    });
  }

  async analyzeIntent({ message, context }) {
    try {
      const prompt = [
        "You are an agentic AI orchestration assistant.",
        "Analyze the user's intent and decide whether an email must be sent automatically.",
        "Return JSON that strictly follows the provided schema.",
        "Choose `send_email` only if the user clearly asks for an email, alert, report, notification, reminder, or a message to be sent.",
        "If email details are missing, choose `reply_only` and explain what is missing in the reply.",
        "Keep the reply concise and helpful.",
        "",
        `User message: ${message}`,
        `Additional context: ${JSON.stringify(context || {})}`
      ].join("\n");

      const response = await this.client.models.generateContent({
        model: this.env.geminiModel,
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: decisionSchema
        }
      });

      const parsed = JSON.parse(response.text);

      if (!parsed.action || !parsed.reply) {
        throw new Error("Gemini returned an invalid decision payload.");
      }

      return parsed;
    } catch (error) {
      throw new AppError(`Gemini intent analysis failed: ${error.message}`, 502);
    }
  }
}

module.exports = GeminiService;
