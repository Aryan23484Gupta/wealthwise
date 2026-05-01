const {
  buildContextPrompt,
  isConfiguredKey,
  normalizeProviderResponse,
  parseProviderError
} = require("./providerUtils");

class GeminiProvider {
  constructor(env) {
    this.id = "gemini";
    this.name = "Gemini";
    this.apiKey = env.geminiApiKey;
    this.model = env.geminiModel;
    this.baseUrl = env.geminiBaseUrl;
  }

  isConfigured() {
    return isConfiguredKey(this.apiKey, "your_gemini_api_key_here");
  }

  async chat({ message, context }) {
    if (!this.isConfigured()) {
      throw new Error("Gemini API key is not configured.");
    }

    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildContextPrompt({ message, context }) }]
          }
        ],
        generationConfig: {
          temperature: 0.3
        }
      })
    });

    if (!response.ok) {
      throw new Error(await parseProviderError(response));
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    return normalizeProviderResponse({
      provider: this.id,
      model: this.model,
      text,
      usage: data.usageMetadata
    });
  }
}

module.exports = GeminiProvider;
