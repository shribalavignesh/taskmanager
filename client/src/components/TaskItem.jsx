import { STATUSES } from './TaskForm';

const STATUS_CLASS = { Pending: 'todo', 'In Progress': 'doing', Completed: 'done' };
const PRIORITY_ICON = { High: '🔴', Medium: '🟡', Low: '🟢' };

export default function TaskItem({
  task,
  onStatusChange,
  onToggleImportant,
  onEdit,
  onDelete,
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const getDueBadge = () => {
    if (!task.dueDate) return null;
    const due = task.dueDate.slice(0, 10);
    const isCompleted = task.status === 'Completed';

    if (isCompleted) {
      return <span className="badge due-done">Due {due}</span>;
    }
    if (due < todayStr) {
      return <span className="badge due-overdue">⚠️ Overdue ({due})</span>;
    }
    if (due === todayStr) {
      return <span className="badge due-today">⏰ Due Today</span>;
    }
    if (due === tomorrowStr) {
      return <span className="badge due-soon">⏳ Due Tomorrow</span>;
    }
    return <span className="badge due-normal">📅 Due {due}</span>;
  };

  const getCategoryClass = (cat) => {
    const clean = (cat || 'general').toLowerCase();
    if (clean === 'dsa') return 'cat-dsa';
    if (clean === 'study') return 'cat-study';
    if (clean === 'personal') return 'cat-personal';
    if (clean === 'work') return 'cat-work';
    if (clean === 'health') return 'cat-health';
    if (clean === 'finance') return 'cat-finance';
    return 'cat-general';
  };

  return (
    <li
      className={`task ${STATUS_CLASS[task.status]} ${
        task.isImportant ? 'task-important' : ''
      }`}
    >
      <button
        type="button"
        className={`star-btn ${task.isImportant ? 'starred' : ''}`}
        onClick={() => onToggleImportant(task)}
        title={task.isImportant ? 'Mark as normal' : 'Mark as important'}
        aria-label="Toggle importance"
      >
        {task.isImportant ? '⭐' : '☆'}
      </button>

      <div className="task-body">
        <div className="task-title-row">
          <h3 className={task.status === 'Completed' ? 'struck' : ''}>
            {task.title}
          </h3>
        </div>

        {task.description && <p>{task.description}</p>}

        <div className="task-meta">
          {task.category && (
            <span className={`cat-pill ${getCategoryClass(task.category)}`}>
              🏷️ {task.category}
            </span>
          )}

          <span className={`priority-pill priority-${(task.priority || 'medium').toLowerCase()}`}>
            {PRIORITY_ICON[task.priority || 'Medium']} {task.priority || 'Medium'}
          </span>

          {getDueBadge()}

          <small className="muted">
            Added {new Date(task.createdAt).toLocaleDateString()}
          </small>
        </div>
      </div>

      <div className="task-actions">
        <select
          aria-label={`Status for ${task.title}`}
          value={task.status}
          onChange={(e) => onStatusChange(task, e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button className="btn small" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button className="btn small danger" onClick={() => onDelete(task)}>
          Delete
        </button>
      </div>
    </li>
  );
}
