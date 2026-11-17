// Builds dist/index.html from content/*.json. No dependencies. Run: node build.js
const fs = require('fs');
const path = require('path');

const C = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, 'content', f + '.json'), 'utf8'));
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const list = (a) => (Array.isArray(a) ? a : []);
const has = (s) => typeof s === 'string' && s.trim() !== '';

const p = C('profile'), companies = C('companies'), metrics = C('metrics'), award = C('award'),
  videos = C('videos'), proc = C('process'), speak = C('speaking'), journey = C('journey'),
  writing = C('writing'), caps = C('capabilities'), certs = C('certifications');

const L = {
  award: has(award.menu_label) ? award.menu_label : 'Award',
  work: has(videos.menu_label) ? videos.menu_label : 'Featured work',
  speaking: has(speak.menu_label) ? speak.menu_label : 'Speaking & workshops',
  writing: has(writing.menu_label) ? writing.menu_label : 'Writing',
  process: has(proc.menu_label) ? proc.menu_label : 'How I work',
  journey: has(journey.menu_label) ? journey.menu_label : 'Journey',
  caps: has(caps.menu_label) ? caps.menu_label : 'Capabilities',
  toolkit: has(caps.toolkit_label) ? caps.toolkit_label : 'Toolkit',
  certs: has(certs.menu_label) ? certs.menu_label : 'Certifications',
  contact: has(p.contact_label) ? p.contact_label : 'Contact',
};
const CATS = ['AI Content', 'Talking Head', 'Directional', 'Online Content', 'Voice Over', 'Documentary'];

// ---- video URL helpers ----
function ytId(u) {
  const m = String(u).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/);
  return m ? m[1] : null;
}
function embed(u) {
  if (!has(u)) return '';
  const y = ytId(u);
  if (y) return `https://www.youtube.com/embed/${y}?autoplay=1&rel=0`;
  if (/facebook\.com|fb\.watch/.test(u)) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&show_text=false&autoplay=true`;
  const d = String(u).match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (d) return `https://drive.google.com/file/d/${d[1]}/preview`;
  const v = String(u).match(/vimeo\.com\/(\d+)/);
  if (v) return `https://player.vimeo.com/video/${v[1]}?autoplay=1`;
  return '';
}
function autoThumb(u) { const y = ytId(u || ''); return y ? `https://i.ytimg.com/vi/${y}/hqdefault.jpg` : ''; }

const ICON = {
  play: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M8 5l12 7-12 7z"/></svg>',
  trophy: (s = 30) => `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 01-8 0z"/><path d="M16 5h3v1.5A3.5 3.5 0 0115.6 10"/><path d="M8 5H5v1.5A3.5 3.5 0 008.4 10"/><path d="M12 13v4"/><path d="M8.5 20h7l-1-3h-5z"/></svg>`,
  medal: '<svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/><path d="M9.5 9l1.8 1.8L14.8 7.5"/></svg>',
  cam: '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  person: '<svg aria-hidden="true" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#9F958A" stroke-width="1.2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>',
  caps: [
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
    '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><path d="M16 4.6a3.5 3.5 0 010 6.8"/><path d="M18.5 13.8c1.8.9 3 2.7 3 4.9"/>',
  ],
};
const capIcon = (i) => `<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICON.caps[i % 3]}</svg>`;
const img = (src, alt = '', cls = 'cover') => `<img class="${cls}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" onerror="this.remove()">`;

// ---- sections ----
const foot = fs.existsSync(path.join(__dirname, 'content', 'footer.json')) ? C('footer') : {};
// normalise footer social URLs (plain email -> mailto, plain number -> tel)
const normUrl = (u) => { u = String(u || '').trim(); if (!u) return ''; if (/^(mailto:|tel:|https?:)/i.test(u)) return u; if (/^[^\s@]+@[^\s@]+$/.test(u)) return 'mailto:' + u; if (/^[+\d][\d\s()-]{5,}$/.test(u)) return 'tel:' + u.replace(/[^+\d]/g, ''); if (/^(www\.|[a-z0-9-]+\.[a-z]{2,})/i.test(u)) return 'https://' + u; return u; };
const socials = list(foot.socials).map((s) => ({ label: s.label || '', url: normUrl(s.url) })).filter((s) => s.url);
const sTel = socials.find((s) => /^tel:/i.test(s.url));
const phone = has(p.phone) ? p.phone.trim() : (sTel ? sTel.url.slice(4) : '');
const phonePretty = (() => { const d = phone.replace(/[^\d+]/g, ''); const m = d.match(/^(?:\+?880|0)(1\d{3})(\d{6})$/); return m ? `+880 ${m[1]}-${m[2]}` : phone; })();
const telHref = phone ? 'tel:' + phone.replace(/[^+\d]/g, '') : '';
const PHONE_ICON = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/></svg>';
const SI_MAIL = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>';
const BT = { work: has(p.btn_work) ? p.btn_work : 'View my work', contact: has(p.btn_contact) ? p.btn_contact : 'Contact', email: has(p.btn_email) ? p.btn_email : 'Email', cv: has(p.btn_cv) ? p.btn_cv : 'Download CV (PDF)', headcv: has(p.btn_header_cv) ? p.btn_header_cv : 'Download CV', find: has(p.find_label) ? p.find_label : 'Find me on' };
const cvHref = has(p.cv_file) ? esc(p.cv_file) : '#contact';
const awardOn = award.show !== false;

const logoItems = list(companies.items).filter((c) => has(c.logo));
const logoSet = (() => { if (!logoItems.length) return ''; let a = []; while (a.length < 10) a = a.concat(logoItems); return a.map((c) => `<img src="${esc(c.logo)}" alt="${esc(c.name || 'Company logo')}" loading="lazy">`).join(''); })();
const logoStrip = logoItems.length ? `<div class="companies" aria-label="Companies worked with"><div class="lbl"><b>${esc(companies.label || "Where I've worked")}</b>${has(companies.sublabel) ? `<span>${esc(companies.sublabel)}</span>` : ''}</div><div class="lwrap"><div class="ltrack">${logoSet}<span aria-hidden="true" style="display:contents">${logoSet}</span></div></div></div>` : '';
const heroTpl = () => `
<header class="top">
  <a class="logo" href="#top">${has(p.logo) ? `<img src="${esc(p.logo)}" alt="${esc(p.name)}">` : esc(p.name)}</a>
  <a class="head-cv" href="${cvHref}" ${has(p.cv_file) ? 'download' : ''}>CV</a>
  <button class="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mainnav"><span></span></button>
  <nav class="nav" id="mainnav" aria-label="Main">
    ${headNav}
    <a class="cv" href="${cvHref}" ${has(p.cv_file) ? 'download' : ''}>${esc(BT.headcv)}</a>
  </nav>
</header>
<section id="top" class="hero">
  <div class="hero-txt">
    ${awardOn && has(p.award_badge) ? `<a class="badge" href="#award"><i>${ICON.trophy(12)}</i>${esc(p.award_badge)}</a>` : ''}
    <p class="eyebrow">${esc(p.label)}</p>
    <h1>${esc(p.headline)}</h1>
    <p class="sum">${esc(p.summary)}</p>
    <div class="btns">
      <a class="btn btn-dark" href="${awardOn ? '#award' : '#work'}">${esc(BT.work)}</a>
      ${phone ? `<a class="btn btn-line btn-ico call" href="${telHref}" data-num="${esc(phonePretty)}" aria-label="Show ${esc(p.name)}'s phone number">${PHONE_ICON}<span>${esc(BT.contact)}</span></a>` : `<a class="btn btn-line" href="#contact">${esc(L.contact)}</a>`}
    </div>
    ${heroSoc}
  </div>
  <div class="portrait ${p.headshot_cutout === false ? 'full' : 'cutout'}">
    <span class="dia-line" aria-hidden="true"></span>
    <span class="dia" aria-hidden="true"></span>
    ${has(p.headshot) ? `<img class="person" src="${esc(p.headshot)}" alt="${esc(p.name)}" onerror="this.remove()">` : `<span class="person ph-person">${ICON.person}</span>`}
  </div>
</section>
${logoStrip}`;

const mItems = list(metrics.items).filter((m) => has(m.value) || has(m.label));
const mTile = (m) => `<div class="tile"><b>${esc(m.value)}</b><span>${esc(m.label)}</span></div>`;
const mSet = (() => { if (!mItems.length) return ''; let a = []; while (a.length < 8) a = a.concat(mItems); return a.map(mTile).join(''); })();
const metricsS = mItems.length ? `
<section class="metrics bleed" aria-label="Impact">
  <ul class="sr-only">${mItems.map((m) => `<li>${esc(m.value)} ${esc(m.label)}</li>`).join('')}</ul>
  <div class="mwrap" aria-hidden="true"><div class="mtrack2">${mSet}${mSet}</div></div>
</section>` : '';

const awardS = awardOn ? `
<section id="award" aria-label="Award" style="padding:4.5rem 0"><div class="award-card">
  <div class="award-txt">
    <div class="seal"><i>${ICON.trophy()}</i><div><b>${esc(award.label)}</b><small>${esc(award.category)}</small></div></div>
    <h2>${esc(award.title_bn)}</h2>
    ${has(award.title_en) ? `<p>${esc(award.title_en)}</p>` : ''}
  </div>
  <div class="award-photo"><div class="frame">${has(award.photo) ? `<div>${img(award.photo, award.label)}</div>` : '<div class="ph">Award photo</div>'}</div></div>
</div></section>` : '';

const vItems = list(videos.items).filter((v) => has(v.title));
const usedCats = CATS.filter((c) => vItems.some((v) => v.category === c));
const videosS = vItems.length ? `
<section id="work" class="videos bleed">
  <div class="head"><p class="eyebrow">${esc(L.work)}</p><h2 class="h2">${esc(videos.heading)}</h2></div>
  <div class="tabs" role="tablist">${usedCats.map((c, i) => `<button role="tab" aria-selected="${i === 0}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>
  <div class="vgrid">
  ${vItems.map((v) => {
    const th = has(v.thumbnail) ? v.thumbnail : autoThumb(v.url);
    return `<button class="vcard" data-cat="${esc(v.category)}" data-embed="${esc(embed(v.url))}" data-url="${esc(v.url)}" data-title="${esc(v.title)}" ${v.category === usedCats[0] ? '' : 'hidden'}>
      <span class="thumb">${has(th) ? img(th, v.title) : ''}<span class="pill">${esc(v.category)}</span><span class="play">${ICON.play}</span></span>
      <strong>${esc(v.title)}</strong><small>${esc(v.brand)}</small></button>`;
  }).join('\n')}
  </div>
  <div class="more-wrap"><button class="more" type="button" hidden>View all</button></div>
</section>` : '';

const steps = list(proc.steps);
const processS = steps.length ? `
<section id="process">
  <div class="head"><p class="eyebrow">${esc(L.process)}</p><h2 class="h2">${esc(proc.heading)}</h2></div>
  <div class="road"><div class="road-in" style="--n:${steps.length}">
    <div class="track" aria-hidden="true"></div>
    ${steps.map((s, i) => {
      const col = `grid-column:${i + 1}`;
      return `<div class="step ${i % 2 ? 'down' : 'up'}" style="${col}"><strong>${esc(s.title)}</strong><span>${esc(s.description)}</span>${has(s.deliverable) ? `<span class="pill">${esc(s.deliverable)}</span>` : ''}</div>
      <div class="node ${i % 2 ? 'alt' : ''}" style="${col}"><b>${String(i + 1).padStart(2, '0')}</b></div>`;
    }).join('')}
    <div class="end" style="grid-column:${steps.length + 1}"><span>Impact →</span></div>
  </div></div>
</section>` : '';

const sItems = list(speak.items).filter((s) => has(s.venue));
const speakS = sItems.length ? `
<section id="speaking" class="speaking">
  <div class="head fit"><p class="eyebrow">${esc(L.speaking)}</p><h2 class="h2">${esc(speak.heading)}</h2>${has(speak.intro) ? `<p class="lead">${esc(speak.intro)}</p>` : ''}</div>
  <div class="tabs stabs" role="tablist">${sItems.map((s, i) => `<button role="tab" aria-selected="${i === 0}" data-venue="${i}">${esc(s.venue)}</button>`).join('')}</div>
  <div class="sgrid">
  ${sItems.map((s, i) => {
    const photos = list(s.photos).map((x) => (typeof x === 'string' ? x : x && x.image)).filter(has);
    const media = [];
    const vids = list(s.videos).filter((v) => v && has(v.url));
    if (has(s.video_url) && !vids.some((v) => v.url === s.video_url)) vids.unshift({ url: s.video_url });
    vids.forEach((v) => media.push({ t: 'v', src: embed(v.url), url: v.url, th: has(v.thumbnail) ? v.thumbnail : autoThumb(v.url) }));
    photos.forEach((ph) => media.push({ t: 'i', src: ph }));
    const data = esc(JSON.stringify(media.map(({ t, src, url }) => ({ t, src, url }))));
    if (!media.length) return `<div class="stile empty" data-venue="${i}" ${i ? 'hidden' : ''}><span class="ph" style="position:absolute;inset:0">Photos coming soon</span></div>`;
    return media.map((m, k) => `<button class="stile ${m.t === 'v' ? 'vid' : ''}" data-venue="${i}" data-idx="${k}" data-media="${data}" data-title="${esc(s.venue)}" aria-label="${esc(s.venue)} ${m.t === 'v' ? 'video' : 'photo'} ${k + 1}" ${i ? 'hidden' : ''}>
      ${m.t === 'v' ? `${has(m.th) ? img(m.th, s.venue) : ''}<span class="chips"><span class="v">${ICON.play.replace(/26/g, '12')}Video</span></span><span class="play">${ICON.play}</span>` : img(m.src, s.venue)}</button>`).join('');
  }).join('\n')}
  </div>
  <div class="more-wrap"><button class="more" type="button" hidden>View all</button></div>
  <p class="note">Tap a photo or video to view it full screen.</p>
</section>` : '';

const journeyS = list(journey.items).length ? `
<section id="journey" class="journey bleed"><div class="jgrid">
  <div class="head" style="margin:0"><p class="eyebrow">${esc(L.journey)}</p><h2 class="h2">${esc(journey.heading)}</h2><p class="lead">${esc(journey.intro)}</p></div>
  <ol class="jlist">${list(journey.items).map((j) => {
    const hl = list(j.highlights).map((h) => (typeof h === 'string' ? h : h && h.point)).filter(has);
    if (!hl.length && has(j.result)) hl.push(j.result);
    return `<li><time>${esc(j.years)}</time><div><strong>${esc(j.title)}</strong>${has(j.company) ? `<span class="jco">${esc(j.company)}</span>` : ''}${hl.length ? `<ul class="jhl">${hl.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}</div></li>`;
  }).join('')}</ol>
</div></section>` : '';

const wItems = list(writing.items).filter((w) => has(w.title));
const writingS = wItems.length ? `
<section id="writing" class="writing bleed">
  <div class="head-row"><div class="head" style="margin:0"><p class="eyebrow">${esc(L.writing)}</p><h2 class="h2">${esc(writing.heading)}</h2></div>
    <div class="filters"><button aria-pressed="true" data-lang="all">All</button><button aria-pressed="false" data-lang="English">English</button><button aria-pressed="false" data-lang="Bangla">বাংলা</button></div></div>
  <div class="wgrid">${wItems.map((w, i) => `<a class="wcard" data-lang="${esc(w.language)}" href="${has(w.url) ? esc(w.url) : '#writing'}" ${has(w.url) ? 'target="_blank" rel="noopener"' : ''}>
    <div class="img ${has(w.thumbnail) ? '' : 'ph'}" style="${has(w.thumbnail) ? '' : `background:${['#E0D9D3', '#EAE4DE', '#F5F2EF'][i % 3]}`}">${has(w.thumbnail) ? img(w.thumbnail, w.title) : 'Thumbnail'}</div>
    <div class="b"><small>${esc([w.publication, w.type].filter(has).join(' · '))}</small><strong>${esc(w.title)}</strong><em>Read →</em></div></a>`).join('')}</div>
  <div class="more-wrap"><button class="more" type="button" hidden>View all</button></div>
</section>` : '';

const tools = list(caps.tools).filter((t) => has(t.name));
const AUTO = { semrush: 'SEO', ahrefs: 'SEO', yoast: 'SEO', 'google search console': 'SEO', illustrator: 'Design', photoshop: 'Design', canva: 'Design', figma: 'Design', mailchimp: 'Marketing', hubspot: 'Marketing', 'meta business suite': 'Marketing', 'google analytics': 'Analytics', wordpress: 'Content & CMS', chatgpt: 'AI', claude: 'AI', midjourney: 'AI', gemini: 'AI' };
const groups = [];
tools.forEach((t) => {
  const cat = has(t.category) ? t.category : (AUTO[t.name.trim().toLowerCase()] || 'Other');
  let g = groups.find((x) => x.cat === cat);
  if (!g) groups.push((g = { cat, items: [] }));
  g.items.push(t);
});
const toolHtml = groups.map((g) => `<div class="tgroup"><h4>${esc(g.cat)}</h4><div class="tlist">${g.items.map((t) => `<span class="tool">${has(t.logo) ? `<img src="${esc(t.logo)}" alt="" loading="lazy" onerror="this.remove()">` : ''}${esc(t.name)}</span>`).join('')}</div></div>`).join('');
const capsS = `
<section id="capabilities" class="caps bleed" aria-label="Capabilities">
  <div class="head"><p class="eyebrow">${esc(L.caps)}</p><h2 class="h2">${esc(caps.heading)}</h2></div>
  <div class="cgrid">${list(caps.cards).map((c, i) => `<div class="ccard"><span class="num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><i>${capIcon(i)}</i><div><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p></div><div class="skills">${list(c.skills).map((s) => `<span>${esc(typeof s === 'string' ? s : s.skill)}</span>`).join('')}</div></div>`).join('')}</div>
  ${tools.length ? `<div class="toolkit" id="toolkit"><h3>${esc(L.toolkit)} ${has(caps.toolkit_subtitle) ? `<small>${esc(caps.toolkit_subtitle)}</small>` : (caps.toolkit_subtitle === '' ? '' : '<small>Tools I use every day</small>')}</h3><div class="tgrid">${toolHtml}</div></div>` : ''}
</section>`;

const certsS = list(certs.items).length ? `
<section id="certifications" aria-label="Certifications" style="padding:4rem 0 1rem"><div class="cert-wrap">
  <div class="head-row"><div class="head" style="margin:0"><p class="eyebrow">${esc(L.certs)}</p><h2 class="h2">${esc(certs.heading)}</h2></div>${has(certs.badge) ? `<span class="cert-badge">${esc(certs.badge)}</span>` : ''}</div>
  <div class="cgrid2">${list(certs.items).map((c) => `<div class="cert"><div>${has(c.logo) ? `<img class="logo" src="${esc(c.logo)}" alt="">` : `<i>${ICON.medal}</i>`}<small>${esc(c.issuer)}</small><strong>${esc(c.title)}</strong>${has(c.url) ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">View credential →</a>` : ''}</div></div>`).join('')}</div>
</div></section>` : '';

const contactS = `
<section id="contact" class="contact">
  <h2>${esc(p.contact_heading)}</h2>
  <div class="btns"><a class="btn btn-w" href="${cvHref}" ${has(p.cv_file) ? 'download' : ''}>${esc(BT.cv)}</a>${has(p.email) ? `<a class="btn btn-o btn-ico mrev" href="mailto:${esc(p.email.trim())}" data-num="${esc(p.email.trim())}" aria-label="Show ${esc(p.name)}'s email">${SI_MAIL}<span>${esc(BT.email)}</span></a>` : ''}${phone ? `<a class="btn btn-o btn-ico call" href="${telHref}" data-num="${esc(phonePretty)}" aria-label="Show ${esc(p.name)}'s phone number">${PHONE_ICON}<span>Contact</span></a>` : ''}</div>
</section>
`;
const fcol = (title, links) => { const l = links.filter((n) => n[2]); return l.length ? `<nav class="fcol" aria-label="${esc(title)}"><h3>${esc(title)}</h3>${l.map((n) => `<a href="${n[0]}">${esc(n[1])}</a>`).join('')}</nav>` : ''; };
const workLabel = has(p.work_menu_label) ? p.work_menu_label : 'My work';
const workLinks = [['#work', L.work, vItems.length], ['#speaking', L.speaking, sItems.length], ['#writing', L.writing, wItems.length]];
const waNum = (() => { let n = (has(p.whatsapp) ? p.whatsapp : phone).replace(/[^\d]/g, ''); if (/^0\d{10}$/.test(n)) n = '880' + n.slice(1); return n; })(); // BD local 01… -> 880…
const SV = (d, fill) => `<svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" ${fill ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'}>${d}</svg>`;
const SI = {
  linkedin: SV('<path d="M4.98 3.5a2.5 2.5 0 11-.01 5 2.5 2.5 0 01.01-5zM3 9h4v12H3zM9 9h3.8v1.7h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21H9z"/>', 1),
  whatsapp: SV('<path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.2-.2-.5-.3z"/>', 1),
  email: SV('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
  phone: SV('<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/>'),
  facebook: SV('<path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v7h4v-7H16l.5-4h-3V9c0-.6.4-1 1-1z"/>', 1),
  youtube: SV('<path d="M22 8.2a3 3 0 00-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 002 8.2 31 31 0 001.6 12 31 31 0 002 15.8a3 3 0 002.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 002.1-2.1 31 31 0 00.4-3.8 31 31 0 00-.4-3.8zM10 15V9l5.2 3z"/>', 1),
  instagram: SV('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>'),
  x: SV('<path d="M17.8 3h3.3l-7.2 8.2L22.4 21h-6.6l-5.2-6.8L4.7 21H1.4l7.7-8.8L1 3h6.8l4.7 6.2zm-1.2 16h1.8L7.5 4.9H5.5z"/>', 1),
  link: SV('<path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7"/>'),
};
const kind = (u) => /^mailto:/i.test(u) ? 'email' : /^tel:/i.test(u) ? 'phone' : /linkedin\./i.test(u) ? 'linkedin' : /(wa\.me|whatsapp\.)/i.test(u) ? 'whatsapp' : /(facebook\.|fb\.)/i.test(u) ? 'facebook' : /(youtube\.|youtu\.be)/i.test(u) ? 'youtube' : /instagram\./i.test(u) ? 'instagram' : /(twitter\.|x\.com)/i.test(u) ? 'x' : 'link';
// one icon per type: profile fields first, then footer socials
const iconLinks = [];
const iconData = {};
const seen = new Set();
const addIcon = (url, label) => { if (!url) return; const k = kind(url); if (k !== 'link' && seen.has(k)) return; seen.add(k); if (!iconData[k]) iconData[k] = { url, label }; const ext = /^https?:/i.test(url); iconLinks.push(`<a ${k === 'phone' ? 'class="fcall" ' : ''}href="${esc(url)}"${ext ? ' target="_blank" rel="noopener"' : ''} aria-label="${esc(label || k)}" title="${esc(label || k)}">${SI[k]}</a>`); };
if (has(p.linkedin)) addIcon(normUrl(p.linkedin), 'LinkedIn');
socials.filter((s) => kind(s.url) === 'linkedin').forEach((s) => addIcon(s.url, s.label));
if (waNum) addIcon('https://wa.me/' + waNum, 'WhatsApp');
if (has(p.email)) addIcon('mailto:' + p.email.trim(), 'Email');
if (phone) addIcon(telHref, 'Call');
socials.forEach((s) => addIcon(s.url, s.label));
const HERO_NAMES = { linkedin: 'LinkedIn', email: 'Email', whatsapp: 'WhatsApp' };
const heroIcons = ['linkedin', 'email', 'whatsapp'].filter((k) => iconData[k]).map((k) => { const u = iconData[k].url; const ext = /^https?:/i.test(u); return `<a href="${esc(u)}"${ext ? ' target="_blank" rel="noopener"' : ''} aria-label="${HERO_NAMES[k]}" title="${HERO_NAMES[k]}">${SI[k]}</a>`; }).join('');
const heroSoc = heroIcons ? `<div class="hsoc"><span>${esc(BT.find)}</span>${heroIcons}</div>` : '';
const rail = heroIcons ? `<aside class="srail" aria-label="Social links">${heroIcons}<i aria-hidden="true"></i></aside>` : '';
const fsocial = iconLinks.length ? `<div class="fsocial">${iconLinks.join('')}</div>` : '';
const footerS = `
<footer class="foot bleed">
  <div class="fgrid">
    <div class="fbrand">
      <a class="flogo" href="#top">${has(p.logo_light) ? `<img src="${esc(p.logo_light)}" alt="${esc(p.name)}">` : esc(p.name)}</a>
      ${has(foot.tagline) ? `<p>${esc(foot.tagline)}</p>` : ''}
      ${fsocial}
    </div>
    ${fcol(workLabel, workLinks)}
    ${fcol('Explore', [['#journey', L.journey, list(journey.items).length], ['#process', L.process, steps.length], ['#contact', L.contact, 1]])}
    ${fcol('More', [['#award', L.award, awardOn ? 1 : 0], ['#capabilities', L.caps, list(caps.cards).length], ['#toolkit', L.toolkit, tools.length], ['#certifications', L.certs, list(certs.items).length]])}
  </div>
  <div class="fbar"><span>© ${new Date().getFullYear()} ${esc(p.name)}</span>${foot.show_back_to_top !== false ? '<a href="#top">Back to top ↑</a>' : ''}</div>
</footer>`;

const workLinksH = workLinks.filter((n) => n[2]);
const ddIcon = '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const headNav = (workLinksH.length ? `<div class="dd"><button class="dd-btn" type="button" aria-expanded="false" aria-haspopup="true">${esc(workLabel)}${ddIcon}</button><div class="dd-menu">${workLinksH.map((n) => `<a href="${n[0]}">${esc(n[1])}</a>`).join('')}</div></div>` : '')
  + [['#journey', L.journey, list(journey.items).length], ['#process', L.process, steps.length], ['#certifications', L.certs, list(certs.items).length], ['#contact', L.contact, 1]].filter((n) => n[2]).map((n) => `<a href="${n[0]}">${esc(n[1])}</a>`).join('');
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.name)} — ${esc(p.label)}</title>
<meta name="description" content="${esc(p.seo_description)}">
<meta property="og:title" content="${esc(p.name)} — ${esc(p.label)}">
<meta property="og:description" content="${esc(p.seo_description)}">
${has(p.headshot) ? `<meta property="og:image" content="${esc(p.headshot)}">` : ''}
${has(p.favicon) ? `<link rel="icon" href="${esc(p.favicon)}">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/assets/style.css">
</head>
<body>
${rail}
<div class="wrap">
${heroTpl()}
${metricsS}
${awardS}
${videosS}
${speakS}
${writingS}
${processS}
${journeyS}
${capsS}
${certsS}
${contactS}
${footerS}
</div>
<div class="modal" role="dialog" aria-modal="true" aria-label="Media viewer"><div class="mbox">
  <button class="mclose" aria-label="Close">×</button><button class="mprev" aria-label="Previous">‹</button><button class="mnext" aria-label="Next">›</button>
  <div class="mstage"></div><p class="mcap"></p>
</div></div>
<script src="/assets/site.js"></script>
</body>
</html>`;

// ---- output ----
const out = path.join(__dirname, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
for (const d of ['assets', 'admin', 'images']) if (fs.existsSync(path.join(__dirname, d))) fs.cpSync(path.join(__dirname, d), path.join(out, d), { recursive: true });
console.log('Built dist/index.html (' + html.length + ' bytes)');
