// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron'),
path = require('path'),
config = require('./app/config'),
log = require('./app/utils/log'),
fs = require('fs');

let app_cache = config.app_cache;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

let mainWindow;

function init_app () {
  mainWindow = new BrowserWindow(config.cnf);

  mainWindow.loadFile('app/index.html');
  mainWindow.maximize();

  if(config.settings.dev){
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function(){
    mainWindow = null;
  })

  mainWindow.webContents.session.on('will-download', function(event, item, webContents){
    const ipath = config.install.path;
    if(typeof ipath !== 'string' || ipath === ''){
      return ///
    }

    item.setSavePath(config.install.path)

    item.on('updated', function(event, state){
      if (state === 'interrupted') {
        console.log('Download is interrupted but can be resumed')
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('Download is paused')
        } else {
          console.log(`Received bytes: ${item.getReceivedBytes()}`)
        }
      }
    })

    item.once('done', function(event, state){
      if (state === 'completed') {
        console.log('Download successfully')
      } else {
        console.log(`Download failed: ${state}`)
      }
    })
  })

  ipcMain.on('restart-app', function(event, arg){
    console.log('restarting launcher')
    app.relaunch()
    app.exit(0)
  })

  ipcMain.on('exit-app', function(event, arg){
    app.exit()
  })

  ipcMain.on('main-win', function(event, arg){
    if(mainWindow.isFullScreen() && arg === 'maximize' || mainWindow.isFullScreen() && arg === 'unmaximize' ){
      return;
    }
    if(typeof arg === 'string'){
      mainWindow[arg]()
    } else {
      mainWindow[arg[0]](arg[1])
    }
  })

  ipcMain.on('full-screen', function(event, arg){
    if(mainWindow.isFullScreen()){
      mainWindow.setFullScreen(false)
    } else {
      mainWindow.setFullScreen(true)
    }
  })

  ipcMain.on('check_server', function(event, arg){
    let arr = [],
    iarr = Object.keys(app_cache);

    for (let i = 0; i < iarr.length; i++) {
      if(app_cache[iarr[i]].enabled){
        arr.push({
          type: iarr[i],
          pid: app_cache[iarr[i]].pid
        })
      }
    }
    event.reply('check_server', arr)
  })

  ipcMain.on('stop_server', function(event, arg){
    try {
      let ipath = config.install.path,
      dest = [ipath, 'spartan-cms/.tmp/pid', arg.type + '_pid'].join('/'),
      nmpid = '.tmp/pid/nodemon_pid';

      if(arg.type === 'rest'){
        dest = [ipath, 'spartan-rest/.tmp/pid', arg.type + '_pid'].join('/');
      }

      if(arg.type === 'monitor'){
        dest = [ipath, 'spartan-monitor/.tmp/pid', arg.type + '_pid'].join('/');
      }

      process.kill(arg.pid);
      process.kill(
        JSON.parse(
          fs.readFileSync(dest, 'utf8')
        )
      )

      if(arg.type === 'admin' || arg.type === 'rest' || arg.type === 'monitor'){
        if(arg.type === 'admin'){
          dest = [ipath, 'spartan-cms', nmpid].join('/');
        }
        if(arg.type === 'rest'){
          dest = [ipath, 'spartan-rest', nmpid].join('/');
        }
        if(arg.type === 'monitor'){
          dest = [ipath, 'spartan-monitor', nmpid].join('/');
        }

        process.kill(
          JSON.parse(
            fs.readFileSync(dest, 'utf8')
          )
        )
        fs.writeFileSync(dest, 'null');
      }
    } catch (err) {
      console.log(err);
      return event.reply('toast-msg', {
        type: 'danger',
        msg: 'server error'
      })
    }
    app_cache[arg.type].pid = null;
    app_cache[arg.type].enabled = false;
    event.reply('stop_server', {
      type: arg.type
    })
  })

  ipcMain.on('start_server', function(event, arg){
    const { spawn, exec } = require('child_process');

    let ipath = config.install.path,
    basepath = [ipath, 'spartan-cms'].join('/'),
    nmpid = '.tmp/pid/nodemon_pid',
    spn, dest;

    if(app_cache[arg].enabled){
      return event.reply('toast-msg', {
        type: 'warning',
        msg: 'server already started'
      })
    }

    if(arg === 'admin'){
      spn = exec('node index.js', {
        cwd: basepath,
        detached: true
      });

    } else if(arg === 'css_monitor'){

      spn = spawn('node', ['./preprocessor.js'], {
        cwd: basepath + '/dev'
      });

    } else if(arg === 'rest'){

      spn = exec('node index.js', {
        cwd: [ipath, 'spartan-rest'].join('/'),
        detached: true
      });

    }  else if(arg === 'monitor'){

      spn = exec('node index.js', {
        cwd: [ipath, 'spartan-monitor'].join('/'),
        detached: true
      });

    } else {
      spn = spawn('node', ['./admin/server/'+ arg +'.js'], {
        cwd: basepath
      });
    }

    app_cache[arg].pid = spn.pid;
    app_cache[arg].enabled = true;

    spn.stdout.on('data', function(data){
      console.log(data.toString());
    });

    spn.stderr.on('data', function(data){
      console.error(data.toString());
    });

    spn.on('exit', function(code){
      if(arg === 'rest'){
        dest = [ipath, 'spartan-rest', nmpid].join('/');
      } else if(arg === 'monitor'){
        dest = [ipath, 'spartan-monitor', nmpid].join('/');
      } else {
        dest = [ipath, 'spartan-cms/.tmp/pid', arg + '_pid'].join('/');
      }

      fs.writeFileSync(dest, 'null');

      console.log('[process:' + spn.pid + '] terminating...');
    });

    event.reply('start_server', {
      type: arg,
      pid: spn.pid
    })

  })

  ipcMain.on('load-win', function(event, arg){

    let cms_win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences:{
        webSecurity: false,
        allowRunningInsecureContent: true
      }
    })

    cms_win.on('certificate-error', function(event, webContents, url, err, cert, cb){
      event.preventDefault();
      cb(true);
    });

    let sec = 'https';
    if(!arg.secure){
      sec = sec.slice(0, -1);
    }

    cms_win.on('closed', function() {
      cms_win = null
    })

    cms_win.loadURL(sec +'://localhost:'+ arg.port);

    log.add({type: 'info'}, function(err){
      if(err){return cl(err)}
    })

  })

}

app.on('ready', init_app)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin'){
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    init_app();
  }
});

app.on('certificate-error', function(event, webContents, url, err, cert, cb) {
  event.preventDefault();
  cb(true);
});
