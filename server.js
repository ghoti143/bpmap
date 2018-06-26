const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const schedule = require('node-schedule');
const app = express();
const producers = require('./server/producers.js');

app.locals.port = process.env.PORT || 8080;
app.producers = new producers('https://api.eosnewyork.io');

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

app.producers.loadProducers().then(function(result) {
  http.createServer(app).listen(app.locals.port);  
  console.log(`listening on port ${app.locals.port}`);
}, function(err) {
  console.log(err);
});

var job = schedule.scheduleJob('*/1 * * * *', app.producers.loadProducers.bind(app.producers));
