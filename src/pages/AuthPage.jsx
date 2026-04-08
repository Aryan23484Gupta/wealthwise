import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useFinance } from "../context/FinanceContext";

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useFinance();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "Sonam Kumari",
    email: "sonam@gmail.com",
    password: "Demo123"
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    login(form);
    navigate("/");
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
          <h1>Plan, track, and optimize every dollar.</h1>
          <p>
            PulseIQ blends personal finance controls with AI insights, budget alerts, and clean
            analytics in one responsive workspace.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="mode-toggle">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
              Login
            </button>
            <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
              Sign Up
            </button>
          </div>

          {mode === "signup" && (
            <label>
              Full name
              <input name="name" placeholder={form.name} onChange={handleChange} required />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" placeholder={form.email} onChange={handleChange} required />
          </label>
          <label>
            Password
            <input name="password" type="password" placeholder={form.password} onChange={handleChange} required />
          </label>

          <button type="submit" className="primary-button full-width">
            {mode === "login" ? "Access dashboard" : "Create account"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
