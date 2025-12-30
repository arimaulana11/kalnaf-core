const express = require('express');

const app = express();
app.use(express.json());

const healthRoute = require('./routes/health');

app.use('/health', healthRoute);

app.get('/', (req, res) => {
  res.json({ message: 'Express + Neon + Vercel OK' });
});

module.exports = app;
