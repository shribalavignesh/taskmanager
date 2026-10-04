const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const { broadcast } = require('../config/websocket');
const { isMongoConnected } = require('../config/db');
const { SQLiteTask } = require('../config/sqliteStore');

const STATUSES = ['Pending', 'In Progress', 'Completed'];
const PRIORITIES = ['Low', 'Medium', 'High'];

// Default sample tasks requested by user, with special emphasis on DSA
const SAMPLE_TASKS = [
  {
    title: 'Complete DSA Assignment',
    description: 'Implement Binary Search Trees, Graph traversals, and dynamic programming problems.',
    category: 'DSA',
    priority: 'High',
    status: 'In Progress',
    dueDate: '2026-10-06',
    isImportant: true,
  },
  {
    title: 'Prepare Java OOP Presentation',
    description: 'Create slide deck explaining polymorphism, inheritance, and design patterns.',
    category: 'Study',
    priority: 'High',
    status: 'Pending',
    dueDate: '2026-10-07',
    isImportant: true,
  },
  {
    title: 'Practice LeetCode Problems',
    description: 'Solve 3 medium difficulty array and two-pointer problems on LeetCode.',
    category: 'DSA',
    priority: 'Medium',
    status: 'In Progress',
    dueDate: '2026-10-08',
    isImportant: true,
  },
  {
    title: 'Complete Web Development Project',
    description: 'Build full-stack task manager application with WebSockets and dark mode.',
    category: 'Study',
    priority: 'High',
    status: 'Pending',
    dueDate: '2026-10-10',
    isImportant: true,
  },
  {
    title: 'Study Database Management Systems',
    description: 'Review indexing, B-Trees, ACID transactions, and SQL normalization.',
    category: 'Study',
    priority: 'Medium',
    status: 'Pending',
    dueDate: '2026-10-11',
    isImportant: false,
  },
  {
    title: 'Revise Operating Systems',
    description: 'Study process scheduling algorithms, deadlock prevention, and virtual memory paging.',
    category: 'Study',
    priority: 'High',
    status: 'Pending',
    dueDate: '2026-10-12',
    isImportant: false,
  },
  {
    title: 'Buy groceries',
    description: 'Fresh fruits, vegetables, oats, and milk for the week.',
    category: 'Personal',
    priority: 'Low',
    status: 'Pending',
    dueDate: '2026-10-05',
    isImportant: false,
  },
  {
    title: 'Clean laptop',
    description: 'Clean keyboard, monitor screen, and dust cooling vents.',
    category: 'Personal',
    priority: 'Low',
    status: 'Completed',
    dueDate: '2026-10-04',
    isImportant: false,
  },
  {
    title: 'Organize study notes',
    description: 'Compile lecture notes and DSA formulas into quick revision sheets.',
    category: 'Study',
    priority: 'Medium',
    status: 'In Progress',
    dueDate: '2026-10-06',
    isImportant: false,
  },
  {
    title: 'Pay electricity bill',
    description: 'Online utility bill payment due before late fees apply.',
    category: 'Finance',
    priority: 'High',
    status: 'Pending',
    dueDate: '2026-10-05',
    isImportant: true,
  },
  {
    title: 'Plan weekend schedule',
    description: 'Draft schedule for hackathon practice and family time.',
    category: 'Personal',
    priority: 'Low',
    status: 'Completed',
    dueDate: '2026-10-04',
    isImportant: false,
  },
  {
    title: 'Exercise for 30 minutes',
    description: 'Morning cardio workout and core stretching routine.',
    category: 'Health',
    priority: 'Medium',
    status: 'Completed',
    dueDate: '2026-10-04',
    isImportant: false,
  },
  {
    title: 'Read a book',
    description: 'Read 2 chapters of "Designing Data-Intensive Applications".',
    category: 'Personal',
    priority: 'Low',
    status: 'In Progress',
    dueDate: '2026-10-09',
    isImportant: false,
  },
  {
    title: 'Backup important files',
    description: 'Synchronize project repositories and system documents to cloud drive.',
    category: 'Work',
    priority: 'High',
    status: 'Pending',
    dueDate: '2026-10-06',
    isImportant: true,
  },
];

// Finds a task that belongs to the logged-in user, or throws 404
const findOwnTask = async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  return task;
};

// GET /api/tasks
exports.getTasks = asyncHandler(async (req, res) => {
  const { status, priority, category, isImportant, search, sort } = req.query;
  const query = { user: req.user._id };

  if (status && STATUSES.includes(status)) query.status = status;
  if (priority && PRIORITIES.includes(priority)) query.priority = priority;
  if (category && category !== 'All') query.category = category;
  if (isImportant !== undefined) query.isImportant = isImportant === 'true';

  if (search) {
    const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { title: { $regex: safe, $options: 'i' } },
      { description: { $regex: safe, $options: 'i' } },
      { category: { $regex: safe, $options: 'i' } },
    ];
  }

  // Sort options
  let sortOption = { createdAt: -1 };
  if (sort === 'dueDate_asc') sortOption = { dueDate: 1 };
  else if (sort === 'dueDate_desc') sortOption = { dueDate: -1 };
  else if (sort === 'priority_desc') sortOption = { priority: -1 };
  else if (sort === 'priority_asc') sortOption = { priority: 1 };
  else if (sort === 'oldest') sortOption = { createdAt: 1 };
  else if (sort === 'title_asc') sortOption = { title: 1 };

  const tasks = await Task.find(query).sort(sortOption);
  res.json(tasks);
});

// GET /api/tasks/stats
exports.getStats = asyncHandler(async (req, res) => {
  if (!isMongoConnected()) {
    const stats = await SQLiteTask.getFullStats(req.user._id);
    return res.json(stats);
  }

  // MongoDB aggregation
  const allTasks = await Task.find({ user: req.user._id });
  const stats = {
    Pending: 0,
    'In Progress': 0,
    Completed: 0,
    priority: { Low: 0, Medium: 0, High: 0 },
    categories: {},
    total: allTasks.length,
    important: 0,
    overdue: 0,
    dueSoon: 0,
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const twoDaysLater = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

  for (const t of allTasks) {
    if (stats[t.status] !== undefined) stats[t.status]++;
    if (stats.priority[t.priority] !== undefined) stats.priority[t.priority]++;

    const cat = t.category || 'General';
    stats.categories[cat] = (stats.categories[cat] || 0) + 1;

    if (t.isImportant) stats.important++;

    if (t.status !== 'Completed' && t.dueDate) {
      if (t.dueDate < todayStr) {
        stats.overdue++;
      } else if (t.dueDate <= twoDaysLater) {
        stats.dueSoon++;
      }
    }
  }

  res.json(stats);
});

// POST /api/tasks
exports.createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, category, isImportant } = req.body;
  const task = await Task.create({
    user: req.user._id,
    title,
    description,
    status,
    priority,
    dueDate,
    category,
    isImportant,
  });

  broadcast({
    type: 'TASK_CREATED',
    payload: task,
    userId: req.user._id,
  });

  res.status(201).json(task);
});

// PUT /api/tasks/:id
exports.updateTask = asyncHandler(async (req, res) => {
  const task = await findOwnTask(req, res);
  const { title, description, status, priority, dueDate, category, isImportant } = req.body;

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  if (priority !== undefined) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (category !== undefined) task.category = category;
  if (isImportant !== undefined) task.isImportant = isImportant;

  await task.save();

  broadcast({
    type: 'TASK_UPDATED',
    payload: task,
    userId: req.user._id,
  });

  res.json(task);
});

// DELETE /api/tasks/:id
exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await findOwnTask(req, res);
  await task.deleteOne();

  broadcast({
    type: 'TASK_DELETED',
    payload: { id: req.params.id },
    userId: req.user._id,
  });

  res.json({ message: 'Task deleted' });
});

// POST /api/tasks/seed
exports.seedTasks = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const created = [];

  for (const item of SAMPLE_TASKS) {
    const task = await Task.create({
      user: userId,
      ...item,
    });
    created.push(task);
  }

  broadcast({
    type: 'TASKS_SEEDED',
    userId,
  });

  res.status(201).json({
    message: `${created.length} sample tasks successfully added!`,
    tasks: created,
  });
});

module.exports.SAMPLE_TASKS = SAMPLE_TASKS;
