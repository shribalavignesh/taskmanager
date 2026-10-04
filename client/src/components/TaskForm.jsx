import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';

export const STATUSES = ['Pending', 'In Progress', 'Completed'];
export const PRIORITIES = ['Low', 'Medium', 'High'];
export const CATEGORIES = ['DSA', 'Study', 'Work', 'Personal', 'Health', 'Finance', 'General'];

const EMPTY = {
  title: '',
  description: '',
  status: 'Pending',
  priority: 'Medium',
  dueDate: '',
  category: 'General',
  isImportant: false,
};

// Creates a task, or edits one when `task` is passed in
export default function TaskForm({ task, onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [customCategory, setCustomCategory] = useState(false);

  // Fill the form when a task is chosen for editing
  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'Pending',
        priority: task.priority || 'Medium',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        category: task.category || 'General',
        isImportant: Boolean(task.isImportant),
      });
      setCustomCategory(!CATEGORIES.includes(task.category || 'General'));
    } else {
      setForm(EMPTY);
      setCustomCategory(false);
    }
    setError('');
  }, [task]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCategorySelect = (e) => {
    const val = e.target.value;
    if (val === 'CUSTOM') {
      setCustomCategory(true);
      setForm((prev) => ({ ...prev, category: '' }));
    } else {
      setCustomCategory(false);
      setForm((prev) => ({ ...prev, category: val }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = {
        ...form,
        category: (form.category || 'General').trim(),
        dueDate: form.dueDate || null,
      };

      if (task) await api.put(`/tasks/${task._id}`, payload);
      else await api.post('/tasks', payload);

      setForm(EMPTY);
      setCustomCategory(false);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="panel task-form" onSubmit={onSubmit}>
      <h2>{task ? 'Edit task' : 'Add a task'}</h2>
      {error && <p className="error" role="alert">{error}</p>}

      <label>
        Title
        <input
          name="title"
          placeholder="e.g. Complete DSA Assignment"
          value={form.title}
          onChange={onChange}
          maxLength={100}
          required
        />
      </label>

      <label>
        Notes / Description
        <textarea
          name="description"
          placeholder="Add details, steps, or references..."
          value={form.description}
          onChange={onChange}
          rows={3}
          maxLength={500}
        />
      </label>

      <div className="form-grid-2">
        <label>
          Category / Tag
          {!customCategory ? (
            <select
              value={CATEGORIES.includes(form.category) ? form.category : 'CUSTOM'}
              onChange={handleCategorySelect}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="CUSTOM">+ Custom Category</option>
            </select>
          ) : (
            <div className="custom-cat-input">
              <input
                name="category"
                placeholder="Type tag name..."
                value={form.category}
                onChange={onChange}
                required
              />
              <button
                type="button"
                className="btn small"
                onClick={() => {
                  setCustomCategory(false);
                  setForm((prev) => ({ ...prev, category: 'General' }));
                }}
              >
                Reset
              </button>
            </div>
          )}
        </label>

        <label>
          Priority
          <select name="priority" value={form.priority} onChange={onChange}>
            <option value="High">🔴 High Priority</option>
            <option value="Medium">🟡 Medium Priority</option>
            <option value="Low">🟢 Low Priority</option>
          </select>
        </label>
      </div>

      <div className="form-grid-2">
        <label>
          Due Date
          <input
            type="date"
            name="dueDate"
            value={form.dueDate}
            onChange={onChange}
          />
        </label>

        <label>
          Status
          <select name="status" value={form.status} onChange={onChange}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>

      <label className="checkbox-label">
        <input
          type="checkbox"
          name="isImportant"
          checked={form.isImportant}
          onChange={onChange}
        />
        <span>⭐ Mark task as Important</span>
      </label>

      <div className="row mt-3">
        <button className="btn primary" disabled={busy}>
          {busy ? 'Saving…' : task ? 'Save changes' : 'Add task'}
        </button>
        {task && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
