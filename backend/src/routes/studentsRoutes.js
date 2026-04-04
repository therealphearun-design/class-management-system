const express = require('express');

const {
  bulkCreateStudents,
  getAllStudents,
  getStudentById,
  createStudent,
  deleteStudent,
  updateStudent,
} = require('../controllers/studentsController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, getAllStudents);
router.get('/:id', authMiddleware, getStudentById);
router.post('/bulk', authMiddleware, requireRole('admin', 'teacher'), bulkCreateStudents);
router.post('/', authMiddleware, requireRole('admin', 'teacher'), createStudent);
router.put('/:id', authMiddleware, requireRole('admin', 'teacher'), updateStudent);
router.delete('/:id', authMiddleware, requireRole('admin'), deleteStudent);

module.exports = router;
