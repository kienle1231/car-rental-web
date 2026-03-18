const express = require('express');
const { register, login, googleLogin, getUsers, deleteUser, toggleUserStatus } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', require('../controllers/authController').forgotPassword);
router.post('/reset-password', require('../controllers/authController').resetPassword);

router.get('/users', protect, adminOnly, getUsers);
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.put('/users/:id/status', protect, adminOnly, toggleUserStatus);

module.exports = router;
