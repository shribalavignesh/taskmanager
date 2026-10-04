const mongoose = require('mongoose');
const { isMongoConnected } = require('../config/db');
const { SQLitePost } = require('../config/sqliteStore');

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    summary: {
      type: String,
      default: '',
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    coverImage: {
      type: String,
      default: '',
    },
    readTime: {
      type: Number,
      default: 3,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [commentSchema],
  },
  { timestamps: true }
);

const MongoPost = mongoose.model('Post', postSchema);

const PostProxy = new Proxy(MongoPost, {
  get(target, prop) {
    if (isMongoConnected()) {
      return target[prop];
    }
    if (prop in SQLitePost) {
      return SQLitePost[prop];
    }
    return target[prop];
  },
});

module.exports = PostProxy;
