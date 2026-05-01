const asyncHandler = require("../utils/asyncHandler");
const { AppError } = require("../utils/errors");
const { SUPPORTED_PROVIDERS } = require("../services/aiAssistantService");

const chatWithAgent = asyncHandler(async (req, res) => {
  const { message, context, provider = "openai" } = req.body;

  if (!message || typeof message !== "string") {
    throw new AppError("`message` is required and must be a string.", 400);
  }

  if (!SUPPORTED_PROVIDERS.includes(String(provider).toLowerCase())) {
    throw new AppError("`provider` must be one of: openai, groq, gemini.", 400);
  }

  let result;

  try {
    result = await req.app.locals.aiAssistantService.handleUserMessage({
      provider,
      message: message.trim(),
      context
    });
  } catch (error) {
    throw new AppError(error.message, 502);
  }

  res.status(200).json({
    success: true,
    message: result.message,
    provider: result.provider,
    model: result.model,
    usage: result.usage
  });
});

module.exports = {
  chatWithAgent
};
