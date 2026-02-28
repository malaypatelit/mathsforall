(function(){
  function loadMenu(placeholder){
    var path = placeholder.getAttribute('data-menu-path');
    if(!path) return;
    fetch(path).then(function(r){ return r.text(); }).then(function(html){
      placeholder.innerHTML = html;
      adjustLinks(placeholder);
      markCurrentLink(placeholder);
      runInlineScripts(placeholder);
      initOpeners(placeholder);
    }).catch(function(err){
      console.warn('Failed to load menu via fetch, attempting inline fallback:', err);
      // Attempt to use an included inline menu variable if present
      if(window.__INLINE_MENU_HTML){
        placeholder.innerHTML = window.__INLINE_MENU_HTML;
        adjustLinks(placeholder);
        markCurrentLink(placeholder);
        runInlineScripts(placeholder);
        initOpeners(placeholder);
        return;
      }
      // Try to load the inline script dynamically (non-blocking)
      var s = document.createElement('script');
      s.src = path.replace(/partials\/menu.html$/, 'partials/menu-inline.js');
      s.onload = function(){
        if(window.__INLINE_MENU_HTML){
          placeholder.innerHTML = window.__INLINE_MENU_HTML;
          adjustLinks(placeholder);
          markCurrentLink(placeholder);
          runInlineScripts(placeholder);
          initOpeners(placeholder);
        }
      };
      s.onerror = function(){ console.error('Failed to load inline menu fallback script.'); };
      document.head.appendChild(s);
    });
  }
  function adjustLinks(root){
    var anchors = root.querySelectorAll('a[href]');
    anchors.forEach(function(a){
      var h = a.getAttribute('href');
      if(!h) return;
      // Skip absolute URLs, fragments, and root-absolute paths
      if(h.indexOf('http')===0 || h.indexOf('#')===0 || h.indexOf('/')===0) return;
      // Normalize to server-root absolute under /statics/
      // e.g. 'maths/multiplication.html' -> '/statics/maths/multiplication.html'
      a.setAttribute('href', '/statics/' + h);
    });
  }
  function markCurrentLink(root){
    try{
      var anchors = root.querySelectorAll('a[href]');
      var current = location.pathname.split('/').pop() || 'index.html';
      anchors.forEach(function(a){
        var h = a.getAttribute('href');
        var target = h.split('/').pop();
        if(target === current){
          var span = document.createElement('span');
          span.setAttribute('aria-current','page');
          span.className = 'current';
          span.style.color = 'inherit';
          span.style.cursor = 'default';
          span.textContent = a.textContent;
          a.parentNode.replaceChild(span,a);
        }
      });
    }catch(e){console.warn('markCurrentLink error',e)}
  }
  function runInlineScripts(root){
    var scripts = root.querySelectorAll('script');
    scripts.forEach(function(s){
      var ns = document.createElement('script');
      if(s.src){ ns.src = s.src; }
      else { ns.textContent = s.textContent; }
      document.body.appendChild(ns);
      document.body.removeChild(ns);
    });
  }
  function initOpeners(root){
    try{
      var menu = root.querySelector('#menu');
      if(!menu) return;
      var openers = menu.querySelectorAll('.opener');
      openers.forEach(function(op){
        // avoid double-binding
        if(op.__menu_bound) return;
        op.__menu_bound = true;
        op.addEventListener('click', function(ev){
          ev.preventDefault();
          // remove active from other openers
          openers.forEach(function(o){ if(o !== op) o.classList.remove('active'); });
          op.classList.toggle('active');
          // trigger resize so sidebar lock / layout can recalc
          try{ window.dispatchEvent(new Event('resize')); }catch(e){}
        });
      });
    }catch(e){console.warn('initOpeners error',e)}
  }
  document.addEventListener('DOMContentLoaded', function(){
    var placeholders = document.querySelectorAll('[data-menu-path]');
    placeholders.forEach(loadMenu);
  });
})();
