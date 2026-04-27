const asyncHandler = require("../utils/asyncHandler");
const { AppError } = require("../utils/errors");

const chatWithAgent = asyncHandler(async (req, res) => {
  const { message, context } = req.body;

  if (!message || typeof message !== "string") {
    throw new AppError("`message` is required and must be a string.", 400);
  }

  const result = await req.app.locals.agentService.handleUserMessage({
    message: message.trim(),
    context
  });

  res.status(200).json({
    success: true,
    message: result.reply,
    agent: result.agent,
    email: result.email
  });
});

module.exports = {
  chatWithAgent
};
