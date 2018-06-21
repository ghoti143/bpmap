var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    res.send('index');
});

// Define the home page route
router.get('/foo', function(req, res) {
  res.send('foo');
});

// Define the about route
router.get('/bar', function(req, res) {
  res.send('bar');
});


module.exports = router;