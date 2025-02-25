const { PrismaClient, ProductType } = require('@prisma/client');
const prisma = new PrismaClient();
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const responseHandler = require('../utils/responseHandler');

exports.createProduction = catchAsync(async (req, res, next) => {
  const { products } = req.body;

  const productionEntries = await Promise.all(
    products.map(product => 
      prisma.production.create({
        data: {
          product: product.product_name,
          amount: parseInt(product.product_amount),
          date: new Date()
        }
      })
    )
  );

  responseHandler.success(res, 201, productionEntries);
});

exports.distributeToWarehouse = catchAsync(async (req, res, next) => {
  const { warehouse_name, distributions } = req.body;
  const distributionResults = [];

  const warehouse = await prisma.warehouse.findUnique({
    where: { name: warehouse_name }
  });
  if (!warehouse) {
    throw new AppError(`Warehouse ${warehouse_name} not found`, 404);
  }

  for (const dist of distributions) {
    const { product_name, amount } = dist;

    const totalProduced = await prisma.production.aggregate({
      _sum: { amount: true },
      where: { product: product_name }
    });

    const totalDistributed = await prisma.warehouseDistribution.aggregate({
      _sum: { amount: true },
      where: { 
        product: product_name,
        status: 'SUCCESSFUL'
      }
    });

    const availableStock = 
      (totalProduced._sum.amount || 0) - (totalDistributed._sum.amount || 0);

    if (availableStock < parseInt(amount)) {
      throw new AppError(
        `Not enough ${product_name} stock available (${availableStock} remaining)`, 
        400
      );
    }

    const distribution = await prisma.warehouseDistribution.create({
      data: {
        warehouseId: warehouse.id,
        product: product_name,
        amount: parseInt(amount),
        status: 'PENDING',
        distributedAt: new Date()
      }
    });

    distributionResults.push(distribution);
  }

  responseHandler.success(res, 201, distributionResults);
});

exports.getAllProducts = catchAsync(async (_req, res, _next) => {
  const productionSummary = await prisma.production.groupBy({
    by: ['product'],
    _sum: { amount: true }
  });

  const distributionSummary = await prisma.warehouseDistribution.groupBy({
    by: ['product'],
    _sum: { amount: true },
    where: {
      status: 'SUCCESSFUL'
    }
  });

  const productsData = Object.values(ProductType).map(product => {
    const produced = productionSummary.find(p => p.product === product)?._sum.amount || 0;
    const distributed = distributionSummary.find(d => d.product === product)?._sum.amount || 0;
    
    return {
      product_name: product,
      total_produced: produced,
      total_distributed: distributed,
      remaining_stock: produced - distributed
    };
  });

  responseHandler.success(res, 200, productsData);
});

exports.getProductionDashboard = catchAsync(async (_req, res, _next) => {
  const warehouseDistribution = await prisma.warehouseDistribution.groupBy({
    by: ['warehouseId', 'product', 'status'],
    _sum: { amount: true },
    _count: { status: true }
  });

  const warehouses = await prisma.warehouse.findMany();

  const dashboardData = warehouses.map(warehouse => {
    const warehouseDistributions = warehouseDistribution
      .filter(d => d.warehouseId === warehouse.id);
    
    const distributions = Object.values(ProductType).map(productName => {
      const productDistributions = warehouseDistributions
        .filter(d => d.product === productName);
      
      return {
        product_name: productName,
        status_summary: {
          PENDING: {
            total_amount: productDistributions
              .find(d => d.status === 'PENDING')?._sum.amount || 0,
            count: productDistributions
              .find(d => d.status === 'PENDING')?._count.status || 0
          },
          SUCCESSFUL: {
            total_amount: productDistributions
              .find(d => d.status === 'SUCCESSFUL')?._sum.amount || 0,
            count: productDistributions
              .find(d => d.status === 'SUCCESSFUL')?._count.status || 0
          }
        }
      };
    });

    return {
      warehouse_id: warehouse.id,
      warehouse_name: warehouse.name,
      distributions
    };
  });

  responseHandler.success(res, 200, dashboardData);
});