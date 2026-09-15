import { useEffect, useRef, useState } from "react";
import "./notification-center.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7777/crm/api/v1";

function NotificationCenter({ onOpenTicket }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef(null);

  const getHeaders = () => ({ "x-access-token": localStorage.getItem("crmToken") });

  const loadNotifications = async (quiet = false) => {
    if (!localStorage.getItem("crmToken")) return;
    if (!quiet) setLoading(true);
    try {
      const response = await fetch(`${API_URL}/notifications?limit=12`, { headers: getHeaders() });
      const data = await response.json();
      if (!response.ok) return;
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(Number(data.unreadCount) || 0);
    } catch {
      // Notification polling should never interrupt the CRM UI.
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(() => loadNotifications(true), 30000);
    const refresh = () => loadNotifications(true);
    window.addEventListener("crm:notifications-changed", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("crm:notifications-changed", refresh);
    };
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const markRead = async (notification) => {
    if (notification.read) return;
    try {
      await fetch(`${API_URL}/notifications/${notification._id}/read`, {
        method: "PATCH",
        headers: getHeaders()
      });
      setNotifications((items) => items.map((item) => item._id === notification._id ? { ...item, read: true } : item));
      setUnreadCount((count) => Math.max(count - 1, 0));
    } catch {
      // Ignore non-critical notification update errors.
    }
  };

  const markAllRead = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: getHeaders()
      });
      if (!response.ok) return;
      setNotifications((items) => items.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch {
      // Ignore non-critical notification update errors.
    }
  };

  const openNotification = async (notification) => {
    await markRead(notification);
    if (!notification.ticketId || !onOpenTicket) return;
    try {
      const response = await fetch(`${API_URL}/tickets/${notification.ticketId}`, { headers: getHeaders() });
      const ticket = await response.json();
      if (response.ok) {
        onOpenTicket(ticket);
        setOpen(false);
      }
    } catch {
      // Ticket may no longer be accessible to this user.
    }
  };

  const formatTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
  };

  return (
    <div className="notification-center" ref={rootRef}>
      <button
        className={`notification-bell ${open ? "active" : ""}`}
        onClick={() => {
          setOpen((value) => !value);
          if (!open) loadNotifications();
        }}
        aria-label="Notifications"
      >
        <span>🔔</span>
        {unreadCount > 0 && <b>{unreadCount > 9 ? "9+" : unreadCount}</b>}
      </button>

      {open && (
        <div className="notification-popover">
          <div className="notification-popover-head">
            <div><span>CRM ACTIVITY</span><h3>Notifications</h3></div>
            {unreadCount > 0 && <button onClick={markAllRead}>Mark all read</button>}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-empty">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty"><strong>You are all caught up</strong><span>New ticket activity will appear here.</span></div>
            ) : notifications.map((notification) => (
              <button
                key={notification._id}
                className={`notification-item ${notification.read ? "" : "unread"}`}
                onClick={() => openNotification(notification)}
              >
                <i></i>
                <div>
                  <strong>{notification.title}</strong>
                  <p>{notification.message}</p>
                  <span>{formatTime(notification.createdAt)}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="notification-popover-foot">
            <button onClick={() => loadNotifications()}>Refresh activity</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
