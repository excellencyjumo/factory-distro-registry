const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const catchAsync = require('../utils/catchAsync');  
const { authenticateUser } = require('../middlewares/auth');

router.post('/register', catchAsync(authController.register));
router.post('/login', catchAsync(authController.login));
router.get('/logout', authenticateUser, catchAsync(authController.logout));

module.exports = router;