import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function timeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSec = Math.floor((now - date) / 1000);

  if (diffInSec < 60) return 'Just now';
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CommentSection({
  postId,
  comments = [],
  onAddComment,
  onDeleteComment,
  isPostOwner,
}) {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      setError('');
      await onAddComment(content.trim());
      setContent('');
    } catch (err) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="comments-section" id="comments">
      <div className="comments-header">
        <h3 className="comments-title">
          <span>Responses</span>
          <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>({comments.length})</span>
        </h3>
      </div>

      {/* Add comment form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="comment-form-card">
          {error && <div className="alert alert-danger" style={{ marginBottom: '12px' }}>{error}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'U')}`}
              alt={user?.name}
              className="author-avatar"
            />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.name}</span>
          </div>

          <textarea
            className="comment-textarea"
            placeholder="What are your thoughts on this story? Leave a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />

          <div className="comment-form-footer">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Markdown supported
            </span>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submitting || !content.trim()}
            >
              {submitting ? 'Publishing...' : 'Respond'}
            </button>
          </div>
        </form>
      ) : (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Join the conversation
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Sign in to share your thoughts and reply to the author.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Link to="/login" className="btn btn-primary btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-secondary btn-sm">
              Create Account
            </Link>
          </div>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '0.95rem' }}>No responses yet. Be the first to share your perspective!</p>
        </div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => {
            const commentUserId = comment.userId || comment.user?._id || comment.user;
            const canDelete =
              user && (String(user.id) === String(commentUserId) || isPostOwner);

            return (
              <div key={comment.id || comment._id} className="comment-card">
                <div className="comment-card-top">
                  <div className="comment-user-info">
                    <div className="comment-avatar">
                      {(comment.authorName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="comment-author-name">{comment.authorName}</p>
                      <p className="comment-time">{timeAgo(comment.createdAt)}</p>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      className="btn-ghost-danger"
                      onClick={() => onDeleteComment(comment.id || comment._id)}
                      title="Delete response"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  )}
                </div>

                <div className="comment-body">{comment.content}</div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
