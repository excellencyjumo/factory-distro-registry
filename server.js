const express = require('express');
const app = express();
const cors = require('cors'); 
require('dotenv').config();

const productionRoutes = require('./routes/production.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const orderRoutes = require('./routes/order.routes');
const authRoutes = require('./routes/auth.routes');
const responseHandler = require('./utils/responseHandler');

app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

app.get('/', (_req, res) => {
  responseHandler.success(res,200,{
    message: 'Welcome to the Production Management API!'
  })
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/productions', productionRoutes);
app.use('/api/v1/warehouses', warehouseRoutes);
app.use('/api/v1/orders', orderRoutes);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  responseHandler.error(res, err);
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = server;
