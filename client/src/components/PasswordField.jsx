import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function PasswordField({ label, ...inputProps }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label>
      {label}
      <span className="password-field">
        <input {...inputProps} type={isVisible ? "text" : "password"} />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? <FiEyeOff /> : <FiEye />}
        </button>
      </span>
    </label>
  );
}
