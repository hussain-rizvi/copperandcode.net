(function(){
  "use strict";
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Nav scroll state */
  var nav = document.getElementById('nav');
  function onScroll(){ if(window.scrollY > 12){ nav.classList.add('scrolled'); } else { nav.classList.remove('scrolled'); } }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* Mobile menu */
  var burger = document.getElementById('hamburger');
  var links = document.getElementById('navLinks');
  burger.addEventListener('click', function(){
    var open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true':'false');
  });
  links.addEventListener('click', function(e){
    if(e.target.tagName === 'A'){ links.classList.remove('open'); burger.setAttribute('aria-expanded','false'); }
  });

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

      if(note){ note.textContent = 'Sending…'; }
      if(submitBtn){ submitBtn.disabled = true; }

      fetch('https://api.web3forms.com/submit', { method:'POST', body:data })
        .then(function(r){ return r.json(); })
        .then(function(res){
          if(res && res.success){
            form.reset();
            if(typeof onReset === 'function'){ onReset(); }
            if(note){ note.textContent = form.getAttribute('data-success') || 'Thanks — your message is on its way.'; }
          } else if(note){
            note.textContent = 'Something went wrong. Please email hello@copperandcode.net directly.';
          }
        })
        .catch(function(){
          if(note){ note.textContent = 'Network error. Please email hello@copperandcode.net directly.'; }
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
      if(i < n){ btns[i].classList.add('on'); } else { btns[i].classList.remove('on'); }
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
})();
