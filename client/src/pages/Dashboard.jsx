import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWebSocket } from '../context/useWebSocket';
import ProgressBar from '../components/ProgressBar';
import TaskForm, { STATUSES, PRIORITIES, CATEGORIES } from '../components/TaskForm';
import TaskItem from '../components/TaskItem';
import NotificationModal from '../components/NotificationModal';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [importantOnly, setImportantOnly] = useState(false);
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Fetch tasks with all active filters
  const load = useCallback(async () => {
    try {
      const params = {};
      if (filter !== 'All') params.status = filter;
      if (priorityFilter !== 'All') params.priority = priorityFilter;
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (importantOnly) params.isImportant = true;
      if (search.trim()) params.search = search.trim();
      if (sort) params.sort = sort;

      const [list, counts] = await Promise.all([
        api.get('/tasks', { params }),
        api.get('/tasks/stats'),
      ]);
      setTasks(list.data);
      setStats(counts.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filter, priorityFilter, categoryFilter, importantOnly, search, sort]);

  // Connect real-time WebSockets
  const { isConnected } = useWebSocket((event) => {
    if (['TASK_CREATED', 'TASK_UPDATED', 'TASK_DELETED', 'TASKS_SEEDED'].includes(event.type)) {
      load();
    }
  });

  // Reload when filters change (with debounce on search)
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const handleSaved = () => {
    setEditing(null);
    load();
  };

  const handleStatusChange = async (task, status) => {
    try {
      await api.put(`/tasks/${task._id}`, { status });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleToggleImportant = async (task) => {
    try {
      await api.put(`/tasks/${task._id}`, { isImportant: !task.isImportant });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      if (editing?._id === task._id) setEditing(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleSeedTasks = async () => {
    try {
      setLoading(true);
      const res = await api.post('/tasks/seed');
      setSuccessMsg(res.data.message || 'Sample DSA & daily tasks loaded!');
      setTimeout(() => setSuccessMsg(''), 4000);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilter('All');
    setPriorityFilter('All');
    setCategoryFilter('All');
    setImportantOnly(false);
    setSearch('');
    setSort('newest');
  };

  // Due counts for notification badge
  const overdueCount = stats.overdue || 0;
  const dueSoonCount = stats.dueSoon || 0;
  const alertCount = overdueCount + dueSoonCount;

  const hasFilters =
    filter !== 'All' ||
    priorityFilter !== 'All' ||
    categoryFilter !== 'All' ||
    importantOnly ||
    search.trim() ||
    sort !== 'newest';

  return (
    <div className="dashboard">
      {/* Top Navbar */}
      <header className="topbar">
        <div>
          <div className="brand-badge-row">
            <h1>Taskboard</h1>
            <span className={`live-pill ${isConnected ? 'live-on' : 'live-off'}`} title={isConnected ? 'Real-time WebSocket connected' : 'Connecting to real-time service'}>
              <span className="live-dot" /> {isConnected ? 'Live Sync' : 'Connecting…'}
            </span>
          </div>
          <p className="muted">Hi {user.name}, here's where your tasks stand.</p>
        </div>

        <div className="header-actions">
          {/* Seed Tasks Button */}
          <button
            type="button"
            className="btn small seed-btn"
            onClick={handleSeedTasks}
            title="Load sample DSA and daily tasks requested"
          >
            ✨ Load DSA Tasks
          </button>

          {/* Notification Bell */}
          <button
            type="button"
            className="btn small notif-btn"
            onClick={() => setIsNotifOpen(true)}
            aria-label="View notifications and reminders"
            title="Deadline Reminders"
          >
            🔔
            {alertCount > 0 && <span className="notif-badge-pill">{alertCount}</span>}
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            className="btn small theme-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>

          <button className="btn small" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      {/* Top Overdue / Due Banner */}
      {alertCount > 0 && (
        <div className="deadline-alert-banner">
          <div className="alert-content">
            <span className="alert-icon">⚠️</span>
            <span>
              <strong>Deadline Alert:</strong> You have{' '}
              {overdueCount > 0 && <b className="text-danger">{overdueCount} overdue task{overdueCount > 1 ? 's' : ''}</b>}
              {overdueCount > 0 && dueSoonCount > 0 && ' and '}
              {dueSoonCount > 0 && <b>{dueSoonCount} task{dueSoonCount > 1 ? 's' : ''} due soon</b>}.
            </span>
          </div>
          <button
            type="button"
            className="btn small alert-action-btn"
            onClick={() => setIsNotifOpen(true)}
          >
            View Reminders & Complete
          </button>
        </div>
      )}

      {/* Success Notification Message */}
      {successMsg && <div className="success-banner">✓ {successMsg}</div>}

      {/* Progress Chart & Analytics */}
      <ProgressBar
        stats={stats}
        activeCategory={categoryFilter}
        onSelectCategory={(cat) => setCategoryFilter(cat)}
      />

      {/* Two-Column App Layout */}
      <div className="layout">
        <aside>
          <TaskForm
            task={editing}
            onSaved={handleSaved}
            onCancel={() => setEditing(null)}
          />
        </aside>

        <section>
          {/* Main Search & Filter Toolbar */}
          <div className="toolbar-container panel">
            {/* Search Input */}
            <div className="toolbar-search-row">
              <input
                type="search"
                placeholder="Search by title, description or category..."
                aria-label="Search tasks"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <button
                type="button"
                className={`btn small star-filter-btn ${importantOnly ? 'active' : ''}`}
                onClick={() => setImportantOnly(!importantOnly)}
                title="Filter by Important"
              >
                {importantOnly ? '⭐ Important Only' : '☆ All Tasks'}
              </button>
            </div>

            {/* Filter Controls Row */}
            <div className="toolbar-filters-row">
              {/* Status Tabs */}
              <div className="tabs" role="tablist">
                {['All', ...STATUSES].map((s) => (
                  <button
                    key={s}
                    role="tab"
                    aria-selected={filter === s}
                    className={filter === s ? 'tab active' : 'tab'}
                    onClick={() => setFilter(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Priority Filter */}
              <div className="filter-select-wrapper">
                <select
                  aria-label="Filter by Priority"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="All">All Priorities</option>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p === 'High' ? '🔴 High' : p === 'Medium' ? '🟡 Medium' : '🟢 Low'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="filter-select-wrapper">
                <select
                  aria-label="Filter by Category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div className="filter-select-wrapper sort-wrapper">
                <select
                  aria-label="Sort tasks by"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="newest">🕒 Newest Added</option>
                  <option value="dueDate_asc">📅 Due Date (Earliest)</option>
                  <option value="dueDate_desc">📅 Due Date (Latest)</option>
                  <option value="priority_desc">⚡ Priority (High → Low)</option>
                  <option value="priority_asc">⚡ Priority (Low → High)</option>
                  <option value="title_asc">🔤 Title (A - Z)</option>
                  <option value="oldest">⏳ Oldest Added</option>
                </select>
              </div>

              {/* Reset Filters */}
              {hasFilters && (
                <button
                  type="button"
                  className="btn small reset-btn"
                  onClick={resetFilters}
                  title="Clear all active filters"
                >
                  Reset Filters ✕
                </button>
              )}
            </div>

            {/* Quick Category Chips for Fast Filtering */}
            <div className="quick-category-pills">
              <span className="muted small">Quick Tags:</span>
              {['All', 'DSA', 'Study', 'Personal', 'Work', 'Finance', 'Health'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`quick-cat-btn ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === 'DSA' ? '💻 DSA' : cat === 'Study' ? '📚 Study' : cat}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="error" role="alert">{error}</p>}

          {loading ? (
            <p className="muted center-note">Loading tasks…</p>
          ) : tasks.length === 0 ? (
            <div className="empty panel">
              <p>
                {hasFilters
                  ? 'No tasks match your active filters or search.'
                  : 'No tasks yet. Add a new task on the left or click "Load DSA Tasks" above!'}
              </p>
              {hasFilters ? (
                <button className="btn small primary mt-2" onClick={resetFilters}>
                  Clear All Filters
                </button>
              ) : (
                <button className="btn small primary mt-2" onClick={handleSeedTasks}>
                  ✨ Load Pre-made DSA & Daily Tasks
                </button>
              )}
            </div>
          ) : (
            <ul className="task-list">
              {tasks.map((t) => (
                <TaskItem
                  key={t._id}
                  task={t}
                  onStatusChange={handleStatusChange}
                  onToggleImportant={handleToggleImportant}
                  onEdit={setEditing}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Notifications Modal */}
      <NotificationModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        tasks={tasks}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
