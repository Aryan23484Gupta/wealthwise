class AgentService {
  constructor({ geminiService, emailService, logger }) {
    this.geminiService = geminiService;
    this.emailService = emailService;
    this.logger = logger;
  }

  async handleUserMessage({ message, context }) {
    const decision = await this.geminiService.analyzeIntent({
      message,
      context
    });

    this.logger.info("Agent decision", {
      action: decision.action,
      confidence: decision.confidence,
      reasoning: decision.reasoning
    });

    if (decision.action !== "send_email") {
      return {
        reply: decision.reply,
        agent: {
          action: decision.action,
          confidence: decision.confidence,
          reasoning: decision.reasoning
        },
        email: {
          sent: false
        }
      };
    }

    if (!decision.email?.to || !decision.email?.subject || !decision.email?.text) {
      return {
        reply: "I identified an email intent, but I still need the recipient, subject, and message body.",
        agent: {
          action: "reply_only",
          confidence: decision.confidence,
          reasoning: "Email intent detected, but Gemini did not return all required email fields."
        },
        email: {
          sent: false
        }
      };
    }

    const emailResult = await this.emailService.sendMail(decision.email);

    return {
      reply: decision.reply,
      agent: {
        action: decision.action,
        confidence: decision.confidence,
        reasoning: decision.reasoning
      },
      email: {
        sent: true,
        ...emailResult
      }
    };
  }
}

module.exports = AgentService;
