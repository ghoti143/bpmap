const router = require('express').Router()

router.get('/producers', function(req, res) {
  var producers = req.app.producers.get(30)
  res.json(producers)
})

module.exports = router