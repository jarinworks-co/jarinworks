(function () {
  // In-page links: smooth scroll without changing the page URL (also works inside previews)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const t = id ? document.getElementById(id) : document.body;
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (history.replaceState && location.protocol.startsWith('http')) history.replaceState(null, '', '#' + id);
  });
  // Contact button: 1st tap reveals the number in the button; 2nd tap dials (phone) or copies (desktop)
  const canDial = window.matchMedia('(pointer: coarse)').matches;
  const reveal = (a) => { a.classList.add('shown'); const s = a.querySelector('span'); if (s) s.textContent = a.dataset.num; a.setAttribute('aria-label', a.dataset.num); };
  document.querySelectorAll('a.call').forEach((a) => a.addEventListener('click', (e) => {
    if (!a.classList.contains('shown')) { e.preventDefault(); reveal(a); return; }
    if (canDial) return;
    e.preventDefault();
    const s = a.querySelector('span');
    const done = () => { s.textContent = 'Copied ✓'; setTimeout(() => { s.textContent = a.dataset.num; }, 1400); };
    if (navigator.clipboard) navigator.clipboard.writeText(a.dataset.num).then(done, () => {}); 
  }));
  // Email links: on computers open Gmail compose in a new tab (mailto often does nothing without a mail app)
  const gmail = (to) => window.open('https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(to), '_blank', 'noopener');
  // Email button: 1st tap reveals the address; 2nd tap opens Gmail (computer) or the mail app (phone)
  document.querySelectorAll('a.mrev').forEach((a) => a.addEventListener('click', (e) => {
    if (!a.classList.contains('shown')) { e.preventDefault(); reveal(a); return; }
    if (canDial) return;
    e.preventDefault(); gmail(a.dataset.num);
  }));
  if (!canDial) document.querySelectorAll('a[href^="mailto:"]:not(.mrev)').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const to = a.getAttribute('href').slice(7).split('?')[0];
    window.open('https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(to), '_blank', 'noopener');
  }));
  // Side rail: show after the hero scrolls away, hide near the footer
  const rail = document.querySelector('.srail');
  if (rail) { const hero = document.querySelector('.hero'); const foot = document.querySelector('footer');
    const upd = () => { const past = hero ? hero.getBoundingClientRect().bottom < 80 : true; const nearFoot = foot ? foot.getBoundingClientRect().top < innerHeight : false; rail.classList.toggle('on', past && !nearFoot); };
    addEventListener('scroll', upd, { passive: true }); upd(); }
  // Footer call icon: dial on phones; on desktop scroll to Contact and reveal the number
  document.querySelectorAll('a.fcall').forEach((a) => a.addEventListener('click', (e) => {
    if (canDial) return;
    e.preventDefault();
    const b = document.querySelector('#contact a.call') || document.querySelector('a.call');
    if (!b) return;
    b.scrollIntoView({ behavior: 'smooth', block: 'center' });
    reveal(b); b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 1600);
  }));

  // Desktop dropdown
  document.querySelectorAll('.dd').forEach((dd) => {
    const btn = dd.querySelector('.dd-btn');
    btn.addEventListener('click', (e) => { e.stopPropagation(); const o = dd.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
    dd.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { dd.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }));
  });
  document.addEventListener('click', () => document.querySelectorAll('.dd.open').forEach((d) => { d.classList.remove('open'); d.querySelector('.dd-btn').setAttribute('aria-expanded', 'false'); }));

  // Mobile menu
  const mbtn = document.querySelector('.menu-btn');
  const mnav = document.getElementById('mainnav');
  if (mbtn && mnav) {
    mbtn.addEventListener('click', () => { const o = mnav.classList.toggle('open'); mbtn.setAttribute('aria-expanded', o); mbtn.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); });
    mnav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { mnav.classList.remove('open'); mbtn.setAttribute('aria-expanded', 'false'); }));
  }
  const mq = window.matchMedia('(max-width: 640px)');
  const limit = () => (mq.matches ? 2 : 6);
  const pagers = [];
  // Generic "show 6, then View all" for a grid, respecting an optional filter
  function pager(section, itemSel, match) {
    if (!section) return () => {};
    const items = [...section.querySelectorAll(itemSel)];
    const btn = section.querySelector('.more');
    let expanded = false;
    function update() {
      let shown = 0, total = 0;
      items.forEach((el) => {
        const ok = match(el);
        if (!ok) { el.hidden = true; return; }
        total++; shown++;
        el.hidden = !expanded && shown > limit();
      });
      if (btn) {
        btn.hidden = total <= limit();
        btn.textContent = expanded ? 'Show less' : `View all (${total})`;
      }
    }
    if (btn) btn.addEventListener('click', () => {
      expanded = !expanded; update();
      if (!expanded) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    update();
    pagers.push(update);
    return (reset) => { if (reset) expanded = false; update(); };
  }

  // Videos: tabs + pager
  const vSec = document.getElementById('work');
  const tabs = document.querySelectorAll('.tabs button');
  let cat = tabs[0] ? tabs[0].dataset.cat : null;
  const vUpdate = pager(vSec, '.vcard', (el) => !cat || el.dataset.cat === cat);
  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => x.setAttribute('aria-selected', x === t));
    cat = t.dataset.cat; vUpdate(true);
  }));

  (mq.addEventListener ? mq.addEventListener('change', () => pagers.forEach((u) => u())) : mq.addListener(() => pagers.forEach((u) => u())));

  // Speaking: venue tabs + pager
  const sSec = document.getElementById('speaking');
  const stabs = document.querySelectorAll('.stabs button');
  let venue = '0';
  const sUpdate = pager(sSec, '.stile', (el) => el.dataset.venue === venue);
  stabs.forEach((t) => t.addEventListener('click', () => {
    stabs.forEach((x) => x.setAttribute('aria-selected', x === t));
    venue = t.dataset.venue;
    document.querySelectorAll('.sinfo').forEach((p) => { p.hidden = p.dataset.venue !== venue; });
    sUpdate(true);
  }));

  // Writing: language filter + pager
  const fbtns = document.querySelectorAll('.filters button');
  let lang = 'all';
  const wUpdate = pager(document.getElementById('writing'), '.wcard', (el) => lang === 'all' || el.dataset.lang === lang);
  fbtns.forEach((b) => b.addEventListener('click', () => {
    fbtns.forEach((x) => x.setAttribute('aria-pressed', x === b));
    lang = b.dataset.lang; wUpdate(true);
  }));

  // Modal (videos + galleries)
  const modal = document.querySelector('.modal');
  const stage = modal.querySelector('.mstage');
  const cap = modal.querySelector('.mcap');
  const prev = modal.querySelector('.mprev');
  const next = modal.querySelector('.mnext');
  let items = [], idx = 0, title = '', lastFocus = null;

  function render() {
    const m = items[idx];
    stage.innerHTML = '';
    if (m.t === 'v') {
      const f = document.createElement('iframe');
      f.src = m.src; f.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture'; f.allowFullscreen = true; f.title = title;
      stage.appendChild(f);
    } else {
      const i = document.createElement('img'); i.src = m.src; i.alt = title; stage.appendChild(i);
    }
    cap.textContent = items.length > 1 ? `${title} · ${idx + 1} / ${items.length}` : title;
    prev.hidden = next.hidden = items.length < 2;
  }
  function open(list, t, start) {
    if (!list.length) return;
    items = list; idx = start || 0; title = t; lastFocus = document.activeElement;
    modal.classList.add('open'); render(); modal.querySelector('.mclose').focus();
  }
  function close() { modal.classList.remove('open'); stage.innerHTML = ''; if (lastFocus) lastFocus.focus(); }
  prev.onclick = () => { idx = (idx - 1 + items.length) % items.length; render(); };
  next.onclick = () => { idx = (idx + 1) % items.length; render(); };
  modal.querySelector('.mclose').onclick = close;
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') prev.click();
    if (e.key === 'ArrowRight') next.click();
  });

  document.querySelectorAll('.vcard').forEach((c) => c.addEventListener('click', () => {
    if (c.dataset.embed) open([{ t: 'v', src: c.dataset.embed }], c.dataset.title);
    else if (c.dataset.url) window.open(c.dataset.url, '_blank', 'noopener');
  }));
  document.querySelectorAll('.stile:not(.empty)').forEach((c) => c.addEventListener('click', () => {
    let m = []; try { m = JSON.parse(c.dataset.media); } catch (e) {}
    const k = +c.dataset.idx;
    const cur = m[k];
    if (cur && cur.t === 'v' && !cur.src) { window.open(cur.url, '_blank', 'noopener'); return; }
    const list = m.filter((x) => x.t === 'i' || x.src);
    open(list, c.dataset.title, Math.max(0, list.indexOf(list.find((x) => x === cur))));
  }));
})();
