const mongoose = require('mongoose');
const { isMongoConnected } = require('../config/db');
const { SQLiteTask } = require('../config/sqliteStore');

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    dueDate: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    isImportant: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const MongoTask = mongoose.model('Task', taskSchema);

const TaskProxy = new Proxy(MongoTask, {
  get(target, prop) {
    if (isMongoConnected()) {
      return target[prop];
    }
    if (prop in SQLiteTask) {
      return SQLiteTask[prop];
    }
    return target[prop];
  },
});

module.exports = TaskProxy;
