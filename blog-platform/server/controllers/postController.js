const Post = require('../models/Post');
const User = require('../models/User');
const { isMongoConnected } = require('../config/db');
const { SQLitePost } = require('../config/sqliteStore');
const asyncHandler = require('../utils/asyncHandler');

const SAMPLE_POSTS = [
  {
    title: 'Getting Started with Modern Full-Stack Web Development in 2026',
    category: 'Web Development',
    tags: ['React', 'NodeJS', 'FullStack', 'WebDev'],
    coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    summary: 'A comprehensive roadmap for mastering modern JavaScript, React 19, scalable RESTful APIs, and full-stack development best practices.',
    content: `Modern web development continues to evolve at a blistering pace. From reactive user interfaces to serverless backends and high-performance databases, understanding the core fundamentals of full-stack engineering is more critical than ever.

### 1. The Frontend Foundation
Modern frontend development centers around component-driven architecture. With React, building declarative UI components with custom hooks, responsive CSS, and state management allows you to construct fluid, accessible user experiences.

Key tips for building modern frontend interfaces:
- Keep component state localized and clean.
- Use CSS Variables for instant dark/light mode themes.
- Leverage optimistic UI updates for interactive actions like likes and comments.

### 2. RESTful Backend Architecture
An intuitive REST API serves as the backbone of every resilient platform:
- Use consistent HTTP status codes (200, 201, 400, 401, 404).
- Secure sensitive routes using JSON Web Tokens (JWT).
- Always validate incoming payloads on the server, not just in the client.

### 3. Database Modeling & Relationships
When designing a blogging system, structuring one-to-many relationships (Users -> Posts -> Comments) is essential for query efficiency and data integrity.

Happy coding and keep building!`,
    comments: [
      {
        authorName: 'Alex Rivera',
        content: 'This roadmap is super clear! Especially the point on optimistic UI updates for comments.',
      },
      {
        authorName: 'Sarah Chen',
        content: 'Loved the breakdown of RESTful architecture best practices. Very helpful for full stack beginners!',
      },
    ],
  },
  {
    title: 'Mastering React 19: Server Components, Actions, and State',
    category: 'Programming',
    tags: ['React', 'JavaScript', 'Frontend', 'SoftwareEngineering'],
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80',
    summary: 'Deep dive into the latest advancements in React, exploring concurrent rendering, async actions, and improved developer experience.',
    content: `React continues to be the dominant library for building interactive user interfaces. With modern releases, we see significant improvements to state handling, asynchronous actions, and rendering ergonomics.

### Why Component Modularity Matters
Decomposing complex views into modular components makes testing, styling, and debugging a breeze. When building blog post readers and comments sections:
- Separate the presentation of a comment card from the form input.
- Handle loading and error boundaries gracefully.
- Provide immediate feedback to users during network requests.

### Practical Tips for Clean React Code
1. Custom hooks encapsulate reusable business logic cleanly.
2. Memoize expensive filter operations across large post feeds.
3. Use accessible HTML semantics like <article>, <header>, and <time>.`,
    comments: [
      {
        authorName: 'David Kim',
        content: 'Great overview! The tips on separating presentation from comment state are spot on.',
      },
    ],
  },
  {
    title: 'Designing Scalable RESTful APIs with Node.js and Express',
    category: 'Technology',
    tags: ['NodeJS', 'Express', 'API', 'Backend'],
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
    summary: 'Practical patterns for building production-grade Express backends with middleware, error handling, and robust security.',
    content: `Behind every great application is a resilient backend. Express.js provides an unopinionated, lightweight framework that can scale effortlessly when architected properly.

### Essential Middleware Pipeline
1. CORS configuration to safely whitelist authorized origins.
2. Body parser for parsing incoming JSON payloads.
3. Centralized error handling middleware to sanitize stack traces in production.
4. Authentication guards that verify tokens and inject the authenticated user profile into req.user.

### Handling Database Connections Gracefully
A production API must handle database connection drops or offline scenarios gracefully. Providing zero-config local storage fallbacks enables seamless local development and automated CI environments!`,
    comments: [
      {
        authorName: 'Priya Sharma',
        content: 'Centralized error handling saved our team countless hours in production debugging. Well written!',
      },
    ],
  },
  {
    title: 'The Art of User Experience: Designing Content-First Platforms',
    category: 'Design',
    tags: ['UX', 'UI', 'Design', 'Typography'],
    coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    summary: 'How typography, whitespace, and reading ergonomics elevate reader engagement on modern publication platforms.',
    content: `When readers visit a blog, the content itself must be the hero. Great publication UX removes clutter, prioritizes readable font hierarchies, and offers intuitive interaction loops.

### Key Principles for Reader-Centric Design
- **Optimal Line Length**: Keep body text between 60 to 75 characters per line for maximum reading comfort.
- **Visual Rhythm**: Use balanced margins and vertical padding between headings, paragraphs, and blockquotes.
- **Frictionless Interaction**: Allow readers to comment and like articles without interrupting their reading flow.`,
    comments: [],
  },
];

// Helper to check ownership
function isOwner(userId, authorField) {
  if (!userId || !authorField) return false;
  const aId = authorField._id ? String(authorField._id) : String(authorField);
  return String(userId) === aId;
}

// GET /api/posts
// Query params: search, category, tag, author, sort
exports.getPosts = asyncHandler(async (req, res) => {
  const { search, category, tag, author, sort } = req.query;

  const filter = {};
  if (category && category !== 'All') {
    filter.category = category;
  }
  if (tag) {
    filter.tag = tag;
  }
  if (author) {
    filter.author = author;
  }
  if (search && search.trim()) {
    filter.search = search.trim();
  }

  let sortOptions = { createdAt: -1 };
  if (sort === 'oldest') {
    sortOptions = { createdAt: 1 };
  } else if (sort === 'popular') {
    sortOptions = { likes: -1 };
  }

  const posts = await Post.find(filter).sort(sortOptions);

  const formatted = posts.map((p) => ({
    id: p._id,
    _id: p._id,
    title: p.title,
    summary: p.summary,
    content: p.content,
    category: p.category,
    tags: p.tags || [],
    coverImage: p.coverImage || '',
    readTime: p.readTime || 3,
    likesCount: Array.isArray(p.likes) ? p.likes.length : 0,
    isLiked: req.user ? (p.likes || []).some((id) => String(id) === String(req.user._id)) : false,
    commentsCount: Array.isArray(p.comments) ? p.comments.length : 0,
    author: {
      id: p.author?._id || p.authorId,
      name: p.author?.name || p.authorName || 'Author',
      email: p.author?.email || p.authorEmail || '',
    },
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  res.json({ posts: formatted, count: formatted.length });
});

// GET /api/posts/categories
exports.getCategories = asyncHandler(async (req, res) => {
  if (isMongoConnected()) {
    const results = await Post.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const categories = results.map((r) => ({ category: r._id, count: r.count }));
    res.json({ categories });
  } else {
    const categories = await SQLitePost.getCategories();
    res.json({ categories });
  }
});

// GET /api/posts/:id
exports.getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Blog post not found');
  }

  const authorId = post.author?._id || post.authorId || post.author;
  const isPostOwner = req.user ? isOwner(req.user._id, authorId) : false;
  const isLiked = req.user ? (post.likes || []).some((id) => String(id) === String(req.user._id)) : false;

  const comments = (post.comments || []).map((c) => ({
    id: c._id || c.id,
    _id: c._id || c.id,
    userId: c.user?._id || c.user || c.userId,
    authorName: c.authorName || c.user?.name || 'Anonymous',
    content: c.content,
    createdAt: c.createdAt,
    isCommentOwner: req.user ? String(req.user._id) === String(c.user?._id || c.user || c.userId) : false,
  }));

  res.json({
    post: {
      id: post._id,
      _id: post._id,
      title: post.title,
      summary: post.summary,
      content: post.content,
      category: post.category,
      tags: post.tags || [],
      coverImage: post.coverImage || '',
      readTime: post.readTime || 3,
      likesCount: Array.isArray(post.likes) ? post.likes.length : 0,
      isLiked,
      isOwner: isPostOwner,
      author: {
        id: authorId,
        name: post.author?.name || post.authorName || 'Author',
        email: post.author?.email || post.authorEmail || '',
      },
      comments,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    },
  });
});

// POST /api/posts
exports.createPost = asyncHandler(async (req, res) => {
  const { title, summary, content, category, tags, coverImage } = req.body;

  if (!title || !title.trim()) {
    res.status(400);
    throw new Error('Title is required');
  }

  if (!content || !content.trim()) {
    res.status(400);
    throw new Error('Content is required');
  }

  let cleanTags = [];
  if (Array.isArray(tags)) {
    cleanTags = tags.map((t) => t.trim()).filter(Boolean);
  } else if (typeof tags === 'string') {
    cleanTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
  }

  const post = await Post.create({
    title: title.trim(),
    summary: (summary || '').trim(),
    content: content.trim(),
    category: (category || 'General').trim(),
    tags: cleanTags,
    coverImage: (coverImage || '').trim(),
    author: req.user,
  });

  res.status(201).json({
    message: 'Post created successfully',
    post: {
      id: post._id,
      _id: post._id,
      title: post.title,
      summary: post.summary,
      content: post.content,
      category: post.category,
      tags: post.tags,
      coverImage: post.coverImage,
      readTime: post.readTime,
      createdAt: post.createdAt,
    },
  });
});

// PUT /api/posts/:id
exports.updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Blog post not found');
  }

  const authorId = post.author?._id || post.authorId || post.author;
  if (!isOwner(req.user._id, authorId)) {
    res.status(403);
    throw new Error('Forbidden: You can only edit your own posts');
  }

  const { title, summary, content, category, tags, coverImage } = req.body;

  if (title !== undefined) post.title = title.trim();
  if (summary !== undefined) post.summary = summary.trim();
  if (content !== undefined) post.content = content.trim();
  if (category !== undefined) post.category = category.trim();
  if (coverImage !== undefined) post.coverImage = coverImage.trim();

  if (tags !== undefined) {
    if (Array.isArray(tags)) {
      post.tags = tags.map((t) => t.trim()).filter(Boolean);
    } else if (typeof tags === 'string') {
      post.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    }
  }

  await post.save();

  res.json({
    message: 'Post updated successfully',
    post: {
      id: post._id,
      _id: post._id,
      title: post.title,
      summary: post.summary,
      content: post.content,
      category: post.category,
      tags: post.tags,
      coverImage: post.coverImage,
      readTime: post.readTime,
      updatedAt: post.updatedAt,
    },
  });
});

// DELETE /api/posts/:id
exports.deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Blog post not found');
  }

  const authorId = post.author?._id || post.authorId || post.author;
  if (!isOwner(req.user._id, authorId)) {
    res.status(403);
    throw new Error('Forbidden: You can only delete your own posts');
  }

  await post.deleteOne();
  res.json({ message: 'Post and associated comments deleted successfully' });
});

// POST /api/posts/:id/like
exports.toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Blog post not found');
  }

  const userIdStr = String(req.user._id);
  const likes = Array.isArray(post.likes) ? [...post.likes] : [];
  const index = likes.findIndex((id) => String(id) === userIdStr);

  let isLiked = false;
  if (index > -1) {
    likes.splice(index, 1);
    isLiked = false;
  } else {
    likes.push(req.user._id);
    isLiked = true;
  }

  post.likes = likes;
  await post.save();

  res.json({
    message: isLiked ? 'Post liked' : 'Post unliked',
    isLiked,
    likesCount: likes.length,
  });
});

// POST /api/posts/:id/comments
exports.addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    res.status(400);
    throw new Error('Comment content is required');
  }

  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Blog post not found');
  }

  let newComment;
  if (isMongoConnected()) {
    post.comments.push({
      user: req.user._id,
      authorName: req.user.name,
      content: content.trim(),
    });
    await post.save();
    const created = post.comments[post.comments.length - 1];
    newComment = {
      id: created._id,
      _id: created._id,
      userId: req.user._id,
      authorName: req.user.name,
      content: created.content,
      createdAt: created.createdAt,
      isCommentOwner: true,
    };
  } else {
    const created = await SQLitePost.addComment(post._id, {
      userId: req.user._id,
      authorName: req.user.name,
      content: content.trim(),
    });
    newComment = {
      id: created._id,
      _id: created._id,
      userId: req.user._id,
      authorName: req.user.name,
      content: created.content,
      createdAt: created.createdAt,
      isCommentOwner: true,
    };
  }

  res.status(201).json({
    message: 'Comment added successfully',
    comment: newComment,
  });
});

// DELETE /api/posts/:id/comments/:commentId
exports.deleteComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Blog post not found');
  }

  const postAuthorId = post.author?._id || post.authorId || post.author;
  const isPostAuthor = isOwner(req.user._id, postAuthorId);

  if (isMongoConnected()) {
    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }
    const isCommentAuthor = String(comment.user) === String(req.user._id);
    if (!isCommentAuthor && !isPostAuthor) {
      res.status(403);
      throw new Error('Forbidden: You can only delete your own comments or comments on your post');
    }
    comment.deleteOne();
    await post.save();
  } else {
    // For SQLite, find comment
    const comment = (post.comments || []).find((c) => String(c._id || c.id) === String(req.params.commentId));
    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }
    const commentUserId = comment.user?._id || comment.userId;
    const isCommentAuthor = String(commentUserId) === String(req.user._id);
    if (!isCommentAuthor && !isPostAuthor) {
      res.status(403);
      throw new Error('Forbidden: You can only delete your own comments or comments on your post');
    }
    await SQLitePost.deleteComment(post._id, req.params.commentId);
  }

  res.json({ message: 'Comment deleted successfully' });
});

// POST /api/posts/seed
// Pre-loads high quality sample posts and comments
exports.seedPosts = asyncHandler(async (req, res) => {
  // Ensure we have a sample author
  let author = req.user;
  if (!author) {
    author = await User.findOne({ email: 'demo@blogplatform.com' });
    if (!author) {
      author = await User.create({
        name: 'Dev Community Team',
        email: 'demo@blogplatform.com',
        password: 'Password123!',
        bio: 'Tech writers & engineering educators sharing modern web development practices.',
      });
    }
  }

  const createdPosts = [];
  for (const item of SAMPLE_POSTS) {
    const post = await Post.create({
      title: item.title,
      category: item.category,
      tags: item.tags,
      coverImage: item.coverImage,
      summary: item.summary,
      content: item.content,
      author: author,
    });

    if (item.comments && item.comments.length > 0) {
      for (const c of item.comments) {
        if (isMongoConnected()) {
          post.comments.push({
            user: author._id,
            authorName: c.authorName,
            content: c.content,
          });
          await post.save();
        } else {
          await SQLitePost.addComment(post._id, {
            userId: author._id,
            authorName: c.authorName,
            content: c.content,
          });
        }
      }
    }
    createdPosts.push(post);
  }

  res.status(201).json({
    message: `Successfully seeded ${createdPosts.length} rich blog posts with comments!`,
    count: createdPosts.length,
  });
});
