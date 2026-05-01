const OpenAIProvider = require("./openaiProvider");

class GroqProvider extends OpenAIProvider {
  constructor(env) {
    super({
      openaiApiKey: env.groqApiKey,
      openaiModel: env.groqModel,
      openaiBaseUrl: env.groqBaseUrl
    });

    this.id = "groq";
    this.name = "Groq";
  }

  isConfigured() {
    return Boolean(this.apiKey) && this.apiKey !== "your_groq_api_key_here" && !String(this.apiKey).includes("your_");
  }
}

module.exports = GroqProvider;
