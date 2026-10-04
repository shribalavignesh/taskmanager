const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'blog.db');
const db = new DatabaseSync(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    authorId TEXT NOT NULL,
    authorName TEXT NOT NULL,
    authorEmail TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT DEFAULT '',
    content TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    tags TEXT DEFAULT '[]',
    coverImage TEXT DEFAULT '',
    readTime INTEGER DEFAULT 3,
    likes TEXT DEFAULT '[]',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    postId TEXT NOT NULL,
    userId TEXT NOT NULL,
    authorName TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
`);

function createValidationError(field, msg) {
  const err = new Error(msg);
  err.name = 'ValidationError';
  err.errors = { [field]: { message: msg } };
  return err;
}

function calculateReadTime(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

class SQLiteUser {
  static async create({ name, email, password, bio = '', avatar = '' }) {
    if (!name || !name.trim()) throw createValidationError('name', 'Name is required');
    if (!email || !email.trim()) throw createValidationError('email', 'Email is required');
    if (!password) throw createValidationError('password', 'Password is required');
    if (password.length < 6) throw createValidationError('password', 'Password must be at least 6 characters');

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      const err = new Error('An account with this email already exists');
      err.code = 11000;
      err.keyValue = { email: cleanEmail };
      throw err;
    }

    const hash = await bcrypt.hash(password, 10);
    const id = crypto.randomBytes(12).toString('hex');
    const now = new Date().toISOString();
    const cleanAvatar = avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`;

    db.prepare(`
      INSERT INTO users (id, name, email, password, bio, avatar, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), cleanEmail, hash, bio.trim(), cleanAvatar, now, now);

    return { _id: id, name: name.trim(), email: cleanEmail, bio: bio.trim(), avatar: cleanAvatar };
  }

  static findOne(query) {
    const email = query.email ? String(query.email).trim().toLowerCase() : '';
    const execute = () => {
      const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!row) return null;
      return {
        _id: row.id,
        name: row.name,
        email: row.email,
        bio: row.bio || '',
        avatar: row.avatar || '',
        password: row.password,
        matchPassword(plain) {
          return bcrypt.compare(plain, this.password);
        },
      };
    };

    return {
      select() {
        return {
          then(resolve, reject) {
            try { resolve(execute()); } catch (err) { reject(err); }
          },
        };
      },
      then(resolve, reject) {
        try { resolve(execute()); } catch (err) { reject(err); }
      },
    };
  }

  static async findById(id) {
    if (!id) return null;
    const row = db.prepare('SELECT id, name, email, bio, avatar, createdAt FROM users WHERE id = ?').get(String(id));
    if (!row) return null;
    return {
      _id: row.id,
      name: row.name,
      email: row.email,
      bio: row.bio || '',
      avatar: row.avatar || '',
      createdAt: row.createdAt,
    };
  }
}

class SQLitePost {
  static createPostInstance(row) {
    if (!row) return null;
    let parsedTags = [];
    try {
      parsedTags = JSON.parse(row.tags || '[]');
    } catch {
      parsedTags = (row.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
    }

    let parsedLikes = [];
    try {
      parsedLikes = JSON.parse(row.likes || '[]');
    } catch {
      parsedLikes = [];
    }

    // Fetch comments for this post
    const commentRows = db.prepare('SELECT * FROM comments WHERE postId = ? ORDER BY createdAt ASC').all(row.id);
    const comments = commentRows.map((c) => ({
      _id: c.id,
      user: { _id: c.userId, name: c.authorName },
      content: c.content,
      createdAt: c.createdAt,
    }));

    const post = {
      _id: row.id,
      author: {
        _id: row.authorId,
        name: row.authorName,
        email: row.authorEmail,
      },
      title: row.title,
      summary: row.summary || '',
      content: row.content,
      category: row.category || 'General',
      tags: parsedTags,
      coverImage: row.coverImage || '',
      readTime: row.readTime || calculateReadTime(row.content),
      likes: parsedLikes,
      comments: comments,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      async save() {
        if (!this.title || !this.title.trim()) throw createValidationError('title', 'Title is required');
        if (!this.content || !this.content.trim()) throw createValidationError('content', 'Content is required');
        this.updatedAt = new Date().toISOString();
        this.readTime = calculateReadTime(this.content);

        db.prepare(`
          UPDATE posts
          SET title = ?, summary = ?, content = ?, category = ?, tags = ?, coverImage = ?, readTime = ?, likes = ?, updatedAt = ?
          WHERE id = ?
        `).run(
          this.title.trim(),
          (this.summary || '').trim(),
          this.content.trim(),
          (this.category || 'General').trim(),
          JSON.stringify(this.tags || []),
          (this.coverImage || '').trim(),
          this.readTime,
          JSON.stringify(this.likes || []),
          this.updatedAt,
          this._id
        );
        return this;
      },
      async deleteOne() {
        db.prepare('DELETE FROM comments WHERE postId = ?').run(this._id);
        db.prepare('DELETE FROM posts WHERE id = ?').run(this._id);
        return { acknowledged: true };
      },
    };
    return post;
  }

  static async create({ title, summary = '', content, category = 'General', tags = [], coverImage = '', author }) {
    if (!title || !title.trim()) throw createValidationError('title', 'Title is required');
    if (!content || !content.trim()) throw createValidationError('content', 'Content is required');

    const id = crypto.randomBytes(12).toString('hex');
    const now = new Date().toISOString();
    const authorId = String(author._id || author.id || author);
    const authorName = author.name || 'Anonymous';
    const authorEmail = author.email || '';
    const readTime = calculateReadTime(content);
    const cleanTags = Array.isArray(tags) ? tags : String(tags).split(',').map((s) => s.trim()).filter(Boolean);

    db.prepare(`
      INSERT INTO posts (id, authorId, authorName, authorEmail, title, summary, content, category, tags, coverImage, readTime, likes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      authorId,
      authorName,
      authorEmail,
      title.trim(),
      summary.trim() || content.trim().slice(0, 160) + '...',
      content.trim(),
      category.trim() || 'General',
      JSON.stringify(cleanTags),
      coverImage.trim(),
      readTime,
      JSON.stringify([]),
      now,
      now
    );

    return SQLitePost.findById(id);
  }

  static async findById(id) {
    if (!id) return null;
    const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(String(id));
    if (!row) return null;
    return SQLitePost.createPostInstance(row);
  }

  static find(query = {}) {
    const execute = (sortOptions = { createdAt: -1 }) => {
      let sql = 'SELECT * FROM posts WHERE 1=1';
      const params = [];

      if (query.author) {
        const aId = String(query.author._id || query.author);
        sql += ' AND authorId = ?';
        params.push(aId);
      }

      if (query.category && query.category !== 'All') {
        sql += ' AND LOWER(category) = LOWER(?)';
        params.push(query.category);
      }

      if (query.tag) {
        sql += ' AND LOWER(tags) LIKE ?';
        params.push(`%"${query.tag.toLowerCase()}"%`);
      }

      if (query.search) {
        sql += ' AND (LOWER(title) LIKE ? OR LOWER(content) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(tags) LIKE ?)';
        const term = `%${query.search.toLowerCase()}%`;
        params.push(term, term, term, term);
      }

      // Sort
      if (sortOptions.likes) {
        sql += ' ORDER BY json_array_length(likes) DESC, createdAt DESC';
      } else if (sortOptions.createdAt === 1) {
        sql += ' ORDER BY createdAt ASC';
      } else {
        sql += ' ORDER BY createdAt DESC';
      }

      const rows = db.prepare(sql).all(...params);
      return rows.map((r) => SQLitePost.createPostInstance(r));
    };

    return {
      sort(sortOptions) {
        return {
          populate() {
            return {
              then(resolve, reject) {
                try { resolve(execute(sortOptions)); } catch (err) { reject(err); }
              },
            };
          },
          then(resolve, reject) {
            try { resolve(execute(sortOptions)); } catch (err) { reject(err); }
          },
        };
      },
      populate() {
        return {
          sort(sortOptions) {
            return {
              then(resolve, reject) {
                try { resolve(execute(sortOptions)); } catch (err) { reject(err); }
              },
            };
          },
          then(resolve, reject) {
            try { resolve(execute()); } catch (err) { reject(err); }
          },
        };
      },
      then(resolve, reject) {
        try { resolve(execute()); } catch (err) { reject(err); }
      },
    };
  }

  static async addComment(postId, { userId, authorName, content }) {
    if (!content || !content.trim()) throw createValidationError('content', 'Comment text is required');
    const commentId = crypto.randomBytes(12).toString('hex');
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO comments (id, postId, userId, authorName, content, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(commentId, String(postId), String(userId), authorName, content.trim(), now);

    return {
      _id: commentId,
      user: { _id: userId, name: authorName },
      content: content.trim(),
      createdAt: now,
    };
  }

  static async deleteComment(postId, commentId) {
    db.prepare('DELETE FROM comments WHERE id = ? AND postId = ?').run(String(commentId), String(postId));
    return true;
  }

  static async getCategories() {
    const rows = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM posts
      GROUP BY category
      ORDER BY count DESC
    `).all();
    return rows;
  }
}

module.exports = { SQLiteUser, SQLitePost, db };
