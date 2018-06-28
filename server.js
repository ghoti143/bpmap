const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const http = require('http')
const schedule = require('node-schedule')
const app = express()
const producers = require('./server/producers.js')
const api = require('./server/api')

app.locals.port = process.env.PORT || 8080
app.producers = new producers('https://api.eosnewyork.io')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use(express.static(path.join(__dirname, 'dist')))

app.use('/api', api)

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'))
})

async function start() {
  await app.producers.loadProducers()
  http.createServer(app).listen(app.locals.port)
  console.log(`listening on port ${app.locals.port}`)
  const job = schedule.scheduleJob('*/1 * * * *', app.producers.loadProducers.bind(app.producers));
}

try {
  start()
} catch(err) {
  console.error(err);
}