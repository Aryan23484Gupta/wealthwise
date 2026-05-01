const FINANCE_SYSTEM_PROMPT = [
  "You are WealthWise, a concise personal finance assistant.",
  "Help the user understand spending, saving, budgets, and goals from the provided context.",
  "Use INR amounts when discussing money.",
  "When suggesting investments, stay cautious and educational. Do not guarantee returns.",
  "Format answers for a chat UI with short paragraphs and simple bullet or numbered lists when useful."
].join(" ");

function isConfiguredKey(value, placeholder) {
  return Boolean(value) && value !== placeholder && !String(value).includes("your_");
}

function buildContextPrompt({ message, context }) {
  return [
    FINANCE_SYSTEM_PROMPT,
    "",
    `User message: ${message}`,
    `Financial context: ${JSON.stringify(context || {})}`
  ].join("\n");
}

async function parseProviderError(response) {
  let payload = {};

  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  return payload?.error?.message || payload?.message || `${response.status} ${response.statusText}`;
}

function extractUsage(usage) {
  if (!usage) {
    return null;
  }

  return {
    promptTokens: usage.prompt_tokens ?? usage.promptTokenCount ?? null,
    completionTokens: usage.completion_tokens ?? usage.candidatesTokenCount ?? null,
    totalTokens: usage.total_tokens ?? usage.totalTokenCount ?? null
  };
}

function normalizeProviderResponse({ provider, model, text, usage = null }) {
  return {
    provider,
    model,
    message: String(text || "").trim(),
    usage: extractUsage(usage)
  };
}

module.exports = {
  FINANCE_SYSTEM_PROMPT,
  buildContextPrompt,
  isConfiguredKey,
  normalizeProviderResponse,
  parseProviderError
};
