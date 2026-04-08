import { useState } from "react";
import GoalCard from "../components/GoalCard";
import SectionCard from "../components/SectionCard";
import { useFinance } from "../context/FinanceContext";

export default function SettingsPage() {
  const { user, preferences, updateProfile, toggleTheme, goals, contributeToGoal, addGoal, notifications } =
    useFinance();
  const [form, setForm] = useState({
    name: user.name,
    role: user.role,
    email: user.email
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleProfileSubmit(event) {
    event.preventDefault();
    updateProfile(form);
  }

  function handleGoalSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    addGoal({
      title: formData.get("title"),
      target: Number(formData.get("target")),
      saved: Number(formData.get("saved")),
      deadline: formData.get("deadline")
    });
    event.currentTarget.reset();
  }

  return (
    <div className="settings-layout">
      <SectionCard title="Profile" subtitle="Update your identity and account view.">
        <form className="transaction-form" onSubmit={handleProfileSubmit}>
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

      <SectionCard title="Notifications" subtitle="Overspending and unusual activity alerts.">
        <div className="stack-list">
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
            />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
