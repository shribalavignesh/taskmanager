import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function formatDate(isoStr) {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function PostCard({ post, onLike, onEdit, onDelete }) {
  const { user } = useAuth();
  const isAuthor = user && (String(user.id) === String(post.author?.id) || String(user.id) === String(post.author?._id));

  const fallbackImage = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80';

  return (
    <article className="post-card">
      <Link to={`/post/${post.id || post._id}`} className="post-card-img-wrapper">
        <img
          src={post.coverImage || fallbackImage}
          alt={post.title}
          className="post-card-img"
          loading="lazy"
        />
        <span className="post-card-category-badge">{post.category || 'General'}</span>
      </Link>

      <div className="post-card-body">
        <div className="post-card-meta">
          <span>{formatDate(post.createdAt)}</span>
          <span>•</span>
          <span>{post.readTime || 3} min read</span>
        </div>

        <Link to={`/post/${post.id || post._id}`}>
          <h2 className="post-card-title">{post.title}</h2>
        </Link>

        <p className="post-card-summary">
          {post.summary || post.content?.slice(0, 130) + '...'}
        </p>

        {post.tags && post.tags.length > 0 && (
          <div className="post-card-tags">
            {post.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="post-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="post-card-footer">
          <div className="post-card-author">
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(post.author?.name || 'Author')}`}
              alt={post.author?.name}
              className="author-avatar"
            />
            <span className="author-info-name">{post.author?.name}</span>
          </div>

          <div className="post-card-stats">
            {/* Likes */}
            <button
              type="button"
              className={`post-card-stat-item ${post.isLiked ? 'liked' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                onLike && onLike(post.id || post._id);
              }}
              title={post.isLiked ? 'Unlike' : 'Like'}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill={post.isLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span>{post.likesCount || 0}</span>
            </button>

            {/* Comments */}
            <Link
              to={`/post/${post.id || post._id}#comments`}
              className="post-card-stat-item"
              title="View comments"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              <span>{post.commentsCount || 0}</span>
            </Link>

            {/* Author Controls */}
            {isAuthor && (
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => onEdit && onEdit(post)}
                  title="Edit story"
                  style={{ color: 'var(--text-muted)', padding: '2px 4px' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete && onDelete(post)}
                  title="Delete story"
                  style={{ color: 'var(--danger)', padding: '2px 4px' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
