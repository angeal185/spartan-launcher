require('./utils/global');

const utils = require('./utils'),
tpl = require('./utils/tpl'),
{ls,ss} = require('./utils/storage'),
{ ipcRenderer } = require('electron');

utils.login();

ipcRenderer.on('check_server', function(event, arg){
  if(arg.length > 0){
    for (let i = 0; i < arg.length; i++) {
      if(arg[i].type === 'css_monitor'){
        let pid_dest = document.getElementsByClassName('css_monitor_pid'),
        pid_status = document.getElementsByClassName('css_monitor_status');

        for (let x = 0; x < pid_dest.length; x++) {
          pid_dest[x].innerText = arg[i].pid;
          pid_status[x].innerText = 'started';
        }
      } else {
        document.getElementById(arg[i].type+'_pid').innerText = arg[i].pid;
        document.getElementById(arg[i].type+'_status').innerText = 'started';
      }
    }
    utils.toast('success', 'server found');
  }
})

ipcRenderer.on('stop_server', function(event, arg){
  if(arg.type === 'css_monitor'){
    let pid_dest = document.getElementsByClassName('css_monitor_pid'),
    pid_status = document.getElementsByClassName('css_monitor_status');
    for (let x = 0; x < pid_dest.length; x++) {
      pid_dest[x].innerText = 'null';
      pid_status[x].innerText = 'stopped';
    }
  } else {
    document.getElementById(arg.type+'_pid').innerText = 'null';
    document.getElementById(arg.type+'_status').innerText = 'stopped';
  }
  utils.toast('success', 'server stopped');
})

ipcRenderer.on('start_server', function(event, arg){
  if(arg.type === 'css_monitor'){
    let pid_dest = document.getElementsByClassName('css_monitor_pid'),
    pid_status = document.getElementsByClassName('css_monitor_status');
    for (let x = 0; x < pid_dest.length; x++) {
      pid_dest[x].innerText = arg.pid;
      pid_status[x].innerText = 'started';
    }
  } else {
    document.getElementById(arg.type+'_pid').innerText = arg.pid;
    document.getElementById(arg.type+'_status').innerText = 'started';
  }
  utils.toast('success', 'server started')
})

ipcRenderer.on('toast-msg', function(event, arg){
  utils.toast(arg.type, arg.msg)
})
