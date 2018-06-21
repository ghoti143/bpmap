const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const secure = require('ssl-express-www');
const app = express();

app.locals.port = process.env.PORT || 8080;
app.locals.eosApiHost = 'https://api.eosnewyork.io';

app.use(secure);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// DIST output folder
app.use(express.static(path.join(__dirname, 'dist')));

// API location
const api = require('./server/api');
app.use('/api', api);

// Send all other requests to the client app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

http.createServer(app).listen(app.locals.port);
