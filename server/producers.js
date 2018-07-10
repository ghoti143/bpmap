const request = require('request-promise-native')
const R = require('ramda')
const NodeCache = require( "node-cache" )

class Producers {
  constructor(apiHost) {
    this.apiHost = apiHost
    this.producerCache = new NodeCache({stdTTL: 120})
    this.bpJsonCache = new NodeCache({stdTTL: 5000})
    this.locationCache = new NodeCache({stdTTL: 10000})
    
    this.geolocUrl = 'https://freegeoip.klokantech.com/json/'
    this.limit = 30
  }

  async loadBpJson(producer) {
    const url = `${producer.url}/bp.json`
    let bpJson = this.bpJsonCache.get(url)
    
    if(bpJson == undefined) {
      try {
        console.log(`reloading bp.json ${url}`)
        let response = await request(url, {'timeout': 5000})
        bpJson = JSON.parse(response)
        this.bpJsonCache.set(url, bpJson)
      } catch(err) {
        bpJson = "error"
      }
    }

    producer.bp_json = bpJson
    if(producer.bp_json.nodes) {
      await Promise.all(producer.bp_json.nodes.map(this.loadNodeLocations.bind(this)))
    }
  }

  async loadNodeLocations(node) {
    if(node.p2p_endpoint) {
      node.p2p_loc = await this.loadLocation(node.p2p_endpoint)
    }

    if(node.api_endpoint) {
      node.api_loc = await this.loadLocation(node.api_endpoint)
    }
  }

  async loadLocation(endpoint) {    
    const hostname = this.parseHost(endpoint)
    let location = this.locationCache.get(hostname)

    if (location == undefined) {
      try {
        const url = `${this.geolocUrl}${hostname}`
        console.log(`geocoding ip ${hostname}`)
        const response = await request(url)
        location = JSON.parse(response)
        this.locationCache.set(hostname, location)
      } catch(err) {
        location = 'error'
      }
    }

    return location
  }

  parseHost(hostname) {
    hostname = hostname.replace('http://', '')
    hostname = hostname.replace('https://', '')
    hostname = hostname.split(':')[0]
    hostname = hostname.replace('/', '')

    return hostname
  }

  async loadProducers() {
    const cacheKey = 'producers'
    let sortedList = this.producerCache.get(cacheKey)
    
    if(sortedList === undefined) {
      try {
        const options = {
          url: `${this.apiHost}/v1/chain/get_table_rows`,
          json: { 'scope':'eosio', 'code':'eosio', 'table':'producers', 'json': true, 'limit': 5000 }
        }
        console.log(`reloading producers ${options.url}`)
        let response = await request.post(options)
        sortedList = R.sort((a, b) => {
          return parseFloat(b.total_votes) - parseFloat(a.total_votes)
        }, response.rows)
        
        this.producerCache.set(cacheKey, sortedList)

      } catch(err) {
        throw 'failed to load producers'
      }
    }

    return sortedList.slice(0, this.limit)
  }

  async load() {
    let producers = await this.loadProducers()
    await Promise.all(producers.map(this.loadBpJson.bind(this)))
    return producers
  }
}

module.exports = Producers