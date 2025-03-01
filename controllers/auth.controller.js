const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const responseHandler = require('../utils/responseHandler');
const { signToken } = require('../utils/jwtHelperFn');

exports.register = catchAsync(async (req, res, next) => {
    const { email, password, role } = req.body;
  
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new AppError('User already exists with this email', 400));
    }
  
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role
      }
    });
  
    const token = signToken(newUser.email);
    // if (!res) {
    //   return next(new Error("Response object is missing"));
    // }
    // res.headers.authorization = `Bearer ${token}`;
      res.setHeader("Authorization", `Bearer ${token}`);
    responseHandler.success(res, 201, { role: newUser.role, token });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return next(new AppError('Invalid email or password', 401));
  }

  const token = signToken(user.email);
  res.setHeader("Authorization", `Bearer ${token}`);

  responseHandler.success(res, 200, { role: user.role, token });
});

exports.logout = catchAsync(async (req, res, next) => {
  res.setHeader('Authorization', ''); 
  responseHandler.success(res, 200, { message: 'Logged out successfully' });
});