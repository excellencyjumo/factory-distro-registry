const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticateUser, restrictTo } = require('../middlewares/auth');
const catchAsync = require('../utils/catchAsync');

router.use(catchAsync(authenticateUser));
router.use(catchAsync(restrictTo('SALES_REP')));

router.post(
  '/',
  catchAsync(orderController.createOrder)
);

router.patch(
  '/:id/status',
  catchAsync(orderController.updateOrderStatus)
);

router.get(
  '/',
  catchAsync(orderController.getOrders)
);

module.exports = router;