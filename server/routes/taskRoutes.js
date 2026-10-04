const router = require('express').Router();
const {
  getTasks,
  getStats,
  createTask,
  updateTask,
  deleteTask,
  seedTasks,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect); // every task route requires login

router.route('/').get(getTasks).post(createTask);
router.get('/stats', getStats); // keep above '/:id'
router.post('/seed', seedTasks); // seed sample & DSA tasks
router.route('/:id').put(updateTask).delete(deleteTask);

module.exports = router;
