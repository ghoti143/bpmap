const request = require('request');
const loki = require('lokijs');
const R = require('ramda');

class Producers {
  constructor(apiHost) {
    this.apiHost = apiHost;
    this.lastFetchDate = Date.now();
    this.db = new loki("loki.json");
    this.list = this.db.addCollection('producers');
  }  

  get(limit = 30) {
    return this.list.chain().find().limit(limit).data();
  }

  loadBpJson() {
    var bps = this.get();
    for(var i = 0; i < bps.length; i++) {
      var url = `${bps[i].url}/bp.json`;
      request.get(url, this.loadBpJson_done.bind(this, bps[i]));
    }
  }

  loadBpJson_done(bp, err, resp, body) {
    if (err) {
      console.log(`get bp.json :: ERR :: file not found :: ${bp.url}`);
      bp.bp_info = "error";
    } else {
      try {
        bp.bp_info = JSON.parse(body);
        this.loadServerLocations(bp);

        console.log(`get bp.json :: FIN ${bp.url}`);
      } catch(e) {
        console.log(`get bp.json :: ERR :: ${e} :: ${bp.url}`);
        bp.bp_info = "error";
      }      
    }
  }

  createIpStackUrl(hostname) {
    hostname = hostname.replace("http://", "");
    hostname = hostname.replace("https://", "");
    hostname = hostname.split(':')[0];
    hostname = hostname.replace("/", "");
    var url = `http://api.ipstack.com/${hostname}?access_key=82d33e369e0d885b6b8a16ba42399b77&fields=latitude,longitude`;
    return url;
  }

  loadServerLocations(bp) {
    if(bp.bp_info && bp.bp_info.nodes && bp.bp_info.nodes[0].p2p_endpoint) {
      var url = this.createIpStackUrl(bp.bp_info.nodes[0].p2p_endpoint);
      request.get(url, this.loadServerLocations_done.bind(this, bp.bp_info.nodes[0], 'p2p_location'));
    }
    if(bp.bp_info && bp.bp_info.nodes && bp.bp_info.nodes[0].api_endpoint) {
      var url = this.createIpStackUrl(bp.bp_info.nodes[0].api_endpoint);
      request.get(url, this.loadServerLocations_done.bind(this, bp.bp_info.nodes[0], 'api_location'));
    }
  }

  loadServerLocations_done(node, prop, err, resp, body) {
    if (err) {
      console.log(`get location :: ERR :: ${err}`);
      node[prop] = "error";
    } else {
      try {
        node[prop] = JSON.parse(body);

        console.log(`get location :: FIN`);
      } catch(e) {
        console.log(`get location :: ERR :: ${e}`);
        node[prop] = "error";
      }      
    }
  }

  loadProducers(eosApiHost) {
    var options = {
      url: `${this.apiHost}/v1/chain/get_table_rows`,
      json: { 'scope':'eosio', 'code':'eosio', 'table':'producers', 'json': true, 'limit': 5000 }
    };
    // Return new promise 
    var self = this;
    
    return new Promise(function(resolve, reject) {
    // Do async job
      
      console.log('refresh prod data :: START');
      request.post(options, function(err, resp, body) {
        if (err) {
          console.log('refresh prod data :: ERR');
          reject(err);
        } else {
          
          var sortedList = R.sort((a, b) => {
            return parseFloat(b.total_votes) - parseFloat(a.total_votes);
          }, body.rows);
          
          self.list.clear();          
          self.list.insert(sortedList);
          self.loadBpJson();
          console.log('refresh prod data :: FIN');
          resolve();
        }
      });
    });
  }
}

module.exports = Producers;