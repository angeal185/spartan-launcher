const ls = {
  get: function(i){
    return jp(LS.getItem(i))
  },
  set: function(i,e){
    LS.setItem(i, js(e))
    return;
  },
  del: function(i){
    LS.removeItem(i);
  }
}

const ss = {
  get: function(i){
    return jp(SS.getItem(i))
  },
  set: function(i,e){
    SS.setItem(i, js(e))
    return;
  },
  del: function(i){
    SS.removeItem(i);
  }
}

module.exports = { ls, ss }
