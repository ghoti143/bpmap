const request = require('request');
const R = require('ramda');

class Producers {
  constructor() {
    this.list = [];
    this.lastFetchDate = Date.now();
  }

  clear() {
    this.list = [];
  }

  load() {
    this.list = ['foo', 'bar'];
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
      var elapsed = currDate - self.lastFetchDate;
      if(elapsed > 10000 || self.list.length === 0) {
        console.log(' :: ' + self.list.length);
        console.log('refreshing prod data :: ' + elapsed.toString());
        request.post(options, function(err, resp, body) {
          if (err) {
            reject(err);
          } else {
            self.list = R.sort(comp, body.rows);

            self.lastFetchDate = Date.now();
            resolve(self.list);
          }
        });
      } else {
        console.log('using cached prod data');
        resolve(self.list);
      }

    });
  }
}

module.exports = new Producers();