const express = require('express');
const cors = require('cors');

const rutas = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api', rutas);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
