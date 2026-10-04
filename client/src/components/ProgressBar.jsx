import { useState } from 'react';

const STATUS_SEGMENTS = [
  ['Completed', 'done', '#2e8b62'],
  ['In Progress', 'doing', '#2f5dd3'],
  ['Pending', 'todo', '#c98a1b'],
];

export default function ProgressBar({ stats, activeCategory, onSelectCategory }) {
  const [showDetails, setShowDetails] = useState(false);

  const total = stats.total || STATUS_SEGMENTS.reduce((sum, [name]) => sum + (stats[name] || 0), 0);
  const completed = stats['Completed'] || 0;
  const inProgress = stats['In Progress'] || 0;
  const pending = stats['Pending'] || 0;
  const overdue = stats.overdue || 0;
  const important = stats.important || 0;

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="progress-card panel" aria-label="Task progress and charts">
      {/* Top Overview Cards */}
      <div className="stats-summary-grid">
        <div className="stat-card">
          <span className="stat-num">{total}</span>
          <span className="stat-lbl">Total Tasks</span>
        </div>
        <div className="stat-card done-card">
          <span className="stat-num text-done">{completed}</span>
          <span className="stat-lbl">Completed</span>
        </div>
        <div className="stat-card doing-card">
          <span className="stat-num text-doing">{inProgress}</span>
          <span className="stat-lbl">In Progress</span>
        </div>
        <div className="stat-card todo-card">
          <span className="stat-num text-todo">{pending}</span>
          <span className="stat-lbl">Pending</span>
        </div>
        {overdue > 0 && (
          <div className="stat-card overdue-card">
            <span className="stat-num text-danger">{overdue}</span>
            <span className="stat-lbl">⚠️ Overdue</span>
          </div>
        )}
        {important > 0 && (
          <div className="stat-card important-card">
            <span className="stat-num text-amber">{important}</span>
            <span className="stat-lbl">⭐ Important</span>
          </div>
        )}
      </div>

      {/* Main Visual Progress Bar */}
      <div className="progress-bar-section">
        <div className="progress-header-row">
          <div className="progress-title-meta">
            <strong>Overall Completion Rate</strong>
            <span className="progress-pct-badge">{percent}%</span>
          </div>
          <button
            type="button"
            className="btn small text-btn"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Analytics ▲' : 'Show Charts & Categories ▼'}
          </button>
        </div>

        <div className="bar" role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100">
          {STATUS_SEGMENTS.map(([name, cls]) =>
            stats[name] ? (
              <span
                key={name}
                className={`seg ${cls}`}
                style={{ width: `${(stats[name] / (total || 1)) * 100}%` }}
                title={`${name}: ${stats[name]}`}
              />
            ) : null
          )}
        </div>

        <ul className="legend">
          {STATUS_SEGMENTS.slice().reverse().map(([name, cls]) => (
            <li key={name}>
              <i className={`dot ${cls}`} /> {name} <b>{stats[name] || 0}</b>
            </li>
          ))}
        </ul>
      </div>

      {/* Expanded Details: Priority & Category Breakdowns */}
      {showDetails && (
        <div className="analytics-drawer">
          <div className="analytics-grid">
            {/* Priority Distribution */}
            <div className="analytics-block">
              <h4>Priority Breakdown</h4>
              <div className="priority-bars">
                <div className="p-row">
                  <span className="p-lbl">🔴 High:</span>
                  <div className="p-track">
                    <div
                      className="p-fill p-high"
                      style={{
                        width: `${((stats.priority?.High || 0) / (total || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="p-val">{stats.priority?.High || 0}</span>
                </div>
                <div className="p-row">
                  <span className="p-lbl">🟡 Medium:</span>
                  <div className="p-track">
                    <div
                      className="p-fill p-med"
                      style={{
                        width: `${((stats.priority?.Medium || 0) / (total || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="p-val">{stats.priority?.Medium || 0}</span>
                </div>
                <div className="p-row">
                  <span className="p-lbl">🟢 Low:</span>
                  <div className="p-track">
                    <div
                      className="p-fill p-low"
                      style={{
                        width: `${((stats.priority?.Low || 0) / (total || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="p-val">{stats.priority?.Low || 0}</span>
                </div>
              </div>
            </div>

            {/* Category / Tags Breakdown */}
            <div className="analytics-block">
              <h4>Categories & Tags (Click to filter)</h4>
              <div className="category-tags-list">
                {stats.categories && Object.keys(stats.categories).length > 0 ? (
                  Object.entries(stats.categories).map(([cat, count]) => (
                    <button
                      key={cat}
                      type="button"
                      className={`cat-chip-btn ${activeCategory === cat ? 'active' : ''}`}
                      onClick={() => onSelectCategory && onSelectCategory(activeCategory === cat ? 'All' : cat)}
                    >
                      🏷️ {cat} <b className="chip-count">{count}</b>
                    </button>
                  ))
                ) : (
                  <p className="muted small">No categories yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
