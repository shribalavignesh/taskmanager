const express = require('express');
const router = express.Router();
const {
  getPosts,
  getCategories,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
  seedPosts,
} = require('../controllers/postController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getPosts);
router.get('/categories', getCategories);
router.post('/seed', optionalAuth, seedPosts);
router.get('/:id', optionalAuth, getPostById);

router.post('/', protect, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);

router.post('/:id/like', protect, toggleLike);
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);

module.exports = router;
