const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Task = require('../models/Task');
const { SAMPLE_TASKS } = require('./taskController');
const asyncHandler = require('../utils/asyncHandler');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendAuth = (res, user, status = 200) =>
  res.status(status).json({
    token: signToken(user._id),
    user: { id: user._id, name: user.name, email: user.email },
  });

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.create({ name, email, password });

  // Auto-seed sample and DSA tasks for new user
  try {
    for (const item of SAMPLE_TASKS) {
      await Task.create({
        user: user._id,
        ...item,
      });
    }
  } catch (err) {
    console.error('Initial task seeding notice:', err.message);
  }

  sendAuth(res, user, 201);
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Incorrect email or password');
  }
  sendAuth(res, user);
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const { _id, name, email } = req.user;
  res.json({ user: { id: _id, name, email } });
});
