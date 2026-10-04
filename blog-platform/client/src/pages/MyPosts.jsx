import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard';
import DeleteModal from '../components/DeleteModal';
import { postsAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function MyPosts({ onOpenCreateModal, onOpenEditModal }) {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMyPosts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const { data } = await postsAPI.getPosts({ author: user.id });
      setPosts(data.posts || []);
    } catch (err) {
      setError(err.message || 'Failed to load your stories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPosts();
  }, [user]);

  const handleLike = async (postId) => {
    try {
      const { data } = await postsAPI.toggleLike(postId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId || p._id === postId) {
            return {
              ...p,
              isLiked: data.isLiked,
              likesCount: data.likesCount,
            };
          }
          return p;
        })
      );
    } catch (err) {
      alert(err.message || 'Failed to update like');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await postsAPI.deletePost(deleteTarget.id || deleteTarget._id);
      setPosts((prev) => prev.filter((p) => (p.id || p._id) !== (deleteTarget.id || deleteTarget._id)));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message || 'Failed to delete story');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container empty-state" style={{ margin: '64px auto' }}>
        <h3>Sign In Required</h3>
        <p>Please sign in to view and manage your published stories.</p>
        <Link to="/login" className="btn btn-primary btn-sm">
          Sign In
        </Link>
      </div>
    );
  }

  const totalLikes = posts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
  const totalComments = posts.reduce((acc, p) => acc + (p.commentsCount || 0), 0);

  return (
    <div className="container" style={{ padding: '36px 20px 64px' }}>
      {/* Profile Header Card */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
          marginBottom: '36px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
            alt={user.name}
            style={{ width: '72px', height: '72px', borderRadius: 'var(--radius-full)', border: '2px solid var(--primary)' }}
          />
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{user.name}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user.email}</p>
            {user.bio && <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px' }}>{user.bio}</p>}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{posts.length}</span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stories</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>{totalLikes}</span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Likes</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>{totalComments}</span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Responses</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Your Published Stories</h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={onOpenCreateModal}>
          + New Story
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          <p>Loading your stories...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          <h3>You haven't written any stories yet</h3>
          <p>Share your technical insights, tutorials, or engineering experiences with the community.</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={onOpenCreateModal}>
            Write Your First Story
          </button>
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => (
            <PostCard
              key={post.id || post._id}
              post={post}
              onLike={handleLike}
              onEdit={onOpenEditModal}
              onDelete={(p) => setDeleteTarget(p)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deleteTarget}
        title="Delete Story"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
