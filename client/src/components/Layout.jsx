import { NavLink, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiBarChart2,
  FiGrid,
  FiLogOut,
  FiMessageCircle,
  FiMoon,
  FiRepeat,
  FiSettings,
  FiSun
} from "react-icons/fi";
import { useFinance } from "../context/FinanceContext";
import favicon from "../Favicon.png";
import NotificationBell from "./NotificationBell";

const navItems = [
  { to: "/", label: "Dashboard", icon: FiGrid },
  { to: "/transactions", label: "Transactions", icon: FiRepeat },
  { to: "/analytics", label: "Analytics", icon: FiBarChart2 },
  { to: "/assistant", label: "AI Assistant", icon: FiMessageCircle },
  { to: "/settings", label: "Settings", icon: FiSettings }
];

export default function Layout() {
  const { user, preferences, toggleTheme, logout } = useFinance();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-block">
            <span className="brand-mark">
              <img src={favicon} alt="" aria-hidden="true" />
            </span>
            <div>
              <h1>Wealthwise</h1>
              <p>AI-powered money clarity</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              >
                <Icon />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="profile-card">
          <img src="https://cdn-icons-png.flaticon.com/512/3607/3607444.png" alt={user.name} />
          <div>
            <strong>{user.name}</strong>
            <p>{user.role}</p>
          </div>
        </div>
      </aside>

      <div className="content-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h2>{user.name}, your money is moving well today.</h2>
          </div>

          <div className="topbar-actions">
            <button type="button" className="icon-button" onClick={toggleTheme}>
              {preferences.theme === "dark" ? <FiSun /> : <FiMoon />}
            </button>
            <NotificationBell />
            <button type="button" className="logout-button" onClick={logout}>
              <FiLogOut />
              Logout
            </button>
          </div>
        </header>

        <motion.main
          className="page-view"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
