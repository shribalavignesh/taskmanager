import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import CommentSection from '../components/CommentSection';
import DeleteModal from '../components/DeleteModal';
import { postsAPI } from '../api';
import { useAuth } from '../context/AuthContext';

function formatDate(isoStr) {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// Simple and safe markdown parser for post content
function renderContent(content = '') {
  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`}>
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(<h3 key={`h3-${i}`}>{line.replace('### ', '')}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={`h2-${i}`}>{line.replace('## ', '')}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={`h1-${i}`}>{line.replace('# ', '')}</h1>);
    } else if (line.startsWith('> ')) {
      elements.push(<blockquote key={`quote-${i}`}>{line.replace('> ', '')}</blockquote>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<li key={`li-${i}`}>{line.replace(/^[-*]\s+/, '')}</li>);
    } else if (line.trim().length > 0) {
      elements.push(<p key={`p-${i}`}>{line}</p>);
    }
  }

  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <pre key="code-end">
        <code>{codeBuffer.join('\n')}</code>
      </pre>
    );
  }

  return elements;
}

export default function PostDetail({ onOpenEditModal }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await postsAPI.getPost(id);
      setPost(data.post);
    } catch (err) {
      setError(err.message || 'Story not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to like this story!');
      return;
    }
    try {
      const { data } = await postsAPI.toggleLike(id);
      setPost((prev) => ({
        ...prev,
        isLiked: data.isLiked,
        likesCount: data.likesCount,
      }));
    } catch (err) {
      alert(err.message || 'Failed to update like');
    }
  };

  const handleAddComment = async (content) => {
    const { data } = await postsAPI.addComment(id, { content });
    setPost((prev) => ({
      ...prev,
      comments: [...prev.comments, data.comment],
    }));
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await postsAPI.deleteComment(id, commentId);
      setPost((prev) => ({
        ...prev,
        comments: prev.comments.filter((c) => (c.id || c._id) !== commentId),
      }));
    } catch (err) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  const handleConfirmDeletePost = async () => {
    try {
      setIsDeleting(true);
      await postsAPI.deletePost(id);
      navigate('/');
    } catch (err) {
      alert(err.message || 'Failed to delete story');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container-reading" style={{ textAlign: 'center', padding: '96px 0', color: 'var(--text-muted)' }}>
        <p>Opening story...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container-reading empty-state" style={{ margin: '64px auto' }}>
        <h3>Story Not Found</h3>
        <p>{error || 'The story you are looking for does not exist or may have been removed.'}</p>
        <Link to="/" className="btn btn-primary btn-sm">
          ← Back to Stories
        </Link>
      </div>
    );
  }

  const isAuthor =
    user && (String(user.id) === String(post.author?.id) || String(user.id) === String(post.author?._id));

  return (
    <article className="container-reading reading-page">
      {/* Back navigation */}
      <Link to="/" className="reading-back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to all stories
      </Link>

      {/* Header */}
      <header className="reading-header">
        <span className="reading-category">{post.category || 'General'}</span>
        <h1 className="reading-title">{post.title}</h1>
        {post.summary && <p className="reading-summary">{post.summary}</p>}

        {/* Author bar */}
        <div className="reading-author-bar">
          <div className="author-block">
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(post.author?.name || 'Author')}`}
              alt={post.author?.name}
              className="author-block-avatar"
            />
            <div>
              <p className="author-block-name">{post.author?.name}</p>
              <p className="author-block-meta">
                Published {formatDate(post.createdAt)} • {post.readTime || 3} min read
              </p>
            </div>
          </div>

          {/* Action buttons if Author */}
          {isAuthor && (
            <div className="reading-actions">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => onOpenEditModal(post)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => setShowDeleteModal(true)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Cover Image */}
      {post.coverImage && (
        <img src={post.coverImage} alt={post.title} className="reading-cover" />
      )}

      {/* Article Content */}
      <div className="prose-article">{renderContent(post.content)}</div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
          {post.tags.map((tag, idx) => (
            <span key={idx} className="category-pill" style={{ fontSize: '0.8rem' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Reaction bar */}
      <div className="post-reaction-bar">
        <button
          type="button"
          className={`reaction-btn ${post.isLiked ? 'active' : ''}`}
          onClick={handleLike}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={post.isLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span>{post.likesCount || 0} Likes</span>
        </button>

        <a href="#comments" className="reaction-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <span>{post.comments?.length || 0} Responses</span>
        </a>
      </div>

      {/* Comments Component */}
      <CommentSection
        postId={id}
        comments={post.comments || []}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        isPostOwner={isAuthor}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete Story"
        message="Are you sure you want to permanently delete this story? This cannot be undone."
        loading={isDeleting}
        onConfirm={handleConfirmDeletePost}
        onCancel={() => setShowDeleteModal(false)}
      />
    </article>
  );
}
