// gateway/server.js
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
//const authProxy = require('./routes/auth');
const notifiProxy = require('./routes/notifi');
const stockProxy = require('./routes/stock');

dotenv.config();

const app = express();

app.use(helmet());
app.use(express.json());
app.use(
  morgan('combined', {
    skip: (req) => req.path === '/health',
  })
);
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes principales pour chaque microservice
//app.use('/auth', authProxy);
app.use('/notify', notifiProxy);
app.use('/update-stock', stockProxy);

// Lancer le Gateway
const PORT = process.env.PORT || process.env.GATEWAY_PORT || 8000;
app.listen(PORT, () => {
  console.log(`Gateway opérationnel sur le port ${PORT}`);
});