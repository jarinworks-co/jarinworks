(function () {
  // Video tabs
  const tabs = document.querySelectorAll('.tabs button');
  const vcards = document.querySelectorAll('.vcard');
  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => x.setAttribute('aria-selected', x === t));
    vcards.forEach((c) => { c.hidden = c.dataset.cat !== t.dataset.cat; });
  }));

  // Writing filter
  const fbtns = document.querySelectorAll('.filters button');
  const wcards = document.querySelectorAll('.wcard');
  fbtns.forEach((b) => b.addEventListener('click', () => {
    fbtns.forEach((x) => x.setAttribute('aria-pressed', x === b));
    wcards.forEach((c) => { c.hidden = b.dataset.lang !== 'all' && c.dataset.lang !== b.dataset.lang; });
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
  function open(list, t) {
    if (!list.length) return;
    items = list; idx = 0; title = t; lastFocus = document.activeElement;
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

  vcards.forEach((c) => c.addEventListener('click', () => {
    if (c.dataset.embed) open([{ t: 'v', src: c.dataset.embed }], c.dataset.title);
    else if (c.dataset.url) window.open(c.dataset.url, '_blank', 'noopener');
  }));
  document.querySelectorAll('.scard').forEach((c) => c.addEventListener('click', () => {
    let m = []; try { m = JSON.parse(c.dataset.media); } catch (e) {}
    const playable = m.filter((x) => x.t === 'i' || x.src);
    if (playable.length) open(playable, c.dataset.title);
    else { const v = m.find((x) => x.url); if (v) window.open(v.url, '_blank', 'noopener'); }
  }));
})();
