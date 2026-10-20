(function(){
  "use strict";
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Local preview shows authoring placeholders (photo hints, bracketed copy) */
  if(location.protocol === 'file:' || /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname)){
    document.documentElement.classList.add('dev');
  }

  /* Nav scroll state */
  var nav = document.getElementById('nav');
  function onScroll(){ if(window.scrollY > 12){ nav.classList.add('scrolled'); } else { nav.classList.remove('scrolled'); } }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* Mobile menu */
  var burger = document.getElementById('hamburger');
  var links = document.getElementById('navLinks');
  function closeMenu(){ links.classList.remove('open'); burger.setAttribute('aria-expanded','false'); }
  burger.addEventListener('click', function(){
    var open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true':'false');
  });
  links.addEventListener('click', function(e){
    if(e.target.tagName === 'A'){ closeMenu(); }
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && links.classList.contains('open')){ closeMenu(); burger.focus(); }
  });
  document.addEventListener('click', function(e){
    if(links.classList.contains('open') && !nav.contains(e.target)){ closeMenu(); }
  });

  /* Highlight the nav link for the section in view (homepage only) */
  var spyLinks = links.querySelectorAll('a[href^="#"]');
  if(spyLinks.length && 'IntersectionObserver' in window){
    var byId = {};
    spyLinks.forEach(function(a){ byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        var a = byId[en.target.id];
        if(!a){ return; }
        if(en.isIntersecting){
          spyLinks.forEach(function(l){ l.classList.remove('active'); });
          a.classList.add('active');
        } else if(a.classList.contains('active')){
          a.classList.remove('active');
        }
      });
    }, {rootMargin:'-45% 0px -50% 0px'});
    Object.keys(byId).forEach(function(id){
      var sec = document.getElementById(id);
      if(sec){ spy.observe(sec); }
    });
  }

  /* Duplicate ticker content for seamless loop */
  var ticker = document.getElementById('ticker');
  if(ticker){ ticker.innerHTML += ticker.innerHTML; }

  /* Reveal on scroll */
  var reveals = document.querySelectorAll('.reveal');
  if(reduce || !('IntersectionObserver' in window)){
    reveals.forEach(function(el){ el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -40px 0px'});
    reveals.forEach(function(el){ io.observe(el); });
  }

  /* ---- Forms -> Web3Forms ---- */
  /* SETUP: get a free access key at https://web3forms.com — enter your inbox
     email and the key arrives by email. Paste it below (used by both forms).
     Safe to keep in public code. */
  var WEB3FORMS_ACCESS_KEY = '640ca795-4932-4505-8c1e-f373ad97ccc7';

  function wireForm(form, note, buildSubject, onReset){
    if(!form){ return; }
    var submitBtn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(!form.checkValidity()){ form.reportValidity(); return; }

      var data = new FormData(form);
      data.append('access_key', WEB3FORMS_ACCESS_KEY);
      data.append('subject', buildSubject());
      data.append('from_name', 'Copper & Code website');

      if(note){ note.classList.remove('err'); note.textContent = 'Sending…'; }
      if(submitBtn){ submitBtn.disabled = true; }

      fetch('https://api.web3forms.com/submit', { method:'POST', body:data })
        .then(function(r){ return r.json(); })
        .then(function(res){
          if(res && res.success){
            form.reset();
            if(typeof onReset === 'function'){ onReset(); }
            if(note){ note.textContent = form.getAttribute('data-success') || 'Thanks — your message is on its way.'; }
          } else if(note){
            note.classList.add('err');
            note.textContent = 'Something went wrong. Please email contact@copperandcode.net directly.';
          }
        })
        .catch(function(){
          if(note){ note.classList.add('err'); note.textContent = 'Network error. Please email contact@copperandcode.net directly.'; }
        })
        .then(function(){ if(submitBtn){ submitBtn.disabled = false; } });
    });
  }

  /* Project brief form */
  wireForm(
    document.getElementById('briefForm'),
    document.getElementById('formNote'),
    function(){
      var name = (document.getElementById('name').value || '').trim();
      var ptype = (document.getElementById('ptype').value || '').trim();
      return 'New project brief — ' + ptype + ' — ' + name;
    }
  );

  /* Feedback form + star rating */
  var starWrap = document.getElementById('stars');
  var ratingInput = document.getElementById('fb-rating');
  function paintStars(n){
    if(!starWrap){ return; }
    var btns = starWrap.querySelectorAll('.star');
    for(var i=0;i<btns.length;i++){
      btns[i].classList.toggle('on', i < n);
      btns[i].setAttribute('aria-pressed', i === n - 1 ? 'true' : 'false');
    }
  }
  if(starWrap){
    var starBtns = starWrap.querySelectorAll('.star');
    for(var s=0;s<starBtns.length;s++){
      starBtns[s].addEventListener('click', function(){
        var v = parseInt(this.getAttribute('data-v'), 10);
        if(ratingInput){ ratingInput.value = String(v); }
        paintStars(v);
      });
    }
  }
  wireForm(
    document.getElementById('feedbackForm'),
    document.getElementById('fbNote'),
    function(){
      var name = (document.getElementById('fb-name').value || '').trim();
      var stars = (ratingInput && ratingInput.value) ? ratingInput.value + '★ ' : '';
      return 'Client feedback — ' + stars + name;
    },
    function(){ if(ratingInput){ ratingInput.value = ''; } paintStars(0); }
  );

  /* Studio time zones: live local time + DST-correct abbreviation/offset.
     data-tz = IANA zone, data-abbr = "STD" or "STD/DST". */
  var tzEls = document.querySelectorAll('[data-tz]');
  function tzOffset(tz, date){
    var p = {};
    new Intl.DateTimeFormat('en-US', { timeZone:tz, hourCycle:'h23', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' })
      .formatToParts(date).forEach(function(x){ p[x.type] = x.value; });
    var asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
    return Math.round((asUTC - date.getTime()) / 60000);
  }
  function fmtOffset(mins){
    var sign = mins < 0 ? '−' : '+', a = Math.abs(mins), m = a % 60;
    return 'UTC' + sign + Math.floor(a / 60) + (m ? ':' + (m < 10 ? '0' : '') + m : '');
  }
  function paintZones(){
    var now = new Date(), y = now.getUTCFullYear();
    for(var i=0;i<tzEls.length;i++){
      var el = tzEls[i], tz = el.getAttribute('data-tz');
      var names = (el.getAttribute('data-abbr') || '').split('/');
      var off = tzOffset(tz, now);
      var std = Math.min(tzOffset(tz, new Date(Date.UTC(y, 0, 1))), tzOffset(tz, new Date(Date.UTC(y, 6, 1))));
      var abbr = (off > std && names[1]) ? names[1] : names[0];
      var time = new Intl.DateTimeFormat('en-GB', { timeZone:tz, hour:'2-digit', minute:'2-digit' }).format(now);
      el.textContent = time + ' · ' + (abbr ? abbr + ' · ' : '') + fmtOffset(off);
    }
  }
  if(tzEls.length && window.Intl && Intl.DateTimeFormat.prototype.formatToParts){
    try { paintZones(); setInterval(paintZones, 30000); } catch(e){}
  }
})();
