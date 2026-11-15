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
const img = (src, alt = '', cls = 'cover') => `<img class="${cls}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy">`;

// ---- sections ----
const cvHref = has(p.cv_file) ? esc(p.cv_file) : '#contact';
const awardOn = award.show !== false;

const hero = `
<header class="top">
  <a class="logo" href="#top">${esc(p.name)}</a>
  <nav class="nav" aria-label="Main">
    <a href="#work">Videos</a><a href="#speaking">Speaking</a><a href="#journey">Journey</a><a href="#writing">Writing</a><a href="#contact">Contact</a>
    <a class="cv" href="${cvHref}" ${has(p.cv_file) ? 'download' : ''}>Download CV</a>
  </nav>
</header>
<section id="top" class="hero">
  <div class="hero-txt">
    ${awardOn && has(p.award_badge) ? `<a class="badge" href="#award"><i>${ICON.trophy(12)}</i>${esc(p.award_badge)}</a>` : ''}
    <p class="eyebrow">${esc(p.label)}</p>
    <h1>${esc(p.headline)}</h1>
    <p class="sum">${esc(p.summary)}</p>
    <div class="btns">
      <a class="btn btn-dark" href="#work">View my work</a>
      <a class="btn btn-line" href="${cvHref}" ${has(p.cv_file) ? 'download' : ''}>Download CV</a>
    </div>
  </div>
  <div class="shot ${has(p.headshot) ? '' : 'ph'}">${has(p.headshot) ? img(p.headshot, p.name) : ICON.person}</div>
</section>
${list(companies.items).length ? `<div class="companies" aria-label="Companies"><small>Worked with</small>${list(companies.items).map((c) => has(c.logo) ? `<img src="${esc(c.logo)}" alt="${esc(c.name)}" loading="lazy">` : `<span>${esc(c.name)}</span>`).join('')}</div>` : ''}`;

const metricsS = list(metrics.items).length ? `
<section class="metrics bleed" aria-label="Impact"><div class="tiles">
${list(metrics.items).map((m) => `<div class="tile"><b>${esc(m.value)}</b><span>${esc(m.label)}</span></div>`).join('')}
</div></section>` : '';

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
  <div class="head"><p class="eyebrow">Featured work</p><h2 class="h2">${esc(videos.heading)}</h2></div>
  <div class="tabs" role="tablist">${usedCats.map((c, i) => `<button role="tab" aria-selected="${i === 0}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>
  <div class="vgrid">
  ${vItems.map((v) => {
    const th = has(v.thumbnail) ? v.thumbnail : autoThumb(v.url);
    return `<button class="vcard" data-cat="${esc(v.category)}" data-embed="${esc(embed(v.url))}" data-url="${esc(v.url)}" data-title="${esc(v.title)}" ${v.category === usedCats[0] ? '' : 'hidden'}>
      <span class="thumb">${has(th) ? img(th, v.title) : ''}<span class="pill">${esc(v.category)}</span><span class="play">${ICON.play}</span></span>
      <strong>${esc(v.title)}</strong><small>${esc(v.brand)}</small></button>`;
  }).join('\n')}
  </div>
</section>` : '';

const steps = list(proc.steps);
const processS = steps.length ? `
<section id="process">
  <div class="head"><p class="eyebrow">How I work</p><h2 class="h2">${esc(proc.heading)}</h2></div>
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
<section id="speaking" class="speaking bleed">
  <div class="head-row"><div class="head" style="margin:0"><p class="eyebrow">Speaking &amp; workshops</p><h2 class="h2">${esc(speak.heading)}</h2></div><p class="lead">${esc(speak.intro)}</p></div>
  <div class="sgrid">
  ${sItems.map((s) => {
    const photos = list(s.photos).map((x) => (typeof x === 'string' ? x : x && x.image)).filter(has);
    const media = [];
    if (has(s.video_url)) media.push({ t: 'v', src: embed(s.video_url), url: s.video_url });
    photos.forEach((ph) => media.push({ t: 'i', src: ph }));
    const cover = photos[0] || autoThumb(s.video_url);
    const vid = has(s.video_url);
    return `<button class="scard" data-media="${esc(JSON.stringify(media))}" data-title="${esc(s.venue)}">
      <span class="thumb ${vid && !cover ? 'dark' : ''}">${has(cover) ? img(cover, s.venue) : (vid ? '' : '<span class="ph" style="position:absolute;inset:0">Cover photo</span>')}
        <span class="chips">${vid ? `<span class="v">${ICON.play.replace(/26/g, '12')}Video</span>` : ''}${photos.length ? `<span>${ICON.cam}${photos.length} photos</span>` : ''}</span>
        ${vid ? `<span class="play">${ICON.play}</span>` : ''}</span>
      <span class="srow"><span><strong>${esc(s.venue)}</strong><small>${esc(s.topic)}</small></span><span class="pill">${esc(s.mode)}</span></span></button>`;
  }).join('\n')}
  </div>
  <p class="note">Each card opens a gallery — video first if there is one, then photos.</p>
</section>` : '';

const journeyS = list(journey.items).length ? `
<section id="journey" class="journey bleed"><div class="jgrid">
  <div class="head" style="margin:0"><p class="eyebrow">Journey</p><h2 class="h2">${esc(journey.heading)}</h2><p class="lead">${esc(journey.intro)}</p></div>
  <ol class="jlist">${list(journey.items).map((j) => `<li><time>${esc(j.years)}</time><div><strong>${esc(j.title)}</strong><span>${esc([j.company, j.result].filter(has).join(' · '))}</span></div></li>`).join('')}</ol>
</div></section>` : '';

const wItems = list(writing.items).filter((w) => has(w.title));
const writingS = wItems.length ? `
<section id="writing">
  <div class="head-row"><div class="head" style="margin:0"><p class="eyebrow">Writing</p><h2 class="h2">${esc(writing.heading)}</h2></div>
    <div class="filters"><button aria-pressed="true" data-lang="all">All</button><button aria-pressed="false" data-lang="English">English</button><button aria-pressed="false" data-lang="Bangla">বাংলা</button></div></div>
  <div class="wgrid">${wItems.map((w, i) => `<a class="wcard" data-lang="${esc(w.language)}" href="${has(w.url) ? esc(w.url) : '#writing'}" ${has(w.url) ? 'target="_blank" rel="noopener"' : ''}>
    <div class="img ${has(w.thumbnail) ? '' : 'ph'}" style="${has(w.thumbnail) ? '' : `background:${['#E0D9D3', '#EAE4DE', '#F5F2EF'][i % 3]}`}">${has(w.thumbnail) ? img(w.thumbnail, w.title) : 'Thumbnail'}</div>
    <div class="b"><small>${esc([w.publication, w.type].filter(has).join(' · '))}</small><strong>${esc(w.title)}</strong><em>Read →</em></div></a>`).join('')}</div>
</section>` : '';

const tools = list(caps.tools).filter((t) => has(t.name));
const toolHtml = tools.map((t) => `<div class="tool">${has(t.logo) ? `<img src="${esc(t.logo)}" alt="" loading="lazy">` : `<b>${esc(t.name[0])}</b>`}${esc(t.name)}</div>`).join('');
const capsS = `
<section class="caps bleed" aria-label="Capabilities">
  <div class="head"><p class="eyebrow">Capabilities</p><h2 class="h2">${esc(caps.heading)}</h2></div>
  <div class="cgrid">${list(caps.cards).map((c, i) => `<div class="ccard"><span class="num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><i>${capIcon(i)}</i><div><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p></div><div class="skills">${list(c.skills).map((s) => `<span>${esc(typeof s === 'string' ? s : s.skill)}</span>`).join('')}</div></div>`).join('')}</div>
  ${tools.length ? `<div class="toolkit"><h3>Toolkit</h3><div class="marquee"><div class="mtrack">${toolHtml}<span aria-hidden="true" style="display:contents">${toolHtml}</span></div></div></div>` : ''}
</section>`;

const certsS = list(certs.items).length ? `
<section aria-label="Certifications" style="padding:4rem 0 1rem"><div class="cert-wrap">
  <div class="head-row"><div class="head" style="margin:0"><p class="eyebrow">Certifications</p><h2 class="h2">${esc(certs.heading)}</h2></div>${has(certs.badge) ? `<span class="cert-badge">${esc(certs.badge)}</span>` : ''}</div>
  <div class="cgrid2">${list(certs.items).map((c) => `<div class="cert"><div>${has(c.logo) ? `<img class="logo" src="${esc(c.logo)}" alt="">` : `<i>${ICON.medal}</i>`}<small>${esc(c.issuer)}</small><strong>${esc(c.title)}</strong>${has(c.url) ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">View credential →</a>` : ''}</div></div>`).join('')}</div>
</div></section>` : '';

const contactS = `
<section id="contact" class="contact">
  ${has(p.open_to) ? `<p class="eyebrow">${esc(p.open_to)}</p>` : ''}
  <h2>${esc(p.contact_heading)}</h2>
  ${has(p.email) ? `<a class="mail" href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : ''}
  <div class="btns"><a class="btn btn-w" href="${cvHref}" ${has(p.cv_file) ? 'download' : ''}>Download CV (PDF)</a>${has(p.linkedin) ? `<a class="btn btn-o" href="${esc(p.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ''}</div>
</section>
<footer><span>© ${new Date().getFullYear()} ${esc(p.name)}</span><span>${esc(p.location)}</span></footer>`;

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
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/assets/style.css">
</head>
<body>
<div class="wrap">
${hero}
${metricsS}
${awardS}
${videosS}
${processS}
${speakS}
${journeyS}
${writingS}
${capsS}
${certsS}
${contactS}
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
