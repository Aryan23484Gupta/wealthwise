import { useEffect, useState } from "react";
import GoalCard from "../components/GoalCard";
import PasswordField from "../components/PasswordField";
import SectionCard from "../components/SectionCard";
import { useFinance } from "../context/FinanceContext";
import { getAvatarUrl } from "../utils/avatar";

export default function SettingsPage() {
  const {
    user,
    preferences,
    updateProfile,
    toggleTheme,
    goals,
    contributeToGoal,
    addGoal,
    deleteGoal,
    notifications,
    clearNotifications,
    changePassword,
    deleteAccount
  } =
    useFinance();
  const [form, setForm] = useState({
    name: user.name,
    role: user.role,
    email: user.email,
    avatar: user.avatar,
    avatarData: ""
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      name: user.name,
      role: user.role,
      email: user.email,
      avatar: user.avatar,
      avatarData: ""
    });
  }, [user.avatar, user.email, user.name, user.role]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0];

    setError("");
    setStatus("");

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Choose a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 750 * 1024) {
      setError("Profile picture must be 750 KB or smaller.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        avatar: reader.result,
        avatarData: reader.result
      }));
    };
    reader.onerror = () => {
      setError("Unable to read that image. Try another file.");
    };
    reader.readAsDataURL(file);
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setError("");
    setStatus("");

    try {
      await updateProfile(form);
      setStatus("Profile saved.");
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  async function handleGoalSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError("");
    setStatus("");

    try {
      await addGoal({
        title: formData.get("title"),
        target: Number(formData.get("target")),
        saved: Number(formData.get("saved")),
        deadline: formData.get("deadline")
      });
      event.currentTarget.reset();
      setStatus("Goal added.");
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError("");
    setStatus("");

    try {
      await changePassword({
        currentPassword: formData.get("currentPassword"),
        newPassword: formData.get("newPassword")
      });
      event.currentTarget.reset();
      setStatus("Password changed.");
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  async function handleDeleteAccount(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const confirmation = formData.get("confirmation")?.trim();

    setError("");
    setStatus("");

    if (confirmation !== "DELETE") {
      setError("Type DELETE to confirm permanent account deletion.");
      return;
    }

    try {
      await deleteAccount(formData.get("password"));
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <div className="settings-layout">
      <SectionCard title="Profile" subtitle="Update your identity and account view.">
        <form className="transaction-form" onSubmit={handleProfileSubmit}>
          <div className="avatar-upload">
            <img
              src={getAvatarUrl(form.avatar)}
              alt={form.name || "Profile"}
            />
            <label>
              Profile picture
              <input type="file" accept="image/*" onChange={handleAvatarChange} />
            </label>
          </div>
          <div className="form-grid">
            <label>
              Name
              <input name="name" value={form.name} onChange={handleChange} />
            </label>
            <label>
              Role
              <input name="role" value={form.role} onChange={handleChange} />
            </label>
            <label>
              Email
              <input name="email" value={form.email} onChange={handleChange} />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="primary-button">
              Save profile
            </button>
          </div>
          {status ? <p className="auth-message">{status}</p> : null}
          {error ? <p className="auth-error">{error}</p> : null}
        </form>
      </SectionCard>

      <SectionCard title="Preferences" subtitle="Theme, display, and account tools.">
        <div className="preferences-panel">
          <div>
            <h4>Theme mode</h4>
            <p>Switch between light and dark fintech-inspired palettes.</p>
          </div>
          <button type="button" className="ghost-button" onClick={toggleTheme}>
            {preferences.theme === "dark" ? "Switch to light" : "Switch to dark"}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Change password" subtitle="Update your login password securely.">
        <form className="transaction-form" onSubmit={handlePasswordSubmit}>
          <div className="form-grid">
            <PasswordField label="Current password" name="currentPassword" required />
            <PasswordField label="New password" name="newPassword" minLength={6} required />
          </div>
          <div className="form-actions">
            <button type="submit" className="primary-button">
              Change password
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Delete account" subtitle="Permanently remove your profile, transactions, and settings.">
        <form className="transaction-form danger-zone" onSubmit={handleDeleteAccount}>
          <div className="form-grid">
            <PasswordField label="Password" name="password" required />
            <label>
              Type DELETE
              <input name="confirmation" placeholder="DELETE" required />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="danger-button">
              Delete permanently
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Notifications"
        subtitle="Overspending and unusual activity alerts."
        action={
          <button type="button" className="ghost-button" onClick={clearNotifications} disabled={!notifications.length}>
            Clear all
          </button>
        }
      >
        <div className="stack-list">
          {notifications.length === 0 ? <p className="auth-message">No notifications available.</p> : null}
          {notifications.map((item) => (
            <div key={item.id} className={`notice-card ${item.type}`}>
              <strong>{item.title}</strong>
              <p>{item.message}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Savings goals" subtitle="Add and track multiple personal targets.">
        <form className="transaction-form" onSubmit={handleGoalSubmit}>
          <div className="form-grid">
            <label>
              Goal title
              <input name="title" placeholder="Home office setup" required />
            </label>
            <label>
              Target
              <input name="target" type="number" min="1" required />
            </label>
            <label>
              Saved
              <input name="saved" type="number" min="0" required />
            </label>
            <label>
              Deadline
              <input name="deadline" type="date" required />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="primary-button">
              Add goal
            </button>
          </div>
        </form>

        <div className="stack-list">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={{ ...goal, percentage: Math.round((goal.saved / goal.target) * 100) }}
              onContribute={contributeToGoal}
              onDelete={deleteGoal}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
