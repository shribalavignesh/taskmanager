import { useState, useEffect } from 'react';

export default function NotificationModal({ isOpen, onClose, tasks, onStatusChange }) {
  const [permission, setPermission] = useState(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const twoDaysLater = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

  const incompleteTasks = tasks.filter((t) => t.status !== 'Completed' && t.dueDate);

  const overdue = incompleteTasks.filter((t) => t.dueDate < todayStr);
  const dueToday = incompleteTasks.filter((t) => t.dueDate === todayStr);
  const dueSoon = incompleteTasks.filter((t) => t.dueDate > todayStr && t.dueDate <= twoDaysLater);

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        new Notification('Taskboard Notifications Active', {
          body: 'You will receive reminders for upcoming and overdue deadlines.',
        });
      }
    } catch (e) {}
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h2>🔔 Deadline Reminders & Alerts</h2>
            <p className="muted">Keep track of upcoming dues and urgent tasks</p>
          </div>
          <button className="btn small" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {typeof Notification !== 'undefined' && permission !== 'granted' && (
          <div className="notification-permission-prompt">
            <span>Get desktop alerts even when this tab is in the background</span>
            <button className="btn small primary" onClick={requestNotificationPermission}>
              Enable Browser Alerts
            </button>
          </div>
        )}

        <div className="notification-sections">
          {overdue.length > 0 && (
            <div className="notif-group overdue-group">
              <h3 className="notif-heading overdue-heading">
                ⚠️ Overdue Tasks ({overdue.length})
              </h3>
              <ul className="notif-list">
                {overdue.map((t) => (
                  <li key={t._id} className="notif-item overdue-item">
                    <div className="notif-info">
                      <span className="notif-badge overdue-badge">Overdue ({t.dueDate})</span>
                      <strong>{t.title}</strong>
                      {t.category && <span className="cat-pill">{t.category}</span>}
                    </div>
                    <button
                      className="btn small done-btn"
                      onClick={() => onStatusChange(t, 'Completed')}
                    >
                      ✓ Mark Done
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {dueToday.length > 0 && (
            <div className="notif-group today-group">
              <h3 className="notif-heading today-heading">
                ⏰ Due Today ({dueToday.length})
              </h3>
              <ul className="notif-list">
                {dueToday.map((t) => (
                  <li key={t._id} className="notif-item today-item">
                    <div className="notif-info">
                      <span className="notif-badge today-badge">Due Today</span>
                      <strong>{t.title}</strong>
                      {t.category && <span className="cat-pill">{t.category}</span>}
                    </div>
                    <button
                      className="btn small done-btn"
                      onClick={() => onStatusChange(t, 'Completed')}
                    >
                      ✓ Mark Done
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {dueSoon.length > 0 && (
            <div className="notif-group soon-group">
              <h3 className="notif-heading soon-heading">
                ⏳ Coming Up Soon ({dueSoon.length})
              </h3>
              <ul className="notif-list">
                {dueSoon.map((t) => (
                  <li key={t._id} className="notif-item soon-item">
                    <div className="notif-info">
                      <span className="notif-badge soon-badge">Due {t.dueDate}</span>
                      <strong>{t.title}</strong>
                      {t.category && <span className="cat-pill">{t.category}</span>}
                    </div>
                    <button
                      className="btn small done-btn"
                      onClick={() => onStatusChange(t, 'Completed')}
                    >
                      ✓ Mark Done
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {overdue.length === 0 && dueToday.length === 0 && dueSoon.length === 0 && (
            <div className="empty-notif">
              <p>🎉 All caught up! You have no overdue or urgent upcoming tasks.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
