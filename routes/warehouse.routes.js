const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');
const catchAsync = require('../utils/catchAsync');
const { authenticateUser, restrictTo } = require('../middlewares/auth');

router.use(catchAsync(authenticateUser));
router.use(catchAsync(restrictTo('WAREHOUSE_MANAGER')));

router.get('/dashboard', catchAsync(warehouseController.getWarehouseDashboard));
router.patch('/distributions/:distributionId', catchAsync(warehouseController.confirmDistribution));
router.get('/distributions/:distributionId', catchAsync(warehouseController.getDistribution));
router.post('/dashboard/create', catchAsync(warehouseController.createWarehouse));

module.exports = router;