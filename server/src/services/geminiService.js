const { GoogleGenAI } = require("@google/genai");

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
    if (!this.env.geminiApiKey) {
      return this.buildFallbackDecision({ message, context });
    }

    try {
      const prompt = [
        "You are an agentic AI orchestration assistant.",
        "You are helping with personal finance for an India-based user. Use INR amounts.",
        "When asked where to spend, save, or invest, suggest cautious buckets such as emergency fund, SIPs, index funds, fixed deposits, and researched Indian shares without guaranteeing returns.",
        "Analyze the user's intent and decide whether an email must be sent automatically.",
        "Return JSON that strictly follows the provided schema.",
        "Choose `send_email` only if the user clearly asks for an email, alert, report, notification, reminder, or a message to be sent.",
        "If email details are missing, choose `reply_only` and explain what is missing in the reply.",
        "Keep the reply concise and helpful.",
        "Format the reply for a chat UI: use short paragraphs and simple bullet or numbered lists when giving multiple suggestions.",
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
      return this.buildFallbackDecision({
        message,
        context,
        reason: `Gemini intent analysis failed: ${error.message}`
      });
    }
  }

  buildFallbackDecision({ message, context, reason = "Gemini is not configured, so a local finance response was generated." }) {
    const transactions = Array.isArray(context?.transactions) ? context.transactions : [];
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthly = transactions.filter((item) => String(item.date || "").startsWith(currentMonth));
    const income = monthly
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expenses = monthly
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const freeCash = Math.max(income - expenses, 0);
    const rupees = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    });
    const normalized = message.toLowerCase();
    const wantsInvestment =
      normalized.includes("invest") ||
      normalized.includes("share") ||
      normalized.includes("stock") ||
      normalized.includes("where");

    return {
      action: "reply_only",
      confidence: 0.7,
      reasoning: reason,
      reply: wantsInvestment
        ? `You have about ${rupees.format(
            freeCash
          )} free cash this month.\n\n- Keep 50% for emergency savings.\n- Put 30% toward SIPs, index funds, or carefully researched Indian shares.\n- Keep 20% for planned spending.\n\nAvoid direct stocks until essentials and emergency funds are covered.`
        : `This month you have income of ${rupees.format(income)} and expenses of ${rupees.format(
            expenses
          )}.\n\n- Ask where to invest for allocation ideas.\n- Ask where to reduce spending for category-level suggestions.`
    };
  }
}

module.exports = GeminiService;
