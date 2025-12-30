require('dotenv').config();
const express = require('express');
const app = express();

// ===== Custom Middlewares (No Library) =====
const cors = require('./middlewares/cors');
const requestId = require('./middlewares/requestId');
const logger = require('./middlewares/logger');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const basicToken = require('./middlewares/basicToken');


// ===== Body Parser (Built-in Express) =====
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ===== Global Middleware =====
app.use(cors);
app.use(requestId);
app.use(logger);

// ===== Routes =====
const productRoutes = require('./routes/product.routes');

app.use('/health', require('./routes/health'));
app.use('/api/products', basicToken, productRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'API LIVE',
    requestId: req.requestId
  });
});

// ===== Error Handling =====
app.use(notFound);
app.use(errorHandler);

module.exports = app;
