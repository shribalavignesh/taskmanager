import React, { useState, useEffect } from 'react';

const CATEGORIES = [
  'Web Development',
  'Programming',
  'Technology',
  'AI & Data',
  'Design',
  'Career',
];

const PRESET_COVERS = [
  { label: 'Laptop & Code', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80' },
  { label: 'React Code', url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Servers & Cloud', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Workspace Clean', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Design & UX', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80' },
  { label: 'AI Brain', url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80' },
];

export default function PostModal({ isOpen, onClose, onSave, editingPost }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || '');
      setCategory(editingPost.category || 'Web Development');
      setTags(Array.isArray(editingPost.tags) ? editingPost.tags.join(', ') : editingPost.tags || '');
      setCoverImage(editingPost.coverImage || '');
      setSummary(editingPost.summary || '');
      setContent(editingPost.content || '');
    } else {
      setTitle('');
      setCategory('Web Development');
      setTags('React, JavaScript, WebDev');
      setCoverImage(PRESET_COVERS[0].url);
      setSummary('');
      setContent('');
    }
    setError('');
  }, [editingPost, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title');
      return;
    }
    if (!content.trim()) {
      setError('Please provide content for your story');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await onSave({
        title: title.trim(),
        category,
        tags: tagList,
        coverImage: coverImage.trim(),
        summary: summary.trim(),
        content: content.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save story');
    } finally {
      setSaving(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readTimeEst = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editingPost ? 'Edit Story' : 'Publish a New Story'}
          </h2>
          <button type="button" className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Story Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Modern Full-Stack Patterns in 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category & Tags */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="React, NodeJS, FullStack"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          {/* Cover Image */}
          <div className="form-group">
            <label className="form-label">Cover Image URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://images.unsplash.com/..."
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
            />

            <div style={{ marginTop: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Or select a preset banner:
              </span>
              <div className="preset-picker">
                {PRESET_COVERS.map((preset, idx) => (
                  <div
                    key={idx}
                    className={`preset-thumb ${coverImage === preset.url ? 'active' : ''}`}
                    onClick={() => setCoverImage(preset.url)}
                    title={preset.label}
                  >
                    <img src={preset.url} alt={preset.label} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="form-group">
            <label className="form-label">Brief Subtitle / Excerpt</label>
            <input
              type="text"
              className="form-input"
              placeholder="Short preview visible in feeds and cards..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          {/* Content */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Story Content *</label>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {wordCount} words • ~{readTimeEst} min read
              </span>
            </div>
            <textarea
              className="form-textarea"
              rows={10}
              placeholder="Write your story here... You can use Markdown headers (#, ##), bullets (-), and code blocks!"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          {/* Modal Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Publishing...' : editingPost ? 'Save Changes' : 'Publish Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
