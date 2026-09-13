// Tavlo — reveal ved scroll + scroll-drevet hero-sekvens.
// Ingen afhaengigheder. Alt nedgraderer til en fuldt brugbar side uden JS
// og ved prefers-reduced-motion.

// Opdatér ved hver aendring i dette script — vises i ?debug-boksen, saa man
// kan se om browseren har den seneste version (cache, deploy).
const BUILD = '2026-09-13T00:00Z';

// Titlen staar ÉT sted og bruges baade af dashboardet og patchen over "WOD"
// i hand.webp, saa de aldrig kan komme til at vise to forskellige ting.
const WOD_TITLE = 'Styrke & kerne';
document.querySelectorAll('[data-wod-title]').forEach((el) => { el.textContent = WOD_TITLE; });

// Sprogskift: lige foer klik regnes hvilket afsnit der rent faktisk er i
// billedet lige nu (IKKE en gammel #anker fra url'en — den kan vaere forbi et
// afsnit man klikkede sig hen til og siden scrollede vaek fra igen), og
// linket faar det som anker. Intet match (fx i hero'en eller footeren) ->
// toppen af den anden side (default-href, uaendret). Ren navigation, ingen
// tekst skiftes med JS.
document.querySelectorAll('[data-lang-link]').forEach((a) => {
  a.addEventListener('click', () => {
    let current = null;
    for (const id of ['features', 'tavle', 'position', 'demo']) {
      const el = document.getElementById(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (mid > 0 && mid < innerHeight) current = id;
    }
    a.href = a.href.split('#')[0] + (current ? '#' + current : '');
  });
});

// ---- Reveal: fade elementer ind naar de rammer viewporten ----
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }
}, { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// ---- Hjaelpere ----
function clamp01(x) { return Math.min(1, Math.max(0, x)); }
function local(x, a, b) { return clamp01((x - a) / (b - a)); }
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
// 0..1 for hvor langt et sticky-spor er scrollet forbi. "occupied" er hvor
// meget lodret plads den sticky boks (header + stage) faktisk fylder lige nu
// — normalt = viewport, MEN stagen krymper selv i landings-fasen (portraet,
// se layoutScene), og saa er occupied MINDRE end viewport. Native sticky
// slipper naar containerens rest-plads < occupied — bruges IKKE plain
// viewport her ville p naa 1 laenge foer sticky rent faktisk slipper, med en
// dod scroll-stump uden visuel aendring til foelge.
function trackProgress(rect, occupied) {
  const span = rect.height - occupied;
  return span > 0 ? clamp01(-rect.top / span) : 0;
}

// Loes n lineaere ligninger (Gauss-elimination med delvis pivotering).
function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    }
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col];
    for (let c = col; c <= n; c++) M[col][c] /= d;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((row) => row[n]);
}

// matrix3d-streng der mapper rektanglet (0,0)-(w,h) til firkanten dst
// (fire [x,y]-punkter i raekkefoelgen TL, TR, BR, BL). Ren projektiv homografi.
function matrix3dFromQuad(w, h, dst) {
  const src = [[0, 0], [w, 0], [w, h], [0, h]];
  const A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const [sx, sy] = src[i];
    const [dx, dy] = dst[i];
    A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]); b.push(dx);
    A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]); b.push(dy);
  }
  const H = solveLinear(A, b); // [h0..h7], h8 = 1
  return `matrix3d(${H[0]},${H[3]},0,${H[6]},` +
    `${H[1]},${H[4]},0,${H[7]},` +
    `0,0,1,0,` +
    `${H[2]},${H[5]},0,1)`;
}

// ---- Hero-scene ----
// room.jpg's naturlige pixelmaal.
const PHOTO_W = 2752;
const PHOTO_H = 1536;
// Tv-skaermens fire hjoerner i room.jpg (naturlige pixels): TL, TR, BR, BL.
// Maalt mod gitter — JUSTER mod ?debug saa den roede outline hugger skaermen.
const TV = [[600, 82], [970, 198], [965, 452], [595, 408]];
const TV_CX = TV.reduce((s, p) => s + p[0], 0) / 4;
const TV_CY = TV.reduce((s, p) => s + p[1], 0) / 4;

const scene = document.querySelector('[data-hero-scene]');
const screenEl = document.getElementById('layer-screen');
const stage = scene && scene.closest('[data-hero-stage]');
const track = scene && scene.closest('[data-hero-track]');
const copyEl = document.getElementById('hero-copy');
const sendPath = document.querySelector('[data-send-path]');
const sendDot = document.querySelector('[data-send-dot]');
const sendGrad = document.querySelector('[data-send-grad]');
const phoneGlow = document.querySelector('[data-phone-glow]');

// Headeren er ogsaa position: sticky; top: 0 — uden dette kaemper de om y=0, og
// headeren daekker toppen af scenen (tv'et rammer headeren) saa snart man scroller.
const siteHeader = document.querySelector('.site');
function syncHeaderHeight() {
  if (siteHeader) {
    document.documentElement.style.setProperty('--hdr-h', siteHeader.offsetHeight + 'px');
  }
}
syncHeaderHeight();
addEventListener('resize', syncHeaderHeight);

// svh-probe: stagen selv bruger lvh (dvs. den daekker altid hele skaermen,
// ogsaa naar Safaris vaerktoejslinje forsvinder midt i scroll — ellers naar
// baggrundslagene ikke helt ned, og der staar en sort bjaelke i bunden med
// haanden skaaret vandret over). Men alt der SKAL kunne naas/laeses (CTA,
// dashboardets slut-placering) skal blive inden for det GARANTEREDE
// (svh-baserede) omraade, saa det ikke gemmer sig bag en synlig vaerktoejslinje.
// svhPx maales via en skjult probe i stedet for window.innerHeight, som ikke
// noedvendigvis rammer "small viewport" praecist.
let svhPx = window.innerHeight;
const svhProbe = document.createElement('div');
svhProbe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none;';
document.body.appendChild(svhProbe);
function syncSvh() { svhPx = svhProbe.getBoundingClientRect().height; }
syncSvh();
addEventListener('resize', syncSvh);
function hdrPx() { return siteHeader ? siteHeader.offsetHeight : 0; }

// lvh-probe: STABIL fuld-skaerms-hoejde til foto/zoom-matematikken. Maa IKKE
// laeses fra stage.clientHeight, for stagen selv faar sin egen hoejde krympet
// af JS i landings-fasen (se layoutScene) — hvis vh fulgte den krympende
// hoejde, ville foto/zoom-udregningerne ogsaa krybe med, hvilket er forkert.
let lvhPx = window.innerHeight;
const lvhProbe = document.createElement('div');
lvhProbe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100lvh;visibility:hidden;pointer-events:none;';
document.body.appendChild(lvhProbe);
function syncLvh() { lvhPx = lvhProbe.getBoundingClientRect().height; }
syncLvh();
addEventListener('resize', syncLvh);

// Slutrektanglets maal (se layoutScene):
// - portraet: overkant maks HEADER_GAP_PX under headeren
// - begge: <=64px fra dashboardets underkant til "Hele salen ser det samme"
//   naar sticky slipper. Naar det IKKE kan naas ved blot at placere rektanglet
//   (en fast-hoej sticky-boks har altid samme rest-afstand ned, uanset hvor i
//   boksen indholdet sidder) krymper JS selve stagens hoejde i landings-fasen
//   (0.85..0.975), saa den "sticky-slipper"-punktet naturligt rykker taettere
//   paa — IKKE ved at flytte dashboardet vaek fra toppen.
// FEATURES_PAD_PX = .features' egen padding-top ved smalle viewports
// (clamp(3rem, 8vw, 6rem) bunder ved 3rem = 48px under ~600px).
const GAP_TARGET_PX = 64;
const FEATURES_PAD_PX = 48;
const HEADER_GAP_PX = 20;   // "max 24px" — lidt margin under loftet

// Hvor meget lodret plads header+stage faktisk fylder lige nu (se
// trackProgress) — opdateres af layoutScene, laest af trackProgress.
let stageOccupiedPx = window.innerHeight;

if (scene && screenEl && stage && track && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('hero-on');

  const dbg = location.search.includes('debug') ? scene.querySelector('[data-hero-debug]') : null;
  let readout = null;
  if (dbg) {
    dbg.hidden = false;
    dbg.querySelector('.dbg-tv').setAttribute('points', TV.map((p) => p.join(',')).join(' '));
    for (const [x, y] of TV) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 9);
      c.setAttribute('class', 'dbg-tv-dot');
      dbg.appendChild(c);
    }
    readout = document.createElement('div');
    readout.className = 'hero-debug-readout';
    document.body.appendChild(readout);
  }

  // Etaper efter --hp (0..1, glidet mod scroll-maalet). Se status-tabellen for navne.
  //   0.00..0.05 : 1 hvile — tv sort, headline+CTA synlig
  //   0.05..0.22 : 2 telefonen stiger op (hand.webp)
  //   0.05..0.095: 3 headline+CTA forsvinder helt (samtidig med 2, faerdig foer haandens boks naar teksten ved ~0.11)
  //   0.22..0.27 : B1 send-buen tegnes telefon -> tv, glød paa telefonskaermen
  //   0.27..0.285: B2 buens punkt naar tv'et, kort kant-glød
  //   0.285..0.30: B3 buen fader ud
  //   0.30..0.45 : 4 dashboard fader ind paa tv'et (ingen zoom, telefon stadig i billedet)
  //   0.45..0.52 : hold
  //   0.52..0.64 : 5a telefonen saenkes ud
  //   0.66..0.80 : 5b kameraet zoomer ind mod tv'et (restScale -> zoomMax)
  //   0.68..0.83 : 5b foto -> sort (veil). pDetach maa foerst starte naar veil>=0.9 (p>=0.815)
  //                for tv'ets skaeve firkant (ca. 1,3:1) naar den folder ud mod dashboardets
  //                16:9 — den mellemform er kun praesentabel naar fotoet er sort.
  //   0.85..0.975: 5c dashboard folder ud til fladt 16:9 (efter veil er sort med god margin)
  //   0.975..1.00: 6 kort hold foer sticky slipper (~13% af en skaermhoejde paa 520svh-sporet)

  // pZoom: 0 = kigger paa rummet, 1 = hallen zoomet helt ind (restScale -> zoomMax).
  // pDetach: 0 = dashboardet limet paa tv'et, 1 = fladt 16:9-rektangel i viewporten.
  function layoutScene(pZoom, pDetach) {
    const ez = easeInOutCubic(clamp01(pZoom));
    const ed = easeInOutCubic(clamp01(pDetach || 0));
    const vw = document.documentElement.clientWidth;   // ikke innerWidth: den taeller scrollbaren med og skubber fladt-maal 16:9 for langt ud
    const vh = Math.max(0, lvhPx - hdrPx());            // STABIL lvh-baseret hoejde — se note ved lvh-probe ovenfor
    const safeVh = Math.max(0, svhPx - hdrPx());        // GARANTERET synligt omraade — det der skal kunne laeses/naas, laenes herpaa

    // Scene-skala: fra restScale (= cover, "hvile") op mod zoomMax (aldrig
    // hoejere end 1, aldrig mere end 1,5x restScale — forhindrer opskaleret,
    // groedet foto naar restScale i forvejen er hoej, som paa smalle/hoeje
    // mobil-viewports).
    const restScale = Math.max(vw / PHOTO_W, vh / PHOTO_H);
    const zoomMax = Math.min(1, 1.5 * restScale);
    const s = restScale + Math.max(0, zoomMax - restScale) * ez;
    const sW = PHOTO_W * s, sH = PHOTO_H * s;

    // Centrer paa tv'et, clamp saa fotoets kant aldrig kommer ind i viewporten.
    let tx = vw / 2 - TV_CX * s;
    let ty = vh / 2 - TV_CY * s;
    tx = Math.min(0, Math.max(vw - sW, tx));
    ty = Math.min(0, Math.max(vh - sH, ty));
    scene.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(6)})`;

    // Dashboardets maal ved pDetach=1: det stoerste 16:9-rektangel der passer
    // i det GARANTEREDE synlige omraade (safeVh — ellers kan rektanglet lande
    // bag en synlig vaerktoejslinje). Landskab: centreret som foer. Portraet:
    // fuld bredde, klistret til toppen (HEADER_GAP_PX under headeren).
    const portrait = vw < safeVh;
    const tW = portrait ? vw : Math.min(vw, safeVh * 16 / 9);
    const tH = tW * 9 / 16;
    const tX = (vw - tW) / 2;
    const tY = portrait ? HEADER_GAP_PX : (safeVh - tH) / 2;

    // Portraet: stagens EGEN hoejde krymper i takt med pDetach, fra fuld
    // skaerm ned til "fittedH" (lige nok til dashboard + den luft der giver
    // <=64px ned til overskriften) — IKKE ved at flytte dashboardet. Native
    // position:sticky genberegner sit slip-punkt af sig selv naar elementets
    // hoejde falder, saa den tomme plads under dashboardet forsvinder uden at
    // vi selv skal styre scroll/track. Landskab: uroert (fuld hoejde altid).
    let liveStageH = vh;
    if (portrait) {
      const fittedH = tY + tH + (GAP_TARGET_PX - FEATURES_PAD_PX);
      liveStageH = Math.max(fittedH, vh - (vh - fittedH) * ed);
      stage.style.height = liveStageH.toFixed(1) + 'px';
    } else if (stage.style.height) {
      stage.style.height = '';
    }
    stageOccupiedPx = hdrPx() + liveStageH;   // laest af trackProgress naeste frame

    const toScene = (x, y) => [(x - tx) / s, (y - ty) / s];
    const flat = [
      toScene(tX, tY), toScene(tX + tW, tY), toScene(tX + tW, tY + tH), toScene(tX, tY + tH),
    ];
    const dst = TV.map((c, i) => [
      c[0] + (flat[i][0] - c[0]) * ed,
      c[1] + (flat[i][1] - c[1]) * ed,
    ]);
    screenEl.style.transform = matrix3dFromQuad(1920, 1080, dst);

    if (dbg) {
      dbg.querySelector('.dbg-dst').setAttribute('points', dst.map((q) => q.map((n) => n.toFixed(1)).join(',')).join(' '));
    }
    return { s, tx, ty, restScale, zoomMax, safeVh, tY, tH, portrait };
  }

  // Send-buen: telefon-enden laeses hver frame fra haand-lagets faktiske
  // skaerm-position i DOM'et (virker uanset --phone-up/translateY-formel),
  // tv-enden regnes gennem den SAMME scene-transform (g.tx/g.ty/g.s) som
  // dashboardet selv bruger. Ingen egen timer -> tilbage-scroll er gratis.
  function updateSendArc(sendDraw, active, g) {
    if (!sendPath || !phoneGlow) return;
    if (!active) return;
    const stageRect = stage.getBoundingClientRect();
    const pr = phoneGlow.getBoundingClientRect();
    const x1 = pr.left + pr.width / 2 - stageRect.left;
    const y1 = pr.top - stageRect.top;
    const x2 = g.tx + TV_CX * g.s;
    const y2 = g.ty + TV_CY * g.s;
    const dx = x2 - x1;
    const bow = Math.min(Math.abs(dx) * 0.32 + 60, 340);
    const cx = (x1 + x2) / 2;
    const cy = Math.min(y1, y2) - bow;
    sendPath.setAttribute('d', `M ${x1.toFixed(1)},${y1.toFixed(1)} Q ${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
    // farveforloebet skal altid gaa orange (telefon) -> viola (tv), uanset
    // hvor de to punkter ligger paa skaermen -> gradienten faar path'ens egne
    // endepunkter i stedet for at laene sig op ad boundingbox'ens venstre/hoejre.
    if (sendGrad) {
      sendGrad.setAttribute('x1', x1.toFixed(1)); sendGrad.setAttribute('y1', y1.toFixed(1));
      sendGrad.setAttribute('x2', x2.toFixed(1)); sendGrad.setAttribute('y2', y2.toFixed(1));
    }
    const len = sendPath.getTotalLength();
    sendPath.style.strokeDasharray = len.toFixed(1);
    sendPath.style.strokeDashoffset = (len * (1 - clamp01(sendDraw))).toFixed(1);
    const pt = sendPath.getPointAtLength(len * clamp01(sendDraw));
    sendDot.setAttribute('cx', pt.x.toFixed(1));
    sendDot.setAttribute('cy', pt.y.toFixed(1));
  }

  // ?at=0.3 laaser sekvensen paa en fast vaerdi (til verifikation uden scroll).
  const _q = new URLSearchParams(location.search);
  const lockAt = _q.has('at') ? clamp01(parseFloat(_q.get('at'))) : null;

  let shown = lockAt != null ? lockAt : trackProgress(track.getBoundingClientRect(), stageOccupiedPx);
  let running = false;
  function frame() {
    if (lockAt != null) {
      shown = lockAt;
    } else {
      const hp = trackProgress(track.getBoundingClientRect(), stageOccupiedPx);
      shown += (hp - shown) * 0.16;                     // inerti — glatter scroll-jitter
      if (Math.abs(hp - shown) < 0.0004) shown = hp;
    }

    const p = shown;
    // etaper (p-intervaller — se kommentaren ovenfor):
    const phoneUp = easeInOutCubic(local(p, 0.03, 0.17));
    const phoneDown = easeInOutCubic(local(p, 0.35, 0.47));
    const tvOn = local(p, 0.24, 0.36);
    const pZoom = local(p, 0.47, 0.66);
    const veil = local(p, 0.50, 0.70);
    const pDetach = local(p, 0.70, 0.96);      // starter foerst naar veil naar 0.9 ved p~0.815 — se kommentar ovenfor
    const copyDim = local(p, 0.03, 0.08);         // én vej: forsvinder, kommer ikke tilbage — faerdig foer haandens boks naar teksten (~0.11)

    // send-buen: draw 0.22-0.27, kort ankomst-flash 0.27-0.285, fade ud 0.285-0.30
    const sendDraw = easeInOutCubic(local(p, 0.17, 0.21));
    const sendEnvelope = clamp01(Math.min(local(p, 0.17, 0.182), 1 - local(p, 0.225, 0.24)));
    const sendFlash = clamp01(1 - local(p, 0.21, 0.225)) * clamp01(local(p, 0.206, 0.21));
    const sendPulse = sendEnvelope * (0.5 + 0.5 * Math.sin((p - 0.17) * Math.PI * 2 * (3 / 0.07))) * 0.65;
    const sendActive = p > 0.155 && p < 0.25;

    stage.style.setProperty('--phone-up', phoneUp.toFixed(4));
    stage.style.setProperty('--phone-down', phoneDown.toFixed(4));
    stage.style.setProperty('--tv-on', tvOn.toFixed(4));
    stage.style.setProperty('--veil', veil.toFixed(4));
    stage.style.setProperty('--copy-dim', copyDim.toFixed(4));
    stage.style.setProperty('--send-opacity', sendEnvelope.toFixed(4));
    stage.style.setProperty('--send-glow', sendPulse.toFixed(4));
    stage.style.setProperty('--send-flash', sendFlash.toFixed(4));
    if (copyEl) copyEl.classList.toggle('copy-hidden', copyDim >= 1);
    const g = layoutScene(pZoom, pDetach);
    updateSendArc(sendDraw, sendActive, g);

    if (dbg) {
      const name =
        p < 0.03 ? '1 — hvile' :
        p < 0.17 ? '2/3 — telefon op, tekst forsvinder' :
        p < 0.21 ? 'B1 — send-bue tegnes' :
        p < 0.225 ? 'B2 — ankomst-flash' :
        p < 0.24 ? 'B3 — bue fader ud' :
        p < 0.35 ? '4 — dashboard faeder ind' :
        p < 0.47 ? '5a — telefon ned' :
        p < 0.70 ? '5b — kamera zoomer, foto->sort' :
        p < 0.96 ? '5c — dashboard folder ud' : '6 — hold / landing';
      // afstand fra dashboardets underkant (flad-rekt bund) til naeste overskrift,
      // og fra headerens underkant til dashboardets overkant
      const stageRect = stage.getBoundingClientRect();
      const h2 = document.querySelector('.features h2');
      const gapPx = h2 ? (h2.getBoundingClientRect().top - (stageRect.top + g.tY + g.tH)) : NaN;
      const hdrToDashPx = stageRect.top + g.tY - hdrPx();
      readout.textContent =
        `BUILD ${BUILD}\n` +
        `ETAPE  ${name}\n` +
        `p ${p.toFixed(3)}  viewport ${document.documentElement.clientWidth}x${stage.clientHeight}  safeVh ${g.safeVh.toFixed(0)}  portrait ${g.portrait}\n` +
        `phoneUp ${phoneUp.toFixed(2)} phoneDown ${phoneDown.toFixed(2)} tvOn ${tvOn.toFixed(2)} veil ${veil.toFixed(2)} copyDim ${copyDim.toFixed(2)}\n` +
        `sendDraw ${sendDraw.toFixed(2)} sendOpacity ${sendEnvelope.toFixed(2)} sendFlash ${sendFlash.toFixed(2)} sendGlow ${sendPulse.toFixed(2)}\n` +
        `pZoom ${pZoom.toFixed(2)} pDetach ${pDetach.toFixed(2)} restScale ${g.restScale.toFixed(4)} zoomMax ${g.zoomMax.toFixed(4)} scale ${g.s.toFixed(4)}\n` +
        `fotoOpacity ${(1 - veil).toFixed(2)}  header->dashboard ${hdrToDashPx.toFixed(0)}px  dashboard->overskrift ${Number.isFinite(gapPx) ? gapPx.toFixed(0) : '?'}px\n` +
        `tx ${g.tx.toFixed(0)} ty ${g.ty.toFixed(0)}  TV(natural) TL${TV[0]} TR${TV[1]} BR${TV[2]} BL${TV[3]}`;
    }
    if (running) requestAnimationFrame(frame);
  }
  const start = () => { if (!running) { running = true; requestAnimationFrame(frame); } };

  const relayout = () => {
    syncSvh();
    syncLvh();
    const g = layoutScene(local(shown, 0.66, 0.80), local(shown, 0.85, 0.975));
    updateSendArc(easeInOutCubic(local(shown, 0.22, 0.27)), shown > 0.205 && shown < 0.31, g);
  };
  layoutScene(0, 0);
  new IntersectionObserver(
    ([e]) => { if (e.isIntersecting) start(); else running = false; },
    { rootMargin: '140% 0px 140% 0px' }
  ).observe(track);
  start();
  addEventListener('resize', relayout);

  const photo = scene.querySelector('.hero-scene__photo');
  if (photo && !photo.complete) photo.addEventListener('load', relayout, { once: true });
}

// ---- Selvtjek: aabn siden med #selftest i URL'en ----
if (location.hash === '#selftest') {
  console.assert(clamp01(-1) === 0 && clamp01(2) === 1 && clamp01(0.4) === 0.4, 'clamp01');
  console.assert(easeInOutCubic(0) === 0 && easeInOutCubic(1) === 1, 'ease endepunkter');
  console.assert(Math.abs(easeInOutCubic(0.5) - 0.5) < 1e-9, 'ease midt = 0.5');
  // homografi: identitets-firkant giver ~identitetsmatrix
  const m = matrix3dFromQuad(100, 100, [[0, 0], [100, 0], [100, 100], [0, 100]]);
  console.assert(/matrix3d\(1,0,0,0, ?0,1,0,0, ?0,0,1,0, ?0,0,0,1\)/.test(m.replace(/-0/g, '0')), 'identitet: ' + m);
  // firkant forskudt (10,20): translationsled skal vaere 10 og 20
  const m2 = matrix3dFromQuad(100, 100, [[10, 20], [110, 20], [110, 120], [10, 120]]);
  console.assert(/,10,20,0,1\)$/.test(m2), 'translation: ' + m2);
  console.log('selftest ok');
}
