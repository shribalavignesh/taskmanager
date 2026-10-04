require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const { notFound, errorHandler } = require('./middleware/error');
const Post = require('./models/Post');
const User = require('./models/User');

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Blog Platform with Comments API',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

async function startServer() {
  await connectDB();

  // Auto-seed initial sample posts if database has none
  try {
    const existing = await Post.find({});
    if (!existing || existing.length === 0) {
      console.log('[Blog Platform] No posts found in database. Auto-seeding initial posts...');
      let seedUser = await User.findOne({ email: 'demo@blogplatform.com' });
      if (!seedUser) {
        seedUser = await User.create({
          name: 'Sarah Chen (Senior Architect)',
          email: 'demo@blogplatform.com',
          password: 'Password123!',
          bio: 'Full-stack software architect & tech educator writing about modern web systems.',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        });
      }

      const sampleArticles = [
        {
          title: 'Building Production-Ready Full-Stack Apps with React & Node.js',
          category: 'Web Development',
          tags: ['React', 'NodeJS', 'FullStack', 'JavaScript'],
          coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
          summary: 'A comprehensive deep dive into scalable frontend components, RESTful API conventions, and database modeling for modern applications.',
          content: `Modern full-stack web development has become an interconnected ecosystem of responsive frontend interfaces and resilient, scalable backends.

### 1. Declarative UI Design
Using component hierarchies in React allows teams to break intricate layouts down into discrete, testable units. Each component manages its own presentation, state, and accessibility properties.

When designing blog posts:
- Structure content with clear typography and semantic HTML tags.
- Provide responsive image banners and optimized aspect ratios.
- Offer instantaneous reader reactions like likes and bookmarking.

### 2. Crafting Intuitive RESTful Endpoints
A clean REST API is predictable:
- Use plural nouns for resources (\`/api/posts\`, \`/api/comments\`).
- Return standard HTTP status codes (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found).
- Protect mutating operations with token authentication.

### 3. Fostering Community with Interactive Comments
Comments bridge the gap between author and reader. Providing a frictionless comment box encourages readers to share feedback, ask questions, and spark technical discussions.`,
        },
        {
          title: 'Understanding Database Architecture: From Relational to Document Stores',
          category: 'Technology',
          tags: ['Database', 'SQL', 'MongoDB', 'Backend'],
          coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
          summary: 'How to choose between relational and document databases, structure schemas, and ensure high reliability.',
          content: `Choosing the right persistence layer is one of the most critical decisions in system design.

### Document vs. Relational
- **Document Databases (e.g. MongoDB)** store data in flexible, JSON-like documents. They excel when data models are nested or hierarchical, like blog posts with embedded comments and author tags.
- **Relational Databases (e.g. PostgreSQL, SQLite)** use tables with strict schemas and foreign keys. They guarantee ACID compliance and ensure zero orphaned records through relational constraints.

### The Hybrid Approach
Many modern architectures employ both: using document stores for rapid content management and relational stores for transaction-critical accounting. Having an engine that supports both creates maximum flexibility!`,
        },
        {
          title: 'The Art of Clean Code: Writing Readable, Maintainable Software',
          category: 'Programming',
          tags: ['CleanCode', 'Programming', 'BestPractices'],
          coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
          summary: 'Key principles, naming conventions, and refactoring strategies to keep codebases enjoyable to work on.',
          content: `Any fool can write code that a computer can understand. Good programmers write code that humans can understand.

### Essential Rules:
1. **Meaningful Names**: Variables and functions should reveal their intent immediately without needing guesswork.
2. **Single Responsibility**: Each function or module should perform one job and perform it exceptionally well.
3. **Graceful Error Handling**: Never allow unexpected errors to crash the runtime silently. Always handle edge cases and log actionable diagnostics.`,
        },
      ];

      for (const a of sampleArticles) {
        const createdPost = await Post.create({
          title: a.title,
          category: a.category,
          tags: a.tags,
          coverImage: a.coverImage,
          summary: a.summary,
          content: a.content,
          author: seedUser,
        });

        // Add sample comments
        if (createdPost) {
          const { SQLitePost } = require('./config/sqliteStore');
          const { isMongoConnected } = require('./config/db');
          if (isMongoConnected()) {
            createdPost.comments.push({
              user: seedUser._id,
              authorName: 'Alex Rivera (DevOps)',
              content: 'Fantastic read! This clarified so many core principles for our engineering team.',
            });
            await createdPost.save();
          } else {
            await SQLitePost.addComment(createdPost._id, {
              userId: seedUser._id,
              authorName: 'Alex Rivera (DevOps)',
              content: 'Fantastic read! This clarified so many core principles for our engineering team.',
            });
          }
        }
      }
      console.log('[Blog Platform] Sample articles seeded successfully.');
    }
  } catch (err) {
    console.log('[Blog Platform] Seed notice:', err.message);
  }

  server.listen(PORT, () => {
    console.log(`🚀 Blog Platform Server listening on port ${PORT}`);
    console.log(`📡 API Health Check: http://localhost:${PORT}/api/health`);
  });
}

startServer();
