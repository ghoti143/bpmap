const request = require('request-promise-native')
const R = require('ramda')
const { Resolver } = require('dns')
const NodeCache = require( "node-cache" )

class Producers {
  constructor(apiHost) {
    this.apiHost = apiHost
    this.resolver = new Resolver();
    this.resolver.setServers(['8.8.8.8'])
    
    this.producerCache = new NodeCache({stdTTL: 120})
    this.bpJsonCache = new NodeCache({stdTTL: 5000})
    this.dnsCache = new NodeCache({stdTTL: 5000})
    this.locationCache = new NodeCache({stdTTL: 10000})
    
    this.geolocUrl = 'https://api.ipgeolocation.io/ipgeo?fields=latitude,longitude,isp,city&apiKey=e60b30a218394388a4ad62344f07cf47&ip='
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
    await Promise.all(producer.bp_json.nodes.map(this.loadNodeLocations.bind(this)))
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
    const ipaddr = await this.resolveHost(endpoint)
    let location = this.locationCache.get(ipaddr)

    if(ipaddr == 'error') {
      return 'error'
    }

    if (location == undefined) {
      try {
        const url = `${this.geolocUrl}${ipaddr}`
        console.log(`geocoding ip ${ipaddr}`)
        const response = await request(url)
        location = JSON.parse(response)
        this.locationCache.set(ipaddr, location)
      } catch(err) {
        location = 'error'
      }
    }

    return location
  }

  async resolveHost(hostname) {
    hostname = hostname.replace('http://', '')
    hostname = hostname.replace('https://', '')
    hostname = hostname.split(':')[0]
    hostname = hostname.replace('/', '')

    const self = this

    return new Promise((resolve) => {
      let ipaddr = this.dnsCache.get(hostname)
      
      if(ipaddr == undefined) {
        console.log(`resolving hostname ${hostname}`)
        self.resolver.resolve4(hostname, (err, addresses) => {
          if (err || !addresses) return resolve('error')
          ipaddr = addresses[0]
          self.dnsCache.set(hostname, ipaddr)
          resolve(ipaddr)
        })
      } else {
        resolve(ipaddr)
      }
    })
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