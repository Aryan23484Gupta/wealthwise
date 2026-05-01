const OpenAIProvider = require("./aiProviders/openaiProvider");
const GroqProvider = require("./aiProviders/groqProvider");
const GeminiProvider = require("./aiProviders/geminiProvider");

const SUPPORTED_PROVIDERS = ["openai", "groq", "gemini"];

class AIAssistantService {
  constructor({ env, logger }) {
    this.logger = logger;
    this.providers = {
      openai: new OpenAIProvider(env),
      groq: new GroqProvider(env),
      gemini: new GeminiProvider(env)
    };
  }

  getProvider(providerId = "openai") {
    const normalizedProvider = String(providerId || "openai").toLowerCase();
    const provider = this.providers[normalizedProvider];

    if (!provider) {
      const supported = SUPPORTED_PROVIDERS.join(", ");
      throw new Error(`Unsupported AI provider "${providerId}". Supported providers: ${supported}.`);
    }

    return provider;
  }

  async handleUserMessage({ provider: providerId, message, context }) {
    const provider = this.getProvider(providerId);

    try {
      return await provider.chat({ message, context });
    } catch (error) {
      this.logger.error("AI provider request failed", {
        provider: provider.id,
        message: error.message
      });

      throw new Error(`${provider.name} request failed: ${error.message}`);
    }
  }

  getStatus() {
    return Object.fromEntries(
      Object.entries(this.providers).map(([id, provider]) => [id, provider.isConfigured()])
    );
  }
}

module.exports = {
  AIAssistantService,
  SUPPORTED_PROVIDERS
};
