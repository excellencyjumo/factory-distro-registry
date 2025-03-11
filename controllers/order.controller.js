const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const responseHandler = require('../utils/responseHandler');


exports.createOrder = catchAsync(async (req, res, next) => {
  const { customerName, customerAddress, product, amount, warehouseName } = req.body;

  const warehouse = await prisma.warehouse.findUnique({
    where: { 
      name: warehouseName 
    },
    select: {
      id: true,
      distributions: {
        where: { 
          product,
          status: 'SUCCESSFUL'
        },
        select: { amount: true }
      },
      orders: {
        where: { 
          product,
          status: 'SUCCESSFUL'
        },
        select: { amount: true }
      }
    }
  });

  if (!warehouse) {
    return next(new AppError('Warehouse not found', 404));
  }

  const totalReceived = warehouse.distributions.reduce((sum, d) => sum + d.amount, 0);
  const totalFulfilled = warehouse.orders.reduce((sum, o) => sum + o.amount, 0);
  const availableStock = totalReceived - totalFulfilled;

  if (availableStock < amount) {
    return next(new AppError(`Insufficient ${product} stock in warehouse`, 400));
  }

  const order = await prisma.order.create({
    data: {
      customerName,
      customerAddress,
      product,
      amount,
      warehouseId: warehouse.id,
      status: 'PENDING'
    },
    include: { warehouse: true }
  });

  responseHandler.success(res, 201, order);
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { warehouse: true }
  });

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  const validTransitions = {
    PENDING: ['SUCCESSFUL', 'FAILED'],
    SUCCESSFUL: [],
    FAILED: []
  };

  if (!validTransitions[order.status].includes(status)) {
    return next(new AppError('Invalid status transition', 400));
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id },
      data: { status }
    });

    return updated;
  });

  responseHandler.success(res, 200, updatedOrder);
});

exports.getOrders = catchAsync(async (req, res, next) => {
  const { status, warehouseId, product, startDate, endDate, page = 1, limit = 10 } = req.query;

  const where = {
    ...(status && { status }),
    ...(warehouseId && { warehouseId }),
    ...(product && { product }),
    ...(startDate && endDate && {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    })
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { warehouse: true }
    }),
    prisma.order.count({ where })
  ]);

  responseHandler.success(res, 200, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
    orders
  });
});
