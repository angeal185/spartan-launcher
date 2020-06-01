const { ipcRenderer } = require('electron'),
{ ls,ss } = require('./storage'),
h = require('./h');

class side_bar extends HTMLElement {
  constructor(obj) {
    super();
    const $this = this;
    this.classList.add('sb-main', 'sb-'+ obj.side);


    let div = document.createElement('div'),
    sb_toggle = div.cloneNode(false),
    sb_icon = div.cloneNode(false),
    sb_body = div.cloneNode(false),
    sb_head = div.cloneNode(false),
    sb_item;

    sb_toggle.classList.add('sb-toggle', 'sb-'+ obj.side);
    sb_icon.classList.add('sb-icon', 'icon-menu');
    sb_toggle.append(sb_icon);
    sb_toggle.onclick = function(){
      this.parentNode.classList.toggle('sb-show');
    }
    sb_body.classList.add('sb-body');
    sb_head.classList.add('sb-head');
    sb_head.innerText = obj.head.title;
    sb_body.append(sb_head);

    for (let i = 0; i < obj.items.length; i++) {
      sb_item = div.cloneNode(false);
      sb_item.classList.add('sb-link');
      sb_item.innerText = obj.items[i].title;
      sb_item.onclick = function(){

        utils.rout(obj.items[i].dest, function(err){
          if(err){return cl(err)}
          $this.classList.remove('sb-show');
        })

      }
      sb_body.append(sb_item);
    }
    this.append(sb_toggle, sb_body);
    div = null;
    sb_item = null;
    return this;
  }
}

class status_bar extends HTMLElement {
  constructor(obj) {
    super();

    this.classList.add('container-fluid', 'status-bar');

    let online_globe = h('div.globe.mr-2')

    if(navigator.onLine){
      utils.is_online(online_globe);
    } else {
      utils.is_offline(online_globe);
    }

    window.addEventListener('online',  function(){
      utils.is_online(online_globe);
    })

    window.addEventListener('offline',  function(){
      utils.is_offline(online_globe);
    })

    this.append(
      h('div.row',
        h('div.col-6',
          h('div.status-left',

          )
        ),
        h('div.col-6',
          h('div.status-right',
            online_globe
          )
        )
      )
    )
    return this;
  }
}

class nav_bar extends HTMLElement {
  constructor(config) {
    super();

    return h('nav#navbar.navbar.fixed-top.bg-black.mb-4',
      h('div.row.w-100',
        h('div.col-4.text-left',

        ),
        h('div.col-4.text-center',
          h('span',
            h('img.img-fluid.nav-lg', {
              src: config.settings.svg.light
            })
          )
        ),
        h('div.col-4.text-right',
          h('div.icon-resize-full-alt.dd-cog.sh-95', {
              onclick: function(){
                this.parentNode.parentNode.parentNode.nextSibling.nextSibling.classList.remove('active');
                this.parentNode.parentNode.parentNode.nextSibling.classList.toggle('active');
              }
            }
          ),
          h('div.icon-cog-alt.dd-cog.sh-95', {
              onclick: function(){
                this.parentNode.parentNode.parentNode.nextSibling.classList.remove('active');
                this.parentNode.parentNode.parentNode.nextSibling.nextSibling.classList.toggle('active');
              }
            }
          )
        )
      )

    )
  }

}

class bread_crumb extends HTMLElement {
  constructor(config) {
    super();

    let bc_active = h('div.breadcrumb-item.active');
    this.classList.add('container-fluid')
    this.append(
      h('div.breadcrumb',
        h('div.breadcrumb-item', utils.capitalize(config.settings.landing)),
        bc_active
      )
    )

    window.addEventListener("hashchange", function(){
      let dest = '',
      newhash = location.hash.slice(1);
      if(newhash !== config.settings.landing){
        dest += newhash;
      }
      bc_active.innerText = utils.capitalize(dest);
    }, false);

    return this;
  }

}

class to_top extends HTMLElement {
  constructor(i) {
    super(i);
    const $this = this;

    window.addEventListener('scroll', utils.debounce(function(evt){
      let top = window.pageYOffset || document.scrollTop;

      if(top === NaN || !top){
        $this.classList.add('hidden')
      } else if($this.classList.contains('hidden')){
        $this.classList.remove('hidden');
      }
      top = null;
      return;
    }, 250))
    this.classList.add('to-top', 'hidden', 'sh-9');
    this.onclick = function(){
      utils.totop(i);
    }
    this.append(
      h('i.icon-up-open')
    )
    return this;
  }
}

customElements.define('side-bar', side_bar);
customElements.define('status-bar', status_bar);
customElements.define('nav-bar', nav_bar);
customElements.define('bread-crumb', bread_crumb);
customElements.define('to-top', to_top);

module.exports = { side_bar, status_bar, nav_bar, bread_crumb, to_top };
