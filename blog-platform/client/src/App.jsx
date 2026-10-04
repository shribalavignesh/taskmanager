import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import PostModal from './components/PostModal';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import MyPosts from './pages/MyPosts';
import Login from './pages/Login';
import Register from './pages/Register';
import { postsAPI } from './api';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const handleOpenCreateModal = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setEditingPost(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (post) => {
    setEditingPost(post);
    setIsModalOpen(true);
  };

  const handleSavePost = async (postData) => {
    if (editingPost) {
      await postsAPI.updatePost(editingPost.id || editingPost._id, postData);
      // Reload or navigate
      window.location.reload();
    } else {
      const { data } = await postsAPI.createPost(postData);
      navigate(`/post/${data.post.id || data.post._id}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        onOpenCreateModal={handleOpenCreateModal}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <div style={{ flex: 1 }}>
        <Routes>
          <Route
            path="/"
            element={
              <Home
                onOpenCreateModal={handleOpenCreateModal}
                onOpenEditModal={handleOpenEditModal}
                searchTerm={searchTerm}
              />
            }
          />
          <Route
            path="/post/:id"
            element={<PostDetail onOpenEditModal={handleOpenEditModal} />}
          />
          <Route
            path="/my-posts"
            element={
              <MyPosts
                onOpenCreateModal={handleOpenCreateModal}
                onOpenEditModal={handleOpenEditModal}
              />
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>

      {/* Global Post Creation/Edit Modal */}
      <PostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePost}
        editingPost={editingPost}
      />

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          padding: '28px 0',
          marginTop: 'auto',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
        }}
      >
        <div className="container">
          <p>© 2026 InkSpire — Full-Stack Blog Platform with Comments & Community</p>
          <p style={{ marginTop: '4px' }}>
            Built with React, Vite, Node.js, Express, and Database Integration (MongoDB & SQLite fallback)
          </p>
        </div>
      </footer>
    </div>
  );
}
