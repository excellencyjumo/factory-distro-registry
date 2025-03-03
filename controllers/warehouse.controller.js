const { PrismaClient, DistributionStatus, ProductType, OrderStatus } = require('@prisma/client');
const prisma = new PrismaClient();
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const responseHandler = require('../utils/responseHandler');

exports.confirmDistribution = catchAsync(async (req, res, next) => {
  const { distributionId } = req.params;
  const { status } = req.body;

  if (!Object.values(DistributionStatus).includes(status)) {
    return next(new AppError('Invalid distribution status', 400));
  }
  const distribution = await prisma.warehouseDistribution.findUnique({
    where: {
      id: distributionId
    }
  });

  if (!distribution) {
    return next(new AppError('Distribution record not found', 404));
  }

  const updatedDistribution = await prisma.warehouseDistribution.update({
    where: { id: distributionId },
    data: { status }
  });

  responseHandler.success(res, 200, updatedDistribution);
});

exports.getDistribution = catchAsync(async (req, res, next) => {
    const { distributionId } = req.params;
    const warehouseId = req.user.warehouseId;
  
    const distribution = await prisma.warehouseDistribution.findFirst({
      where: {
        id: distributionId,
        warehouseId: warehouseId
      },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      }
    });
  
    if (!distribution) {
      return next(new AppError('Distribution not found for this warehouse', 404));
    }
  
    responseHandler.success(res, 200, {
      id: distribution.id,
      product: distribution.product,
      amount: distribution.amount,
      status: distribution.status,
      distributedAt: distribution.distributedAt,
      warehouse_name: distribution.warehouse.name,
      warehouse_location: distribution.warehouse.location,
      createdAt: distribution.createdAt
    });
  });

exports.getWarehouseDashboard = catchAsync(async (req, res, next) => {
    const warehouseId = req.user.warehouseId;
    const { 
      status, 
      product, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10 
    } = req.query;
  
    const where = {
      warehouseId: warehouseId,
      AND: []
    };
  
    if (status && Object.values(DistributionStatus).includes(status)) {
      where.AND.push({ status });
    }
  
    if (product && Object.values(ProductType).includes(product)) {
      where.AND.push({ product });
    }
  
    if (startDate && endDate) {
      where.AND.push({
        distributedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      });
    }
  
    const [distributions, totalCount] = await Promise.all([
      prisma.warehouseDistribution.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { distributedAt: 'desc' },
        include: {
          warehouse: {
            select: {
              name: true,
              location: true
            }
          }
        }
      }),
      prisma.warehouseDistribution.count({ where })
    ]);
  
    const formattedDistributions = distributions.map(dist => ({
      id: dist.id,
      product: dist.product,
      amount: dist.amount,
      status: dist.status,
      distributedAt: dist.distributedAt,
      warehouse_name: dist.warehouse.name,
      warehouse_location: dist.warehouse.location,
      createdAt: dist.createdAt
    }));
  
    responseHandler.success(res, 200, {
      total: totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalCount / limit),
      distributions: formattedDistributions
    });
  });

  exports.createWarehouse = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { name, location, capacity } = req.body;
  
    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        location,
        capacity: parseInt(capacity),
        users: {
          connect: { id: userId }
        }
      },
      include: {
        users: true
      }
    });
  
    await prisma.user.update({
      where: { id: userId },
      data: {
        warehouseId: warehouse.id
      }
    });
  
    responseHandler.success(res, 201, warehouse);
  });