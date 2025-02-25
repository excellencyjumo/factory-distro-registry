const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticateUser, restrictTo } = require('../middlewares/auth');
const { validateOrderCreation, validateOrderUpdate } = require('../middlewares/validation');
const catchAsync = require('../utils/catchAsync');

router.use(catchAsync(authenticateUser));
router.use(catchAsync(restrictTo('SALES_REP')));

router.post(
  '/',
  validateOrderCreation,
  catchAsync(orderController.createOrder)
);

router.patch(
  '/:id/status',
  validateOrderUpdate,
  catchAsync(orderController.updateOrderStatus)
);

router.get(
  '/',
  catchAsync(orderController.getOrders)
);

module.exports = router;