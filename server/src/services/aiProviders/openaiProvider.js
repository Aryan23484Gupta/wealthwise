const {
  FINANCE_SYSTEM_PROMPT,
  isConfiguredKey,
  normalizeProviderResponse,
  parseProviderError
} = require("./providerUtils");

class OpenAIProvider {
  constructor(env) {
    this.id = "openai";
    this.name = "OpenAI";
    this.apiKey = env.openaiApiKey;
    this.model = env.openaiModel;
    this.baseUrl = env.openaiBaseUrl;
  }

  isConfigured() {
    return isConfiguredKey(this.apiKey, "your_openai_api_key_here");
  }

  async chat({ message, context }) {
    if (!this.isConfigured()) {
      throw new Error("OpenAI API key is not configured.");
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.3,
        messages: [
          { role: "system", content: FINANCE_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              message,
              "",
              `Financial context: ${JSON.stringify(context || {})}`
            ].join("\n")
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(await parseProviderError(response));
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("OpenAI returned an empty response.");
    }

    return normalizeProviderResponse({
      provider: this.id,
      model: data.model || this.model,
      text,
      usage: data.usage
    });
  }
}

module.exports = OpenAIProvider;
