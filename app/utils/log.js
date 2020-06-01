const fs = require('fs'),
config = require('../config');

const log = {
  add: function(obj, cb){
    const itype = obj.type,
    dest = './app/db/log/'+ itype +'.json';

    delete obj.type;
    obj.date =  Date.now();

    fs.readFile(dest, 'utf8', function(err, res){
      if(err){return cb('unable to load '+ itype +' log data')}
      res = JSON.parse(res);
      res.unshift(obj);
      if(res.length > config.logs.max){
        res = res.slice(0, config.logs.max);
      }
      fs.writeFile(dest, JSON.stringify(res), function(err){
        if(err){return cb('unable to save '+ itype +' log')}
        cb(false)
      });
    })
  },
  reset: function(itype, cb){
    let dest = './app/db/log/'+ itype +'.json';
    fs.writeFile(dest, JSON.stringify([]), function(err){
      if(err){return cb('unable to reset '+ itype +' log')}
      cb(false)
    });
  }
}

module.exports = log;
