import { useEffect, useRef, useState } from "react";
import { FiBell } from "react-icons/fi";
import { useFinance } from "../context/FinanceContext";

function formatNotificationTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export default function NotificationBell() {
  const {
    notifications,
    notificationsError,
    notificationsLoading,
    refreshNotifications,
    markNotificationsRead,
    user
  } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    if (!user.isAuthenticated) {
      return;
    }

    refreshNotifications().catch(() => {
      // Shared notifications error state handles the message.
    });
  }, [user.isAuthenticated]);

  useEffect(() => {
    if (!user.isAuthenticated) {
      setIsOpen(false);
    }
  }, [user.isAuthenticated]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  async function handleToggle() {
    const nextIsOpen = !isOpen;
    setIsOpen(nextIsOpen);

    if (nextIsOpen && unreadCount > 0) {
      try {
        await markNotificationsRead();
      } catch {
        return;
      }
    }
  }

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        type="button"
        className="notification-pill"
        onClick={handleToggle}
        disabled={!user.isAuthenticated}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <FiBell />
        <span>{unreadCount}</span>
      </button>

      {isOpen ? (
        <div className="notification-dropdown" role="dialog" aria-label="Notifications">
          <div className="notification-dropdown-header">
            <div>
              <strong>Notifications</strong>
              <p>{notificationsLoading ? "Loading updates..." : `${notifications.length} total`}</p>
            </div>
          </div>

          {notificationsError ? <p className="notification-status error">{notificationsError}</p> : null}
          {notificationsLoading ? <p className="notification-status">Loading notifications...</p> : null}

          {!notificationsLoading && notifications.length === 0 ? (
            <p className="notification-status">No notifications available</p>
          ) : null}

          {!notificationsLoading && notifications.length > 0 ? (
            <div className="notification-list">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`notification-item ${notification.read ? "read" : "unread"}`}
                >
                  <div className="notification-item-top">
                    <h4>{notification.title}</h4>
                    <time dateTime={notification.createdAt}>
                      {formatNotificationTime(notification.createdAt)}
                    </time>
                  </div>
                  <p>{notification.message}</p>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
