const express = require("express");

const {
  getSession,
  login,
  logout,
  requestPasswordReset,
  requestSignupOtp,
  requireUser,
  resetPassword,
  resendSignupOtp,
  verifySignupOtp
} = require("../controllers/authController");

const router = express.Router();

router.post("/signup/request-otp", requestSignupOtp);
router.post("/signup/verify-otp", verifySignupOtp);
router.post("/signup/resend-otp", resendSignupOtp);
router.post("/signup", (req, res) => {
  res.status(410).json({
    message: "Direct signup is disabled. Request an OTP first to complete registration."
  });
});
router.post("/login", login);
router.post("/password/forgot", requestPasswordReset);
router.post("/password/reset", resetPassword);
router.get("/session", requireUser, getSession);
router.post("/logout", requireUser, logout);

module.exports = router;
