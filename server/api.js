const router = require('express').Router();
const producers = require('./producers');

router.get('/load', function(req, res) {
  producers.load();
  res.send('load.  list: ' + producers.list.toString());
});

router.get('/clear', function(req, res) {
  producers.clear();
  res.send('clear.  list: ' + producers.list.toString());
});

router.get('/get', function(req, res) {  
  res.send('get.  list: ' + producers.list.toString());
});

router.get('/foo', function(req, res) {  
  producers.foo(req.app.locals.eosApiHost).then(function(result) {
    res.send('foo.  list: ' + JSON.stringify(result));    
  }, function(err) {
    console.log(err);
  });
});

module.exports = router;