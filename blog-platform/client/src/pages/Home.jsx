import React, { useState, useEffect } from 'react';
import CategoryPills from '../components/CategoryPills';
import PostCard from '../components/PostCard';
import DeleteModal from '../components/DeleteModal';
import { postsAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Home({ onOpenCreateModal, onOpenEditModal, searchTerm }) {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (category && category !== 'All') params.category = category;
      if (searchTerm && searchTerm.trim()) params.search = searchTerm.trim();
      if (sort) params.sort = sort;

      const { data } = await postsAPI.getPosts(params);
      setPosts(data.posts || []);
    } catch (err) {
      setError(err.message || 'Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [category, searchTerm, sort]);

  const handleLike = async (postId) => {
    if (!isAuthenticated) {
      alert('Please sign in to like stories!');
      return;
    }
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

  const handleSeedPosts = async () => {
    try {
      setSeeding(true);
      await postsAPI.seedPosts();
      await fetchPosts();
    } catch (err) {
      alert(err.message || 'Failed to seed posts');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <main className="container">
      {/* Hero Banner */}
      <section className="hero-section">
        <span className="hero-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          Full-Stack Blog Platform
        </span>
        <h1 className="hero-title">Stay Curious. Discover stories, thinking, and expertise.</h1>
        <p className="hero-desc">
          A modern publishing space where developers, engineers, and creators write insightful articles and engage in meaningful technical discussions.
        </p>
        <div className="hero-actions">
          {isAuthenticated ? (
            <button type="button" className="btn btn-primary" onClick={onOpenCreateModal}>
              Write a Story
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={onOpenCreateModal}>
              Start Writing
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSeedPosts}
            disabled={seeding}
          >
            {seeding ? 'Seeding Stories...' : '✨ Load Sample Tech Stories'}
          </button>
        </div>
      </section>

      {/* Category Pills & Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <CategoryPills selectedCategory={category} onSelectCategory={setCategory} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sort by:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Latest Stories</option>
            <option value="popular">Most Liked</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && <div className="alert alert-danger" style={{ margin: '20px 0' }}>{error}</div>}

      {/* Posts Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
          <p>Loading stories...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
          </svg>
          <h3>No stories found</h3>
          <p>
            {searchTerm || category !== 'All'
              ? 'Try adjusting your search terms or selecting a different category.'
              : 'Be the first writer to publish an article on this platform!'}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={onOpenCreateModal}>
              Write First Story
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleSeedPosts} disabled={seeding}>
              {seeding ? 'Seeding...' : 'Load Sample Stories'}
            </button>
          </div>
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
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All associated comments and likes will be permanently removed.`}
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
