const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isMongoConnected } = require('../config/db');
const { SQLiteUser } = require('../config/sqliteStore');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    bio: { type: String, default: '', trim: true },
    avatar: { type: String, default: '' },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

const MongoUser = mongoose.model('User', userSchema);

const UserProxy = new Proxy(MongoUser, {
  get(target, prop) {
    if (isMongoConnected()) {
      return target[prop];
    }
    if (prop in SQLiteUser) {
      return SQLiteUser[prop];
    }
    return target[prop];
  },
});

module.exports = UserProxy;
