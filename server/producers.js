const request = require('request');
const R = require('ramda');
const loki = require('lokijs');

class Producers {
  constructor() {
    this.lastFetchDate = Date.now();
    this.db = new loki("loki.json");
    this.list = this.db.addCollection('producers');
  }

  clear() {
    this.list.clear();
  }

  getTop30() {
    return this.list.chain().find().limit(30).data();
  }

  foo(eosApiHost) {
    var options = {
      url: `${eosApiHost}/v1/chain/get_table_rows`,
      json: { 'scope':'eosio', 'code':'eosio', 'table':'producers', 'json': true, 'limit': 5000 },
      headers: {
        'User-Agent': 'request'
      }
    };
    // Return new promise 
    var self = this;
    var currDate = Date.now();
    var comp = function(a, b) { return parseFloat(b.total_votes) - parseFloat(a.total_votes); }


    return new Promise(function(resolve, reject) {
    // Do async job
      
      console.log('refreshing prod data :: ');
      request.post(options, function(err, resp, body) {
        if (err) {
          reject(err);
        } else {
          var sortedList = R.sort(comp, body.rows);

          for(var i = 0; i < sortedList.length; i++) {
            self.list.insert(sortedList[i]);
          }
          resolve();
        }
      });
    });
  }
}

module.exports = new Producers();