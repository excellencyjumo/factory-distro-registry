const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { verifyToken } = require('../utils/jwtHelperFn');

exports.authenticateUser = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in.', 401));
  }

  const decoded = verifyToken(token);

  const currentUser = await prisma.user.findUnique({ where: { email: decoded.email } });
  if (!currentUser) {
    return next(new AppError('User belonging to this token no longer exists', 401));
  }

  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};