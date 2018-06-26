const router = require('express').Router();

router.get('/producers', function(req, res) {
  var foo = req.app.producers.get(30);
  res.json(foo);
});

module.exports = router;