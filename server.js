const express = require('express');
const app = express();
require('dotenv').config();

const productionRoutes = require('./routes/production.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const orderRoutes = require('./routes/order.routes');
const authRoutes = require('./routes/auth.routes');

app.use(express.json());

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