const config = require('../config'),
h = require('./h'),
fs = require('fs-extra'),
app = require('electron').remote.mainWindow,
{ shell, ipcRenderer } = require('electron');

const tpl = {
  ddown: function(){
    return h('div.dropdown-menu.dd-menu',
      h('div.dropdown-item.dd-item', {
        onclick: function(){
          ls.set('token', false);
          location.reload();
        }
      }, 'Logout'),
      h('div.dropdown-item.dd-item', {
        onclick: function(){
          utils.lock()
        }
      }, 'Lock'),
      h('div.dropdown-item.dd-item', {
        onclick: function(){
          location.reload();
        }
      }, 'Reload'),
      h('div.dropdown-item.dd-item', {
        onclick: function(){
          ipcRenderer.send('restart-app');
        }
      }, 'Restart'),
      h('div.dropdown-item.dd-item', {
        onclick: function(){
          ls.set('token', false);
          ipcRenderer.send('exit-app');
        }
      }, 'Exit')
    )
  },
  sdown: function(){
    return h('div.dropdown-menu.dd-menu',
      h('div.dropdown-item.dd-item', {
        onclick: function(){
          ipcRenderer.send('main-win', 'minimize')
        }
      }, 'Minimize'),
      h('div.dropdown-item.dd-item', {
        onclick: function(){
          let dest;
          if(this.innerText === 'Maximize'){
            dest = 'maximize';
            this.innerText = 'Unmaximize'
          } else {
            dest = 'unmaximize';
            this.innerText = 'Maximize';
          }
          ipcRenderer.send('main-win', dest);
        }
      }, 'Maximize'),
      h('div.dropdown-item.dd-item', {
        onclick: function(){
          ipcRenderer.send('full-screen');
        }
      }, 'Fullscreen')
    )
  },
  footer: function(){
    const copyright = config.settings.copyright_msg.replace('{{year}}', utils.get_year());
    return h('div.footer',
      h('div.container-fluid',
        h('div.text-center',
          h('p', copyright)
        )
      )
    )
  },
  install_path: function(){
    return h('div.col-12',
      h('div.form-group',
        h('label', 'installation path'),
        h('div.input-group.input-group-sm',
          h('input.form-control', {
            type: 'text',
            value: config.install.path,
            readOnly: true
          }),
          h('div.input-group-append',
            h('span.input-group-text.cp', {
              onclick: function(){
                let $this = this;
                utils.select_dir(function(err, res){
                  if(err){return cl(err)}
                  $this.parentNode.previousSibling.value = res;
                  utils.update_install_path(res);
                })
              }
            }, 'select')
          )
        )
      )
    )
  },
  install_card: function(obj){

    let spn = h('span'),
    is_installed = spn.cloneNode(false),
    is_version = spn.cloneNode(false);

    is_installed.innerText = obj.installed;
    is_version.innerText = obj.installed_version;

    spn = null;

    return h('div.col-md-6',
      h('div.card.mb-4',
        h('div.card-body',
          h('h5.card-title', obj.title),
          //h('h6.card-subtitle.text-muted', obj.sub),
          h('p','installed: ',
            is_installed
          ),
          h('p','version: ',
            is_version
          ),
          h('p','url: ',
            h('span.cp.lnk-txt', {
              onclick: function(){
                shell.openExternal(obj.src.base)
              }
            }, obj.src.base)
          ),
          h('div.form-group',
            h('textarea.form-control', {
              rows: 6
            })
          ),
          h('div.mt-4',
            h('button.btn.btn-outline-secondary.btn-sm.mr-2.sh-95',{
                type: 'button',
                onclick: function(){
                  let t_area = this.parentNode.previousSibling.lastChild,
                  cnf = {
                    cwd: config.install.path,
                    src: obj.src.base + '.git',
                    path: [config.install.path, obj.src.base.split('/').pop()].join('/'),
                    args: ['install']
                  },
                  $this = this;

                  utils.add_spn($this, 'installing...')

                  t_area.append('git: cloning into '+ cnf.path +'\n')

                  utils.git_clone(cnf, function(err, res){
                    if(err){
                      ce(err);
                      t_area.append('git: '+ err +'\n');
                      utils.remove_spn($this, 'install')
                      return utils.toast('warning', 'installation failed');
                    }
                    t_area.append('git: clone success\n')

                    utils.npm_task(cnf, t_area, function(err, res){
                      if(err){
                        ce(err);
                        utils.remove_spn($this, 'install');
                        return utils.toast('warning', 'installation failed');
                      }
                      fs.readJson(cnf.path + '/package.json', function(err,res){
                        if(err){
                          utils.remove_spn($this, 'install');
                          return utils.toast('warning', 'installation failed');
                        }
                        is_version.innerText = res.version;
                        cnf = {
                          title: obj.title,
                          sel: true,
                          version: res.version
                        }
                        t_area.append('updating config data...\n');
                        utils.update_install(cnf, is_installed, function(err){
                          if(err){
                            utils.remove_spn($this, 'install');
                            return utils.toast('warning', 'installation failed');
                          }
                          t_area.append('config data updated. installation complete.\n')
                          utils.toast('success', 'installation complete');
                          utils.remove_spn($this, 'install');
                        })
                      })

                    })
                  })

                }
            }, 'Install'),
            h('button.btn.btn-outline-secondary.btn-sm.sh-95',{
                type: 'button',
                onclick: function(){
                  let t_area = this.parentNode.previousSibling.lastChild,
                  path = [config.install.path, obj.src.base.split('/').pop()].join('/'),
                  $this = this;

                  utils.add_spn($this, 'removing...');
                  utils.remove(path, function(err){
                    if(err){
                      utils.remove_spn($this, 'remove');
                      return utils.toast('warning', 'removal failed');
                    }
                    let cnf = {
                      title: obj.title,
                      sel: false,
                      version: null
                    }
                    utils.update_install(cnf, is_installed, function(err){
                      if(err){
                        ce(err);
                        utils.remove_spn($this, 'remove');
                        return utils.toast('warning', 'removal failed');
                      }
                      is_version.innerText = null;
                      utils.remove_spn($this, 'remove');
                      return utils.toast('success', 'removal success');
                    })
                  })
                }
            }, 'Remove')
          )
        )
      )
    )
  },
  preprocess_card: function(obj){

    let spn = h('span'),
    is_installed = spn.cloneNode(false),
    is_version = spn.cloneNode(false);

    is_installed.innerText = obj.installed;
    is_version.innerText = obj.version;

    spn = null;

    return h('div.col-md-6',
      h('div.card.mb-4',
        h('div.card-body',
          h('h4.card-title', obj.title, h('span.float-right.fs-38.icon-'+ obj.title)),
          h('h6.card-subtitle.text-muted', obj.description),
          h('p','installed: ',
            is_installed
          ),
          h('p','version: ',
            is_version
          ),
          h('p','url: ',
            h('span.cp.lnk-txt',{
                onclick: function(){
                  let dest = 'https://' + obj.url;
                  utils.toast('info', ['opening', dest, 'in browser'].join(' '));
                  return shell.openExternal(dest)
                }
            }, obj.url)
          ),
          h('div.form-group',
            h('textarea.form-control', {
              rows: 6
            })
          ),
          h('div.mt-4',
            h('button.btn.btn-outline-secondary.btn-sm.mr-2.sh-95',{
                type: 'button',
                onclick: function(){
                  let t_area = this.parentNode.previousSibling.lastChild,
                  cnf = {
                    cwd: config.install.path,
                    path: [config.install.path, 'spartan-cms'].join('/'),
                    args: ['install', '--save', obj.title]
                  },
                  $this = this;

                  utils.add_spn($this, 'installing '+ obj.title +'...')

                  utils.npm_task(cnf, t_area, function(err, res){
                    if(err){
                      ce(err);
                      utils.remove_spn($this, 'install');
                      return utils.toast('warning', 'installation failed');
                    }
                    fs.readJson(cnf.path + '/package.json', function(err,res){
                      if(err){
                        utils.remove_spn($this, 'install');
                        return utils.toast('warning', obj.title +'installation failed');
                      }
                      let ver = res.dependencies[obj.title].replace('^', '')
                      is_version.innerText = ver;
                      cnf = {
                        title: obj.title,
                        sel: true,
                        version: ver
                      }
                      t_area.append('updating config data...\n');
                      utils.update_preprocess(cnf, is_installed, function(err){
                        if(err){
                          utils.remove_spn($this, 'install');
                          return utils.toast('warning', 'installation failed');
                        }

                        t_area.append('config data updated. installation complete.\n')
                        utils.toast('success', obj.title +' installation complete');
                        utils.remove_spn($this, 'install');
                      })
                    })

                  })

                }
            }, 'Install'),
            h('button.btn.btn-outline-secondary.btn-sm.sh-95',{
                type: 'button',
                onclick: function(){
                  let t_area = this.parentNode.previousSibling.lastChild,
                  cnf = {
                    cwd: config.install.path,
                    path: [config.install.path, 'spartan-cms'].join('/'),
                    args: ['uninstall', '--save', obj.title]
                  },
                  $this = this;

                  utils.add_spn($this, 'removing...');
                  utils.npm_task(cnf, t_area, function(err, res){
                    if(err){
                      ce(err);
                      utils.remove_spn($this, 'uninstall');
                      return utils.toast('warning', 'uninstallation failed');
                    }
                    let cnf = {
                      title: obj.title,
                      sel: false,
                      version: null
                    }
                    utils.update_preprocess_status(obj.title, false, function(err, res){
                      if(err){
                        ce(err);
                        utils.remove_spn($this, 'remove');
                        return utils.toast('warning', 'uninstallation failed');
                      }
                      if(res){return utils.toast('warning',  res);}
                      utils.update_preprocess(cnf, is_installed, function(err){
                        if(err){
                          ce(err);
                          utils.remove_spn($this, 'remove');
                          return utils.toast('warning', 'uninstallation failed');
                        }
                        is_version.innerText = null;
                        utils.remove_spn($this, 'remove');
                        return utils.toast('success', obj.title +' uninstallation success');
                      })
                    })

                  })
                }
            }, 'Remove')
          )
        )
      )
    )
  },
  server_card: function(obj){

    let req_spn = h('span.float-right'),
    req_ico = h('span.mr-2'),
    item;

    for (let i = 0; i < obj.requires.length; i++) {
      item = req_ico.cloneNode();
      item.classList.add('icon-'+ obj.requires[i])
      req_spn.append(item);
      item = null;
    }

    req_ico = null;

    return h('div.col-md-6',
      h('div.card.mb-4',
        h('div.card-body',
          h('h5.card-title', obj.title, req_spn),
          h('h6.card-subtitle.text-muted', obj.sub),
          h('p','status: ',
            h('span#'+ obj.server +'_status', 'stopped')
          ),
          h('p','pid: ',
            h('span#'+ obj.server +'_pid', 'null')
          ),
          h('div.mt-4',
            h('button.btn.btn-outline-secondary.btn-sm.mr-2.sh-95.mt-2',{
                type: 'button',
                onclick: function(){
                  let dpid = jp(document.getElementById(obj.server +'_pid').innerText);
                  if(dpid === null){
                    return ipcRenderer.send('start_server', obj.server)
                  }
                  utils.toast('warning', 'server already started')
                }
            }, 'Start server'),
            h('button.btn.btn-outline-secondary.btn-sm.sh-95.mt-2',{
                type: 'button',
                onclick: function(){
                  let dpid = jp(document.getElementById(obj.server +'_pid').innerText);
                  if(dpid !== null){
                    return ipcRenderer.send('stop_server', {type: obj.server, pid: dpid})
                  }
                  utils.toast('warning', 'server not started')
                }
            }, 'Stop server'),
            h('button.btn.btn-outline-secondary.btn-sm.float-right.sh-95.mt-2',{
                type: 'button',
                onclick: function(){

                  let sec = 'https';
                  if(obj.server === 'monitor'){
                    sec = sec.slice(0, -1);
                  }
                  let dest = [sec + config.settings.browser_base_url, obj.port].join(':');
                  utils.toast('info', ['opening', dest, 'in browser'].join(' '));
                  return shell.openExternal(dest)
                }
            }, 'browser view'),
            h('button.btn.btn-outline-secondary.btn-sm.float-right.sh-95.mr-2.mt-2',{
                type: 'button',
                onclick: function(){
                  let sec = true;
                  if(obj.server === 'monitor'){
                    sec = false
                  }
                  ipcRenderer.send('load-win', {secure: sec, port: obj.port})
                }
            }, 'App view')
          )
        )
      )
    )
  },
  css_card: function(obj){

    let monitor_status = h('p','status: ',
      h('span.css_monitor_status', 'stopped')
    ),
    monitor_pid = h('p','pid: ',
      h('span.css_monitor_pid', 'null')
    ),
    start_btn = h('button.btn.btn-outline-secondary.btn-sm.mr-2.sh-95.mt-2',{
        type: 'button',
        onclick: function(){
          let dpid = jp(monitor_pid.lastChild.innerText);
          if(dpid === null){
            return ipcRenderer.send('start_server', 'css_monitor')
          }
          utils.toast('warning', 'monitor already started')
        }
    }, 'Start monitor'),
    stop_btn = h('button.btn.btn-outline-secondary.btn-sm.sh-95.mt-2',{
        type: 'button',
        onclick: function(){
          let dpid = jp(monitor_pid.lastChild.innerText);
          if(dpid !== null){
            return ipcRenderer.send('stop_server', {type: 'css_monitor', pid: dpid})
          }
          utils.toast('warning', 'monitor not started')
        }
    }, 'Stop monitor');


    return h('div.col-md-6',
      h('div.card.mb-4',
        h('div.card-body',
          h('h5.card-title', obj.title, h('small.float-right', obj.version)),
          h('h6.card-subtitle.text-muted', obj.description),
          monitor_status,
          monitor_pid,
          h('div.mt-4',
            start_btn,
            stop_btn,
            function(){
              let is_enabled = 'Disable'
              if(!obj.enabled){
                start_btn.setAttribute('disabled', '');
                stop_btn.setAttribute('disabled', '');
                is_enabled = 'Enable';
              }
              return h('button.btn.btn-outline-secondary.btn-sm.float-right.sh-95.mr-2.mt-2',{
                  type: 'button',
                  onclick: function(evt){
                    if(evt.target.innerText === 'Disable'){
                      utils.update_preprocess_status(obj.title, false, function(err, res){
                        if(err){
                          ce(err);
                          return utils.toast('danger',  obj.title +' disable failed');
                        }
                        if(res){return utils.toast('warning',  res);}
                        start_btn.setAttribute('disabled', '');
                        stop_btn.setAttribute('disabled', '');
                        evt.target.innerText = 'Enable';
                        return utils.toast('success',  obj.title +' disabled');
                      })
                      return;
                    }
                    utils.update_preprocess_status(obj.title, true, function(err, res){
                      if(err){
                        ce(err);
                        return utils.toast('danger',  obj.title +' enable failed');
                      }
                      if(res){return utils.toast('warning',  res);}
                      start_btn.removeAttribute('disabled', '');
                      stop_btn.removeAttribute('disabled', '');
                      evt.target.innerText = 'Disable';
                      return utils.toast('success',  obj.title +' enabled');
                    })
                  }
              }, is_enabled)

            }
          )
        )
      )
    )
  },
  vcheck_card: function(obj){
    return h('div.col-lg-3.col-sm-4.col-12.mb-4',
      h('div.card.sh-95.bg-'+ obj.name,
        h('div.card-body',
          h('span.v-ico.icon-'+ obj.name, {
            title: obj.name
          }),
          h('span.float-right.v-txt', obj.version)
        )
      )
    )
  }
}

module.exports = tpl;
