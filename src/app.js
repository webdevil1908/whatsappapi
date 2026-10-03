const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const webhookRoutes = require('./routes/webhook.routes');
const clientRoutes = require('./routes/client.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use(express.static('public'));

app.use('/webhook', webhookRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.send('Order Sheet Bot is Running');
});

module.exports = app;