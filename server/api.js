const router = require('express').Router()

router.get('/producers', async (req, res) => {
  const producers = await req.app.producers.load()
  res.json(producers)
})

module.exports = router