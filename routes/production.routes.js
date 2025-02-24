const router = require('express').Router();
const productionController = require('../controllers/production.controller');
const catchAsync = require('../utils/catchAsync');
const { authenticateUser, restrictTo } = require('../middlewares/auth');

router.use(catchAsync(authenticateUser));
router.use(catchAsync(restrictTo('PRODUCTION_MANAGER')));

router.post('/', catchAsync(productionController.createProduction));
router.post('/distribute', catchAsync(productionController.distributeToWarehouse));
router.get('/', catchAsync(productionController.getAllProducts));
router.get('/dashboard', catchAsync(productionController.getProductionDashboard));

module.exports = router;