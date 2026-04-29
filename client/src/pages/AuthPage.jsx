import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useFinance } from "../context/FinanceContext";

export default function AuthPage() {
  const navigate = useNavigate();
  const {
    login,
    requestPasswordReset,
    requestSignupOtp,
    resetPassword,
    verifySignupOtp,
    resendSignupOtp,
    user
  } = useFinance();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    newPassword: "",
    otp: ""
  });
  const [otpSession, setOtpSession] = useState(null);
  const [resetSession, setResetSession] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (mode === "login") {
        await login(form);
        setForm({
          name: "",
          email: "",
          password: "",
          newPassword: "",
          otp: ""
        });
        navigate("/");
      } else if (mode === "forgot" && resetSession) {
        const result = await resetPassword({
          email: resetSession.email,
          otp: form.otp,
          password: form.newPassword
        });
        setForm({
          name: "",
          email: "",
          password: "",
          newPassword: "",
          otp: ""
        });
        setResetSession(null);
        setMode("login");
        setMessage(result.message);
      } else if (mode === "forgot") {
        const result = await requestPasswordReset(form.email);
        setResetSession({
          email: result.email || form.email,
          otpExpiresAt: result.otpExpiresAt,
          developmentOtp: result.developmentOtp
        });
        setMessage(result.message);
      } else if (otpSession) {
        await verifySignupOtp({
          email: otpSession.email,
          otp: form.otp
        });
        setForm({
          name: "",
          email: "",
          password: "",
          newPassword: "",
          otp: ""
        });
        setOtpSession(null);
        setMode("login");
        navigate("/");
      } else {
        const result = await requestSignupOtp(form);
        setOtpSession({
          email: result.email,
          otpExpiresAt: result.otpExpiresAt,
          developmentOtp: result.developmentOtp
        });
        setMessage(result.message);
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendOtp() {
    if (!otpSession?.email) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const result = await resendSignupOtp(otpSession.email);
      setOtpSession({
        email: result.email,
        otpExpiresAt: result.otpExpiresAt,
        developmentOtp: result.developmentOtp
      });
      setMessage(result.message);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (user.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="auth-shell">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <div className="auth-copy">
          <span className="auth-badge">AI-powered finance manager</span>
          <h1>Plan, track, and optimize every rupee.</h1>
          <p>
            PulseIQ blends personal finance controls with AI insights, budget alerts, and clean
            analytics in one responsive workspace.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="mode-toggle">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
                setOtpSession(null);
                setResetSession(null);
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === "signup" ? "active" : ""}
              onClick={() => {
                setMode("signup");
                setError("");
                setMessage("");
                setResetSession(null);
              }}
            >
              Sign Up
            </button>
          </div>

          {mode === "forgot" && resetSession ? (
            <>
              <label>
                OTP code
                <input
                  name="otp"
                  value={form.otp}
                  onChange={handleChange}
                  inputMode="numeric"
                  minLength={6}
                  maxLength={6}
                  placeholder="123456"
                  required
                />
              </label>
              <label>
                New password
                <input
                  name="newPassword"
                  type="password"
                  value={form.newPassword}
                  onChange={handleChange}
                  minLength={6}
                  required
                />
              </label>
            </>
          ) : mode === "signup" && otpSession ? (
            <>

              <label>
                OTP code
                <input
                  name="otp"
                  value={form.otp}
                  onChange={handleChange}
                  inputMode="numeric"
                  minLength={6}
                  maxLength={6}
                  placeholder="123456"
                  required
                />
              </label>
            </>
          ) : mode === "forgot" ? (
            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={handleChange} required />
            </label>
          ) : (
            <>
              {mode === "signup" && (
                <label>
                  Full name
                  <input name="name" value={form.name} onChange={handleChange} required />
                </label>
              )}
              <label>
                Email
                <input name="email" type="email" value={form.email} onChange={handleChange} required />
              </label>
              <label>
                Password
                <input name="password" type="password" value={form.password} onChange={handleChange} required />
              </label>
            </>
          )}

          {mode === "login" ? (
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setMode("forgot");
                setError("");
                setMessage("");
                setOtpSession(null);
              }}
            >
              Forgot password?
            </button>
          ) : null}

          {error ? <p className="auth-error">{error}</p> : null}
          {message ? <p className="auth-message">{message}</p> : null}

          <button type="submit" className="primary-button full-width" disabled={isSubmitting}>
            {isSubmitting
              ? "Please wait..."
              : mode === "forgot"
                ? resetSession
                  ? "Reset password"
                  : "Send reset OTP"
                : mode === "login"
                ? "Access dashboard"
                : otpSession
                  ? "Verify OTP"
                  : "Send OTP"}
          </button>

          {mode === "signup" && otpSession ? (
            <div className="auth-inline-actions">
              <button type="button" className="ghost-button" onClick={handleResendOtp} disabled={isSubmitting}>
                Resend OTP
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setOtpSession(null);
                  setForm((current) => ({ ...current, otp: "" }));
                  setError("");
                  setMessage("");
                }}
                disabled={isSubmitting}
              >
                Edit details
              </button>
            </div>
          ) : null}

          {mode === "forgot" ? (
            <div className="auth-inline-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setMode("login");
                  setResetSession(null);
                  setError("");
                  setMessage("");
                }}
                disabled={isSubmitting}
              >
                Back to login
              </button>
            </div>
          ) : null}
        </form>
      </motion.div>
    </div>
  );
}
