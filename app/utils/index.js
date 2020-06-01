const fs = require('fs-extra'),
os = require('os'),
crypto = require('crypto'),
config = require('../config'),
enc = require('./enc'),
h = require('./h'),
{ spawn } = require('child_process'),
git = require('simple-git/promise'),
{ls,ss} = require('./storage'),
rout = require('./rout'),
{ side_bar, status_bar, nav_bar, bread_crumb, to_top } = require('./components'),
{ dialog } = require('electron').remote;



const ec = {
  ecdsa_keygen: function(){
    const { generateKeyPairSync } = require('crypto');
    const { publicKey, privateKey } = generateKeyPairSync('ec', {
      namedCurve: 'secp521r1',
      publicKeyEncoding: {
        type: 'spki',
        format: 'der'
      },
      privateKeyEncoding: {
        type: 'sec1',
        format: 'der'
      }
    });

    cl(publicKey.toString('hex'))
    cl(privateKey.toString('hex'))
  },
  ecdsa_sign: function(){

  },
  ecdsa_verify: function(){

  },
  ecdh_keygen: function(cb){
    try {
      const gen = crypto.createECDH('secp521r1');
      const newKey = gen.generateKeys('hex', 'compressed');

      cb(false, gen.getPrivateKey('hex'), newKey)
    } catch (err) {
      if(err){return cb(err)}
    }
  },
  ecdh_compute: function(privateKey, publicKey, cb){
    try {
      const gen = crypto.createECDH('secp521r1');
      gen.setPrivateKey(Buffer.from(privateKey, 'hex'));
      const final = gen.computeSecret(Buffer.from(publicKey, 'hex'), 'compressed', 'hex');
      cb(false, final)
    } catch (err) {
      if(err){return cb(err)}
    }
  }
}


/*
ec.ecdh_keygen(function(err, private_a, public_a){
  if(err){return ce(err)}
  //send a
  ec.ecdh_keygen(function(err, private_b, public_b){
    if(err){return ce(err)}
    //send b
    ec.ecdh_compute(private_a, public_b, function(err, res_a){
      if(err){return ce(err)}
      ec.ecdh_compute(private_b, public_a, function(err, res_b){
        if(err){return ce(err)}
        cl(res_a)
      })

    })

  })
})
*/
const utils = {
  return_platform: function(){
    let i = os.platform();
    if(i === 'darwin'){
      i = 'mac'
    }
    if(i === 'win32'){
      i = 'windows'
    }
    return i;
  },
  update_install: function(obj, is_installed, cb){
    for (let i = 0; i < config.install.status.length; i++) {
      if(config.install.status[i].title === obj.title){
        config.install.status[i].installed = obj.sel;
        config.install.status[i].installed_version = obj.version;
        config.install.status[i].current_version = obj.version;
        config.install.status[i].update.last_check = Date.now();
        config.install.status[i].update.available = false;
      }
    }
    fs.writeFile('./app/config/index.json', js(config,0,2), function(err){
      if(err){return cb(err)}
      is_installed.innerText = obj.sel;
      cb(false)
    })
  },
  update_preprocess: function(obj, is_installed, cb){
    for (let i = 0; i < config.preprocessors.length; i++) {
      if(config.preprocessors[i].title === obj.title){
        config.preprocessors[i].installed = obj.sel;
        config.preprocessors[i].version = obj.version;
      }
    }
    fs.writeFile('./app/config/index.json', js(config,0,2), function(err){
      if(err){return cb(err)}
      is_installed.innerText = obj.sel;
      cb(false)
    })
  },
  update_preprocess_status: function(item, i, cb){
    let dest = config.install.path +'/spartan-cms/dev/index.json',
    i_exists = false;
    fs.readJson(dest, function(err,res){
      if(err){return cb(err)}
      for (let key in res.css) {
        if(i && res.css[key] && res.css[key] !== item){
          i_exists = true;
        }
        res.css[key] = false;
      }
      if(i_exists){
        cb(false, 'cannot enable multiple css preprocessors');
      } else {
        res.css[item] = i;
        fs.writeJson(dest, res,function(err){
          if(err){return cb(err)}
          cb(false);
        })
      }
    })
  },
  remove: function(path, cb){
    fs.remove(path, function(err){
      if(err){
        cl(err);
        return cb(err)}
      cb(false)
    });
  },
  git_clone: function(obj, cb){
    git(obj.cwd)
    .clone(obj.src)
    .then(function(){
      cb(false)
    })
    .catch(function(err){
      cb(err)
    });
  },
  npm_task: function(obj, t_area, cb){

    const sp = spawn('npm', obj.args, {cwd: obj.path});

    sp.stdout.on('data', function(data){
      t_area.append('npm: '+ data);
    });

    sp.stderr.on('data', function(data){
      t_area.append('npm: '+ data);
    });

    sp.on('close', function(code){
      if(code === 0){
        t_area.append('npm: install finished\n');
        cb(false)
      } else {
        t_area.append('npm: install error\n');
        cb('installation error')
      }
    });

  },
  vendcheck: function(obj, cdata, cb){

    const sp = spawn(obj.cmd, [obj.ext], {cwd: obj.path});

    sp.stdout.on('data', function(data){
      data = data.toString();

      if(data !== '' && data.length !== 1){
        for (let i = 0; i < cdata.length; i++) {
          if(obj.name === cdata[i].name){
            if(cdata[i].name === 'git'){
              data = data.split(' ').pop();
            } else if (cdata[i].name === 'node-js'){
              data = data.slice(1);
            } else if (cdata[i].name === 'openssl'){
              data = data.split(' ')[1];
            } else if (cdata[i].name === 'cordova'){
              data = data.split(' ')[0];
            } else if (cdata[i].name === 'npm'){
              data = data
            } else if (cdata[i].name === 'java'){
              data = data.split(' ')[1];
            } else if (cdata[i].name === 'gradle'){
              let dat = data.split(' ')
              if(dat[0].toLowerCase().includes('gradle')){
                data = dat[1].split('-')[0];
              } else {
                data = '';
              }
            } else if (cdata[i].name === 'android'){
              let dat = data.split('Version ')[1];
              dat = dat.split('\n')[0];
              data = dat.split(' ')[0];
            }
            if(data !== ''){
              cdata[i].version = data
              ls.set('vendcheck', cdata)
              cb(false, cdata[i])
            }
          }
        }
      }
    });

    sp.stderr.on('data', function(data){
      data = data.toString().split(' ');
      if(data[0] === 'javac'){
        for (let i = 0; i < cdata.length; i++) {
          if(cdata[i].name === 'java'){
            cdata[i].version = data[1]
            ls.set('vendcheck', cdata)
            cb(false, cdata[i])
          }
        }
      } else {
        return cb(true)
      }

    });

  },
  clone_obj: function(obj){
    return Object.assign({}, obj);
  },
  get_year: function(){
    let d = new Date();
    return d.getFullYear();
  },
  empty: function(i){
    while (i.firstChild) {
      i.removeChild(i.firstChild);
    }
  },
  select_dir: function(cb){
    dialog.showOpenDialog({properties: ['openDirectory']})
    .then(function(res){
      if(res.canceled){
        let err = 'folder select cancelled'
        utils.toast('warning', err);
        return cb(err);
      }
      cl(res.filePaths[0])
      cb(false, res.filePaths[0])
    })
    .catch(function(err){
      cb(err)
    })
  },
  rout: function(dest, cb){
    let main = document.getElementById('main-content');
    main.innerHTML = '';
    location.hash = dest;
    rout[dest](main, function(err){
      if(err){return cb(err)}
      utils.totop(0);
      cb(false);
      ss.set('rout', dest)
    });
  },
  totop: function(i){
    window.scroll({
      top: i,
      left: 0,
      behavior: 'smooth'
    });
  },
  debounce: function(func, wait, immediate) {
  	var timeout;
  	return function() {
  		var context = this, args = arguments;
  		var later = function() {
  			timeout = null;
  			if (!immediate) func.apply(context, args);
  		};
  		var callNow = immediate && !timeout;
  		clearTimeout(timeout);
  		timeout = setTimeout(later, wait);
  		if (callNow) func.apply(context, args);
  	};
  },
  capitalize: function(str) {
   try {
     let x = str[0] || str.charAt(0);
     return x  ? x.toUpperCase() + str.substr(1) : '';
   } catch (err) {
     if(err){return str;}
   }
  },
  toast: function(i, msg){
    const toast = h('div#toast.alert.alert-'+ i, {
        role: "alert"
    }, msg);
    document.body.append(toast);
    setTimeout(function(){
      toast.classList.add('fadeout');
      setTimeout(function(){
        toast.remove();
      },1000)
    },3000)
    return;
  },
  update_install_path: function(item){
    let obj = utils.clone_obj(config);
    obj.install.path = item;
    fs.writeFile('./app/config/index.json', js(obj,0,2), function(err){
      if(err){return utils.toast('danger', 'unable to update install path');}
      utils.toast('success', 'install path updated');
      setTimeout(function(){
        location.reload()
      },3000)
    })
  },
  version_check: function(current,latest){
    let x = current.split('.'),
    y = latest.split('.');
    for (let i = 0; i < 3; i++) {
      if(parseInt(y[i]) > parseInt(x[i])){
        return latest;
      }
    }
    return false
  },
  is_online: function(i){
    i.classList.add('green');
    i.classList.remove('red');
    i.title = 'online';
    ss.set('is_online', true)
  },
  is_offline: function(i){
    i.classList.add('red');
    i.classList.remove('green');
    i.title = 'offline';
    ss.set('is_online', true)
  },
  add_spn: function(item, text){
    item.setAttribute('disabled', true);
    utils.empty(item);
    item.append(h('span.spinner-grow.spinner-grow-sm.mr-1'), text);
  },
  remove_spn: function(item, text){
    item.removeAttribute('disabled');
    utils.empty(item);
    item.innerText = text;
  },
  login: function(){
    let arr = [];
    pw_hash = ls.get('token'),
    main = h('div#main');

    document.body.append(main)

    if(pw_hash === config.settings.token){
      return utils.init(main);
    }

    let locTpl = h('div#lock-div.container-fluid',
      h('div.row.align-items-center.justify-content-center',
        h('div.col-lg-6.text-center',
          h('img.img-thumbnail.mb-4', {
            src: './static/images/lg_400_l.svg',
            width: '256'
          }),
          h('input#lock-input.form-control', {
            type: 'password',
            onkeyup: function(evt){
              arr.push(evt.key);
              if(arr.length > 8){
                arr = arr.slice(1)
              }

              if(arr.length === 8){
                if(enc.hashSync('512', arr.join('')) === config.settings.token){
                  ls.set('token', config.settings.token);
                  locTpl.parentNode.replaceChild(main, locTpl);
                  utils.init(main);
                }
              }
            }
          }),
          h('h1.icon-lock')
        )
      )
    )

    main.parentNode.replaceChild(locTpl, main);
  },
  init: function(main){

    let r_dest = ss.get('rout') || config.settings.landing;

    main.append(
      new side_bar(config.sb_nav),
      new nav_bar(config),
      tpl.sdown(),
      tpl.ddown(),
      new bread_crumb(config),
      h('div#main-content.container-fluid'),
      tpl.footer(),
      h('div#sub-content',
        new to_top(0),
        new status_bar()
      )
    )

    utils.rout(r_dest, function(err){
      if(err){return ce(err)}
      cl('dashboard loaded')
    });

    r_dest = null;
  },
  lock: function(){
    let arr = [];
    pw_hash = ls.get('token');

    ls.set('token', null);

    let locTpl = h('div#lock-div.container-fluid',
      h('div.row.align-items-center.justify-content-center',
        h('div.col-lg-6.text-center',
          h('img.img-thumbnail.mb-4', {
            src: './static/images/lg_400_l.svg',
            width: '256'
          }),
          h('input#lock-input.form-control', {
            type: 'password',
            onkeyup: function(evt){
              arr.push(evt.key);
              if(arr.length > 8){
                arr = arr.slice(1)
              }

              if(arr.length === 8){
                if(enc.hashSync('512', arr.join('')) === pw_hash){
                  ls.set('token', pw_hash);
                  locTpl.parentNode.replaceChild(src, locTpl);
                }
              }
            }
          }),
          h('h1.icon-lock')
        )
      )
    ),
    dest = document.getElementById('main'),
    src = dest.parentNode.replaceChild(locTpl, dest);
  }
}

module.exports = utils;
