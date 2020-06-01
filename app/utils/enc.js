const crypto = require('crypto'),
config = require('../config'),
tar = require('tar');


const enc = {
  encrypt: function (text, key, cb){
    try {
      const iv = crypto.randomBytes(32),
      cipher = crypto.createCipheriv('aes-256-gcm', key, iv),
      encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();
      cb(false, Buffer.concat([iv, tag, encrypted]).toString('hex'));
    } catch (err) {
      if(err){return cb(err)}
    }
  },
  decrypt: function (encdata, key, cb){
    try {
      encdata = Buffer.from(encdata, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, encdata.slice(0, 32));
      decipher.setAuthTag(encdata.slice(32,48));
      cb(false, decipher.update(encdata.slice(48), 'binary', 'utf8') + decipher.final('utf8'));
    } catch (err) {
      if(err){return cb(err)}
    }
  },
  hmac: function(){

  },
  hashSync: function(len, data){
    try {
      return crypto.createHash('sha'+ len).update(data).digest('hex');
    } catch (err) {
      if(err){
        ce(err);
        return null;
      }
    }
  },
  pbkdf2: function(){
    let secret = crypto.randomBytes(256);
    salt = crypto.randomBytes(256);

    crypto.pbkdf2(secret, salt, 80000, 32, 'sha512', function(err, key) {
      if(err){cb(err, null)}
      cb(false, key);
    });
  },
  tar_c: function(obj, cb){

    tar.c({
        gzip: config.gzip,
        file: obj.name +'.tgz'
      },
      obj.files
    )
    .then(function(res){
      cb(false, 'success')
    })
    .catch(function(err){
      cb(err)
    })
  }
}

module.exports = enc;
