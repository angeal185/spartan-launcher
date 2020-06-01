const config = require('../config'),
fs = require('fs'),
h = require('./h'),
{ls,ss} = require('./storage'),
//utils = require('./'),
{ ipcRenderer } = require('electron');

const rout = {
  dashboard: function(main, cb){

    try {
      let v_items = ls.get('vendok'),
      v_items_row = h('div.row'),
      card_row = v_items_row.cloneNode(),
      css_row = v_items_row.cloneNode(),
      os_type = utils.return_platform();

      v_items_row.append(tpl.vcheck_card({name: os_type, version: os_type}));

      if(!v_items ){
        let count = 0;

        for (let i = 0; i < config.vcheck.length; i++) {
          let cdata = config.vcheck_tpl;
          utils.vendcheck(config.vcheck[i], cdata, function(err, res){
            if(err){return cb(err);}
            count++;
            v_items_row.append(tpl.vcheck_card(res));
            if(count === 3){
              ls.set('vendok', true);
            }
          });
        }

      } else {
        v_items = ls.get('vendcheck')
        for (let i = 0; i < v_items.length; i++) {
          v_items_row.append(tpl.vcheck_card(v_items[i]));
        }
      }

      for (let i = 0; i < config.server_arr.length; i++) {
        card_row.append(
          tpl.server_card(config.server_arr[i])
        )
      }

      for (let i = 0; i < config.preprocessors.length; i++) {
        if(config.preprocessors[i].installed){
          card_row.append(
            tpl.css_card(config.preprocessors[i])
          )
        }
      }

      main.append(
        v_items_row,
        h('hr'),
        card_row,
        h('hr'),
        css_row
      );
      ipcRenderer.send('check_server');
      cb(false);
    } catch (err) {
      if(err){
        ce(err)
        return cb(err)
      }
    }


  },
  settings: function(main, cb){

    try {
      let main_row = h('div.row',
        tpl.install_path()
      ),
      css_row = main_row.cloneNode(false);

      for (let i = 0; i < config.install.status.length; i++) {
        main_row.append(
          tpl.install_card(config.install.status[i])
        )
      }

      for (let i = 0; i < config.preprocessors.length; i++) {
        css_row.append(
          tpl.preprocess_card(config.preprocessors[i])
        )
      }

      main.append(
        h('div.container-fluid',
          h('h3', 'Installation'),
          main_row,
          h('hr'),
          h('h3', 'CSS Preprocessor'),
          css_row,
          h('hr')
        )
      )
      cb(false);
    } catch (err) {
      if(err){return cb(err)}
    }
  },
  install: function(main, cb){
    try {
      let main_row = h('div.row', 'install working');

      main.append(main_row)
      cb(false);
    } catch (err) {
      if(err){return cb(err)}
    }
  }
}

module.exports = rout;
