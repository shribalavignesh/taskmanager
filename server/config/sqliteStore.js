const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'tasks.db');
const db = new DatabaseSync(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'Pending',
    priority TEXT DEFAULT 'Medium',
    dueDate TEXT DEFAULT NULL,
    category TEXT DEFAULT 'General',
    isImportant INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`);

// Run migrations if columns are missing
const existingCols = db.prepare("PRAGMA table_info(tasks)").all().map((c) => c.name);
if (!existingCols.includes('priority')) {
  db.exec("ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'Medium'");
}
if (!existingCols.includes('dueDate')) {
  db.exec("ALTER TABLE tasks ADD COLUMN dueDate TEXT DEFAULT NULL");
}
if (!existingCols.includes('category')) {
  db.exec("ALTER TABLE tasks ADD COLUMN category TEXT DEFAULT 'General'");
}
if (!existingCols.includes('isImportant')) {
  db.exec("ALTER TABLE tasks ADD COLUMN isImportant INTEGER DEFAULT 0");
}

function createValidationError(field, msg) {
  const err = new Error(msg);
  err.name = 'ValidationError';
  err.errors = { [field]: { message: msg } };
  return err;
}

class SQLiteUser {
  static async create({ name, email, password }) {
    if (!name || !name.trim()) throw createValidationError('name', 'Name is required');
    if (!email || !email.trim()) throw createValidationError('email', 'Email is required');
    if (!password) throw createValidationError('password', 'Password is required');
    if (password.length < 6) throw createValidationError('password', 'Password must be at least 6 characters');

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      const err = new Error('An account with this email already exists');
      err.code = 11000;
      throw err;
    }

    const hash = await bcrypt.hash(password, 10);
    const id = crypto.randomBytes(12).toString('hex');
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, name, email, password, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), cleanEmail, hash, now, now);

    return { _id: id, name: name.trim(), email: cleanEmail };
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
    const row = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(String(id));
    if (!row) return null;
    return { _id: row.id, name: row.name, email: row.email };
  }
}

class SQLiteTask {
  static createTaskInstance(row) {
    const task = {
      _id: row.id,
      user: row.user,
      title: row.title,
      description: row.description || '',
      status: row.status || 'Pending',
      priority: row.priority || 'Medium',
      dueDate: row.dueDate || null,
      category: row.category || 'General',
      isImportant: Boolean(row.isImportant),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      async save() {
        if (!this.title || !this.title.trim()) throw createValidationError('title', 'Title is required');
        this.updatedAt = new Date().toISOString();
        db.prepare(`
          UPDATE tasks
          SET title = ?, description = ?, status = ?, priority = ?, dueDate = ?, category = ?, isImportant = ?, updatedAt = ?
          WHERE id = ?
        `).run(
          this.title.trim(),
          this.description || '',
          this.status || 'Pending',
          this.priority || 'Medium',
          this.dueDate || null,
          this.category || 'General',
          this.isImportant ? 1 : 0,
          this.updatedAt,
          this._id
        );
        return this;
      },
      async deleteOne() {
        db.prepare('DELETE FROM tasks WHERE id = ?').run(this._id);
        return { acknowledged: true };
      },
    };
    return task;
  }

  static async create({ user, title, description, status, priority, dueDate, category, isImportant }) {
    if (!title || !title.trim()) throw createValidationError('title', 'Title is required');
    const id = crypto.randomBytes(12).toString('hex');
    const now = new Date().toISOString();
    const cleanTitle = title.trim();
    const cleanDesc = (description || '').trim();
    const cleanStatus = status || 'Pending';
    const cleanPriority = priority || 'Medium';
    const cleanDueDate = dueDate || null;
    const cleanCategory = (category || 'General').trim();
    const importantFlag = isImportant ? 1 : 0;
    const userId = String(user._id || user);

    db.prepare(`
      INSERT INTO tasks (id, user, title, description, status, priority, dueDate, category, isImportant, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      cleanTitle,
      cleanDesc,
      cleanStatus,
      cleanPriority,
      cleanDueDate,
      cleanCategory,
      importantFlag,
      now,
      now
    );

    return SQLiteTask.createTaskInstance({
      id,
      user: userId,
      title: cleanTitle,
      description: cleanDesc,
      status: cleanStatus,
      priority: cleanPriority,
      dueDate: cleanDueDate,
      category: cleanCategory,
      isImportant: importantFlag,
      createdAt: now,
      updatedAt: now,
    });
  }

  static async findOne(query) {
    const id = String(query._id);
    const userId = String(query.user?._id || query.user);
    const row = db.prepare('SELECT * FROM tasks WHERE id = ? AND user = ?').get(id, userId);
    if (!row) return null;
    return SQLiteTask.createTaskInstance(row);
  }

  static find(query) {
    const userId = String(query.user?._id || query.user);

    const execute = (sortOptions = { createdAt: -1 }) => {
      let sql = 'SELECT * FROM tasks WHERE user = ?';
      const params = [userId];

      if (query.status) {
        sql += ' AND status = ?';
        params.push(query.status);
      }

      if (query.priority) {
        sql += ' AND priority = ?';
        params.push(query.priority);
      }

      if (query.category) {
        sql += ' AND category = ?';
        params.push(query.category);
      }

      if (query.isImportant !== undefined) {
        sql += ' AND isImportant = ?';
        params.push(query.isImportant ? 1 : 0);
      }

      if (query.$or && Array.isArray(query.$or)) {
        const clauses = [];
        for (const item of query.$or) {
          if (item.title?.$regex) {
            clauses.push('LOWER(title) LIKE ?');
            params.push(`%${item.title.$regex.toLowerCase()}%`);
          }
          if (item.description?.$regex) {
            clauses.push('LOWER(description) LIKE ?');
            params.push(`%${item.description.$regex.toLowerCase()}%`);
          }
          if (item.category?.$regex) {
            clauses.push('LOWER(category) LIKE ?');
            params.push(`%${item.category.$regex.toLowerCase()}%`);
          }
        }
        if (clauses.length > 0) {
          sql += ` AND (${clauses.join(' OR ')})`;
        }
      }

      // Sort handling
      if (sortOptions.dueDate) {
        // Nulls last in due date sort
        sql += sortOptions.dueDate === 1
          ? ' ORDER BY (dueDate IS NULL), dueDate ASC, createdAt DESC'
          : ' ORDER BY (dueDate IS NULL), dueDate DESC, createdAt DESC';
      } else if (sortOptions.priority) {
        // High = 3, Medium = 2, Low = 1
        const order = sortOptions.priority === -1 ? 'DESC' : 'ASC';
        sql += ` ORDER BY CASE priority WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 1 ELSE 0 END ${order}, createdAt DESC`;
      } else if (sortOptions.title) {
        sql += sortOptions.title === 1 ? ' ORDER BY title ASC' : ' ORDER BY title DESC';
      } else if (sortOptions.createdAt) {
        sql += sortOptions.createdAt === 1 ? ' ORDER BY createdAt ASC' : ' ORDER BY createdAt DESC';
      } else {
        sql += ' ORDER BY createdAt DESC';
      }

      const rows = db.prepare(sql).all(...params);
      return rows.map((r) => SQLiteTask.createTaskInstance(r));
    };

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
  }

  static async aggregate(pipeline) {
    const match = pipeline.find((p) => p.$match);
    const userId = String(match?.$match?.user?._id || match?.$match?.user || '');
    const rows = db.prepare(`
      SELECT status AS _id, COUNT(*) AS count
      FROM tasks
      WHERE user = ?
      GROUP BY status
    `).all(userId);
    return rows;
  }

  static async getFullStats(userId) {
    const userStr = String(userId);
    const rows = db.prepare('SELECT * FROM tasks WHERE user = ?').all(userStr);

    const stats = {
      Pending: 0,
      'In Progress': 0,
      Completed: 0,
      priority: { Low: 0, Medium: 0, High: 0 },
      categories: {},
      total: rows.length,
      important: 0,
      overdue: 0,
      dueSoon: 0,
    };

    const todayStr = new Date().toISOString().slice(0, 10);
    const twoDaysLater = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

    for (const r of rows) {
      if (stats[r.status] !== undefined) stats[r.status]++;
      if (stats.priority[r.priority] !== undefined) stats.priority[r.priority]++;

      const cat = r.category || 'General';
      stats.categories[cat] = (stats.categories[cat] || 0) + 1;

      if (r.isImportant) stats.important++;

      if (r.status !== 'Completed' && r.dueDate) {
        if (r.dueDate < todayStr) {
          stats.overdue++;
        } else if (r.dueDate <= twoDaysLater) {
          stats.dueSoon++;
        }
      }
    }

    return stats;
  }
}

module.exports = { SQLiteUser, SQLiteTask };
