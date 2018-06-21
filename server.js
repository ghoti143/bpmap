const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const app = express();

const isProduction = process.env.NODE_ENV === 'production'

//For https
const https = require('https');
var fs = require('fs');
var options = {
  key: fs.readFileSync('certificates/private.key'),
  cert: fs.readFileSync('certificates/certificate.crt'),
  ca: fs.readFileSync('certificates/ca_bundle.crt')
};

// API file for interacting with MongoDB
const api = require('./server/routes/api');

// Parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// DIST output folder
app.use(express.static(path.join(__dirname, 'dist')));

// API location
app.use('/api', api);

// Send all other requests to the client app

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

if(isProduction) {
  https.createServer(options, app).listen(443);
} else {
  http.createServer(app).listen(8080);
}
