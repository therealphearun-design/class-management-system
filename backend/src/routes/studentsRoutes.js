const express = require('express');

const {
  getAllStudents,
  getStudentById,
  createStudent,
} = require('../controllers/studentsController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, getAllStudents);
router.get('/:id', authMiddleware, getStudentById);
router.post('/', authMiddleware, requireRole('admin', 'teacher'), createStudent);

module.exports = router;
