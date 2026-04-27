const asyncHandler = require("../utils/asyncHandler");
const { AppError } = require("../utils/errors");

const sendEmail = asyncHandler(async (req, res) => {
  const { to, subject, text, html } = req.body;

  if (!to || !subject || (!text && !html)) {
    throw new AppError("`to`, `subject`, and either `text` or `html` are required.", 400);
  }

  const data = await req.app.locals.emailService.sendMail({
    to,
    subject,
    text,
    html
  });

  res.status(200).json({
    success: true,
    message: "Email sent successfully.",
    data
  });
});

module.exports = {
  sendEmail
};
