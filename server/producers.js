const request = require('request')
const requestp = require('request-promise-native')
const loki = require('lokijs')
const R = require('ramda')

class Producers {
  constructor(apiHost) {
    this.apiHost = apiHost
    this.lastFetchDate = Date.now()
    this.db = new loki("loki.json")
    this.list = this.db.addCollection('producers')
  }  

  get(limit = 30) {
    return this.list.chain().find().limit(limit).data();
  }

  async loadBpJson() {
    const bps = this.get(10)
    
    for(let i = 0; i < bps.length; i++) {
      let bp = bps[i]
      const url = `${bp.url}/bp.json`
      let response

      console.log(`get bp.json :: START :: ${bp.url}`)
      
      try {
        
        response = await requestp(url)
        bp.bp_info = JSON.parse(response)
        console.log(`get bp.json :: FIN :: ${bp.url}`)
      } catch(err) {
        console.error(`get bp.json :: ${err} :: ${bp.url}`)
        bp.bp_info = "error"
      }

      await this.loadServerLocation(bp, 'p2p')
      await this.loadServerLocation(bp, 'api')
    }    
  }

  createGeocodeUrl(hostname) {
    hostname = hostname.replace("http://", "")
    hostname = hostname.replace("https://", "")
    hostname = hostname.split(':')[0]
    hostname = hostname.replace("/", "")
    return `http://ip-api.com/json/${hostname}`
  }

  async loadServerLocation(bp, type) {
    const epParam = `${type}_endpoint`
    const locParam = `${type}_location`
    let response
    
    console.log(`get location :: START :: ${bp.url}`)

    try {
      const url = this.createGeocodeUrl(bp.bp_info.nodes[0][epParam])
      response = await requestp(url)
      bp[locParam] = JSON.parse(response)
      console.log(`get location :: FIN :: ${bp.url}`)
    } catch(err) {
      console.error(`get location :: ${err} :: ${bp.url}`)
      bp[locParam] = "error"
    }    
  }

  async loadProducers() {
    const options = {
      url: `${this.apiHost}/v1/chain/get_table_rows`,
      json: { 'scope':'eosio', 'code':'eosio', 'table':'producers', 'json': true, 'limit': 5000 }
    }    
    let response

    console.log('refresh prod data :: START')      
      
    try {
      response = await requestp.post(options)
      let sortedList = R.sort((a, b) => {
        return parseFloat(b.total_votes) - parseFloat(a.total_votes)
      }, response.rows)
      
      this.list.clear()    
      this.list.insert(sortedList)
      await this.loadBpJson()
      console.log('refresh prod data :: FIN');
    } catch(err) {
      console.error(`refresh prod data :: ${err}`);
      throw "failed to load producers";
    }    
  } 
}

module.exports = Producers