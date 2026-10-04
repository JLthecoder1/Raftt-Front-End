import * as THREE from 'three';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';
import { ISLANDS, UI } from './map-data.js';

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s) => document.querySelector(s);
let lang = localStorage.getItem('raftt-lang') || 'en';
const t = () => UI[lang];
const R_ISLAND = 7.2;

// ---------- renderer / scene / camera ----------
const canvas = $('#map-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#2d86dc'); scene.fog = new THREE.Fog('#2d86dc', 220, 520);
const camera = new THREE.PerspectiveCamera(30, 1, 1, 600);
const camTarget = new THREE.Vector3(), camLook = new THREE.Vector3();
const CAM_DIR = new THREE.Vector3(1, 1.3, 1).normalize();
let zoom = 125, zoomT = 125;

scene.add(new THREE.HemisphereLight('#e6f4ff', '#2a6fb0', 1.25));
const sun = new THREE.DirectionalLight('#fff1d6', 2.6);
sun.position.set(-50, 80, 40); sun.castShadow = true; sun.shadow.mapSize.set(3072, 3072);
Object.assign(sun.shadow.camera, { left: -75, right: 75, top: 75, bottom: -75, near: 1, far: 260 });
sun.shadow.bias = -0.0005; scene.add(sun, sun.target);

// ---------- water (cel-shading: azul chapado + rede de espuma branca) ----------
const water = new THREE.Mesh(new THREE.PlaneGeometry(500, 500, 120, 120).rotateX(-Math.PI / 2),
 new THREE.ShaderMaterial({
  uniforms: { uT: { value: 0 }, uBase: { value: new THREE.Color('#2d86dc') }, uDark: { value: new THREE.Color('#1f68b9') }, uFoam: { value: new THREE.Color('#f6fcff') } },
  vertexShader: `uniform float uT; varying vec2 vP;
   void main(){ vec3 p=position; p.y+=sin(p.x*.2+uT*.7)*.07+sin(p.z*.27+uT*.9)*.06; vec4 w=modelMatrix*vec4(p,1.); vP=w.xz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform float uT; uniform vec3 uBase,uDark,uFoam; varying vec2 vP;
   vec2 h2(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return fract(sin(p)*43758.5453); }
   float hs(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
   float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y); }
   float edge(vec2 x,float t){ vec2 n=floor(x),f=fract(x),mg=vec2(0),mr=vec2(0); float md=8.;
    for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){ vec2 g=vec2(i,j),o=.5+.5*sin(t+6.2831*h2(n+g)),r=g+o-f; float d=dot(r,r); if(d<md){md=d;mr=r;mg=g;} }
    md=8.;
    for(int j=-2;j<=2;j++)for(int i=-2;i<=2;i++){ vec2 g=mg+vec2(i,j),o=.5+.5*sin(t+6.2831*h2(n+g)),r=g+o-f; if(dot(mr-r,mr-r)>1e-5) md=min(md,dot(.5*(mr+r),normalize(r-mr))); }
    return md; }
   void main(){
    float t=uT*.35; vec2 p=vP*.14+vec2(vn(vP*.11+uT*.04),vn(vP*.11-uT*.04+7.))*1.5;
    float blob=smoothstep(.47,.52,vn(vP*.06+vec2(uT*.02,0.))*.65+vn(vP*.15-uT*.03)*.35);
    vec3 c=mix(uBase,uDark,blob);
    float e=edge(p,t), aa=fwidth(e)*1.3+.002, wv=.022+.03*vn(vP*.3+uT*.05);
    float line=1.-smoothstep(wv,wv+aa+.012,e);
    float line2=(1.-smoothstep(.14,.14+aa+.01,e))*smoothstep(.12,.15,e)*.0;
    c=mix(c,uFoam,line); c=mix(c,mix(c,uFoam,.35),line2);
    gl_FragColor=vec4(c,1.);
    #include <colorspace_fragment>
   }`
 }));
water.position.y = -0.15; scene.add(water);
const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(260, 260).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ color: '#0b3566', opacity: 0.4 }));
shadowPlane.position.y = 0.02; shadowPlane.receiveShadow = true; scene.add(shadowPlane);

// sparkles
{ const n = 120, a = new Float32Array(n * 3), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { a.set([(Math.random() - .5) * 140, .1, (Math.random() - .5) * 140], i * 3); ph[i] = Math.random() * 6.28; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3)); g.setAttribute('ph', new THREE.BufferAttribute(ph, 1));
  var sparkMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: { value: 0 } },
   vertexShader: `uniform float uT; attribute float ph; varying float a; void main(){ a=.5+.5*sin(uT*1.5+ph); gl_PointSize=2.+2.*a; gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.);}`,
   fragmentShader: `varying float a; void main(){ float d=length(gl_PointCoord-.5); if(d>.5) discard; gl_FragColor=vec4(1.,.97,.85,a*.45*(1.-d*2.)); }` });
  scene.add(new THREE.Points(g, sparkMat)); }

// ---------- helpers ----------
const loader = new GLTFLoader();
const loadGLB = (n) => new Promise((res, rej) => loader.load(`assets/models/${n}.glb`, (g) => res(g.scene), undefined, rej));
function normalize(obj, size, yawFix = false) {
  const b = new THREE.Box3().setFromObject(obj), s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
  const k = size / Math.max(s.x, s.z); const wrap = new THREE.Group();
  obj.position.set(-c.x, -b.min.y, -c.z); const inner = new THREE.Group(); inner.add(obj); inner.scale.setScalar(k);
  if (yawFix && s.x > s.z) inner.rotation.y = Math.PI / 2; wrap.add(inner);
  wrap.traverse((m) => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; if (m.material) m.material.envMapIntensity = .6; } });
  return wrap;
}
function dots(max, color, size, opacity) {
  const m = new THREE.InstancedMesh(new THREE.CircleGeometry(size, 8).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }), max);
  m.frustumCulled = false; m.count = 0; m.position.y = .12; scene.add(m); return m;
}
function placeAlong(mesh, pts, spacing, offset) {
  const d = new THREE.Object3D(); let n = 0, carry = offset % spacing;
  for (let i = 0; i < pts.length - 1 && n < mesh.instanceMatrix.count; i++) {
    const a = pts[i], b = pts[i + 1], L = a.distanceTo(b);
    for (let s = carry; s < L && n < mesh.instanceMatrix.count; s += spacing) { d.position.lerpVectors(a, b, s / L); d.updateMatrix(); mesh.setMatrixAt(n++, d.matrix); carry = s + spacing - L; }
    carry = carry < 0 ? 0 : carry;
  }
  mesh.count = n; mesh.instanceMatrix.needsUpdate = true;
}

// ---------- islands ----------
const islands = [], hitMeshes = [];
const labelsEl = $('#map-labels');
function buildIsland(cfg, model) {
  const g = new THREE.Group(), [x, z] = cfg.pos; g.position.set(x, 0, z);
  const body = model ? normalize(model, R_ISLAND * 2) : new THREE.Mesh(new THREE.CylinderGeometry(R_ISLAND, R_ISLAND + 1, 1.6, 20), new THREE.MeshStandardMaterial({ color: cfg.color }));
  body.position.y = -0.15; g.add(body);
  const col = new THREE.Color(cfg.color);
  const toC = new THREE.Vector3(-x, 0, -z).normalize(), dockDist = R_ISLAND + 1.4;
  const dock = new THREE.Vector3(x, 0, z).addScaledVector(toC, dockDist);
  // píer + anel de navegação + marcador luminoso (no mundo, não sobe com o hover)
  const pier = new THREE.Mesh(new THREE.BoxGeometry(1.1, .18, 3.2), new THREE.MeshStandardMaterial({ color: '#b98a54', roughness: .9 }));
  pier.position.copy(dock).addScaledVector(toC, -1.1).setY(.12); pier.rotation.y = Math.atan2(toC.x, toC.z); pier.castShadow = true; scene.add(pier);
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.45, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .75, depthWrite: false }));
  ring.position.copy(dock).setY(.15); scene.add(ring);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(2.1, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .14, depthWrite: false }));
  glow.position.copy(ring.position); scene.add(glow);
  const light = new THREE.PointLight(col, 40, 22); light.position.set(0, 5, 0); g.add(light);
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(R_ISLAND, R_ISLAND, 7, 16), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 3; hit.userData.id = cfg.id; g.add(hit); hitMeshes.push(hit);
  scene.add(g);
  const el = document.createElement('button'); el.className = 'island-label'; el.style.setProperty('--c', cfg.color); el.dataset.id = cfg.id;
  el.innerHTML = `<i class="dot"></i><span></span>`; labelsEl.append(el);
  el.onclick = () => selectIsland(cfg.id, true); el.onmouseenter = () => setHover(cfg.id); el.onmouseleave = () => setHover(null);
  const isl = { cfg, g, body, ring, glow, dock, light, el, lift: 0, labelPos: new THREE.Vector3(x, 8.5, z) };
  islands.push(isl); return isl;
}

// ---------- raft ----------
const raft = { g: new THREE.Group(), pos: new THREE.Vector3(0, 0, 0), vel: new THREE.Vector3(), yaw: Math.PI, path: [], targetId: null, speed: 0 };
raft.g.position.copy(raft.pos); scene.add(raft.g);
const raftModelHolder = new THREE.Group(); raft.g.add(raftModelHolder);
function fallbackRaft() {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: '#a8743f', roughness: .9 });
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 3.2, 8).rotateX(Math.PI / 2), wood); l.position.set(-.55 * 2.5 / 2.5 + i * .44 - 1.1, .2, 0); l.castShadow = true; g.add(l); }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 3.4, 8), wood); mast.position.y = 1.9; mast.castShadow = true; g.add(mast);
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.2), new THREE.MeshStandardMaterial({ color: '#f6ead2', side: THREE.DoubleSide })); sail.position.set(0, 2.1, .1); sail.rotation.y = Math.PI / 2; sail.castShadow = true; g.add(sail);
  return g;
}
const wake = dots(60, '#ffffff', .22, .55), wakePts = [];
const marker = $('#raft-marker');

// ---------- navegação segura (evita ilhas) ----------
const obstacles = () => islands.map((i) => ({ c: i.g.position, r: R_ISLAND + 1.2, id: i.cfg.id }));
function segHit(a, b, o) {
  const ab = b.clone().sub(a), L2 = ab.lengthSq(); if (!L2) return null;
  const tt = THREE.MathUtils.clamp(o.c.clone().sub(a).dot(ab) / L2, 0, 1), p = a.clone().addScaledVector(ab, tt);
  p.y = 0; const c = o.c.clone().setY(0); return p.distanceTo(c) < o.r - .05 ? { tt, p, c } : null;
}
function planPath(from, to, ignoreId) {
  const obs = obstacles().filter((o) => o.id !== ignoreId), pts = [from.clone().setY(0), to.clone().setY(0)];
  for (let it = 0; it < 24; it++) {
    let fixed = true;
    for (let i = 0; i < pts.length - 1; i++) for (const o of obs) {
      const h = segHit(pts[i], pts[i + 1], o); if (!h) continue;
      const dir = pts[i + 1].clone().sub(pts[i]).normalize(), side = new THREE.Vector3(-dir.z, 0, dir.x);
      let n = h.p.clone().sub(h.c); if (n.lengthSq() < 1e-4) n = side.clone(); n.setY(0).normalize();
      const wp = h.c.clone().addScaledVector(n, o.r + 1.4);
      pts.splice(i + 1, 0, wp); fixed = false; break;
    }
    if (fixed) break;
  }
  return pts;
}
const inIsland = (p, pad = 0) => obstacles().some((o) => p.distanceTo(o.c.clone().setY(0)) < o.r + pad - 1);
function sailTo(point, targetId = null, ignoreId = null) {
  raft.path = planPath(raft.pos, point, ignoreId).slice(1); raft.targetId = targetId; routeT = 0;
}

// ---------- seleção / UI ----------
let hoverId = null, selectedId = null, routeDots, routeT = 0, possible;
const setHover = (id) => { hoverId = id; canvas.style.cursor = id ? 'pointer' : ''; };
const find = (id) => islands.find((i) => i.cfg.id === id);
function selectIsland(id, sail = false) {
  selectedId = id; const isl = find(id); if (!isl) return;
  openOpportunityMenu(id); document.querySelectorAll('[data-cat]').forEach((b) => b.classList.toggle('is-active', b.dataset.cat === id));
  document.body.classList.add('has-selection');
  if (sail) sailTo(isl.dock, id, id);
}
function applyLang() {
  const T = t(); document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  $('#lang-toggle').textContent = lang === 'pt' ? 'EN' : 'PT'; $('#map-hint').textContent = T.hint; $('#raft-marker').textContent = T.yourRaft;
  $('#recenter').setAttribute('aria-label', T.recenter); $('#loading-text').textContent = T.loading; $('#nav-map-label') && ($('#nav-map-label').textContent = T.map);
  islands.forEach((i) => { i.el.querySelector('span').textContent = i.cfg.name[lang]; i.el.title = T.opp(i.cfg.opps.length); i.el.classList.toggle('has-opps', i.cfg.opps.length > 0); });
  document.querySelector('#side-cats').innerHTML = ISLANDS.map((c) => `<button class="dashboard-nav-link" data-cat="${c.id}" style="--c:${c.color}"><i class="sw"></i><span>${c.name[lang]}</span></button>`).join('');
  document.querySelectorAll('#side-cats [data-cat]').forEach((b) => (b.onclick = () => selectIsland(b.dataset.cat, true)));
}
$('#lang-toggle').onclick = () => { lang = lang === 'pt' ? 'en' : 'pt'; localStorage.setItem('raftt-lang', lang); applyLang(); };

const opportunitySamples = [
  { id: 'nullun', name: 'NULLUN', stage: { en: 'SaaS · Demo case study', pt: 'SaaS · Estudo de caso (demo)' } },
];
let openOpportunityCategory = null, activeOpportunityIndex = null;
function opportunityListFor(c) {
  if (c.id === 'startups') return opportunitySamples;
  return [];
}
function opportunityDetailsFor(c, item, index) {
  const assets = {
    startups: { en: 'Equity participation', pt: 'Participação societária' }, pmes: { en: 'Private credit note', pt: 'Nota de crédito privado' },
    recebiveis: { en: 'Receivables certificate', pt: 'Certificado de recebíveis' }, imoveis: { en: 'Real-estate participation', pt: 'Participação imobiliária' },
    energia: { en: 'Energy-generation asset', pt: 'Ativo de geração de energia' }, agro: { en: 'Agribusiness credit', pt: 'Crédito para agronegócio' },
    infra: { en: 'Infrastructure project participation', pt: 'Participação em projeto de infraestrutura' }, royalties: { en: 'Royalty revenue rights', pt: 'Direitos de receita de royalties' },
  };
  const images = {
    startups: 'assets/images/Equipe de startup colaborando com protótipo-1.png',
    pmes: 'assets/images/Pequena indústria em plena produção-2.png',
    recebiveis: 'assets/images/Análise de recebíveis no atacado-5.png',
    imoveis: 'assets/images/Arquitetura contemporânea em expansão-3.png',
    energia: 'assets/images/Fazenda solar em plena operação-4.png',
    agro: 'assets/images/Trator entre campos e silos-6.png',
    infra: 'assets/images/Porto moderno com centro de dados-7.png',
    royalties: 'assets/images/Estúdio criativo de música, cinema e jogos-8.png',
  };
  const isPt = lang === 'pt', asset = assets[c.id][lang];
  if (c.id === 'startups' && index === 0) return isPt ? { asset, image: 'assets/images/Equipe de startup colaborando com protótipo-1.png', imageAlt: 'Equipe da NULLUN trabalhando em um protótipo', headline: 'Visibilidade em tempo real para operações conectadas.', description: 'A NULLUN conecta sensores, ativos e equipes para transformar dados operacionais em decisões mais rápidas.', tags: ['IoT', 'SaaS', 'Indústria 4.0'], raised: '25%', investors: '84', milestones: '4', minimum: 'R$ 1.000', goal: 'R$ 2,5 milhões', status: 'Estudo de caso (demo)' } : { asset, image: 'assets/images/Equipe de startup colaborando com protótipo-1.png', imageAlt: 'NULLUN team working on a prototype', headline: 'Real-time visibility for connected operations.', description: 'NULLUN connects sensors, assets and teams to turn operational data into faster decisions.', tags: ['IoT', 'SaaS', 'Industry 4.0'], raised: '25%', investors: '84', milestones: '4', minimum: 'R$ 1,000', goal: 'R$ 2.5 million', status: 'Demo case study' };
  const image = images[c.id] || images.startups;
  return isPt ? { asset, image, imageAlt: item.name, headline: `Uma oportunidade vinculada a ${c.name.pt.toLowerCase()}.`, description: `Este ativo representa uma participação estruturada no projeto ${item.name}. Revise os termos, o cronograma e os riscos antes de decidir investir.`, tags: [c.name.pt, index < 2 ? 'Destaque' : 'Novo projeto', 'Demo'], raised: 'Em breve', investors: '—', milestones: '4', minimum: 'US$ 10.000,00', goal: 'US$ 100.000,00', status: 'Estudo de caso' } : { asset, image, imageAlt: item.name, headline: `An opportunity tied to ${c.name.en.toLowerCase()}.`, description: `This asset represents a structured participation in ${item.name}. Review its terms, timeline and risks before deciding to invest.`, tags: [c.name.en, index < 2 ? 'Featured' : 'New project', 'Demo'], raised: 'Coming soon', investors: '—', milestones: '4', minimum: '$10,000.00', goal: '$100,000.00', status: 'Case study' };
}
function renderOpportunityList(c) {
  const title = $('#opportunity-menu-title'), subtitle = $('#opportunity-menu-subtitle'), list = $('#opportunity-menu-list'), items = opportunityListFor(c), isPt = lang === 'pt';
  openOpportunityCategory = c.id; activeOpportunityIndex = null; $('#opportunity-menu').classList.remove('is-detail');
  title.textContent = `${c.name[lang]} ${isPt ? 'oportunidades' : 'opportunities'}`;
  subtitle.textContent = items.length
    ? (isPt ? `${items.length} projeto demonstrativo · Selecione para ver o estudo de caso` : `${items.length} demo project · Select to view the case study`)
    : t().soon;
  list.innerHTML = items.length
    ? items.map((item, index) => `<button class="opportunity-menu__item" type="button" data-project="${index}"><span class="opportunity-menu__number">${index + 1}</span><span class="opportunity-menu__copy"><strong>${item.name}</strong><small>${item.stage[lang]}</small><b>${isPt ? 'Estudo de caso demonstrativo' : 'Demo case study'}</b></span><span class="opportunity-menu__arrow" aria-hidden="true">→</span></button>`).join('')
    : `<p class="opportunity-menu__empty">${t().none}</p>`;
  list.querySelectorAll('.opportunity-menu__item').forEach((button) => button.onclick = () => renderOpportunityDetail(c, Number(button.dataset.project)));
}
function renderOpportunityDetail(c, index) {
  const item = opportunityListFor(c)[index], detail = opportunityDetailsFor(c, item, index), list = $('#opportunity-menu-list'), isPt = lang === 'pt';
  openOpportunityCategory = c.id; activeOpportunityIndex = index; $('#opportunity-menu').classList.add('is-detail'); $('#opportunity-menu-title').textContent = item.name; $('#opportunity-menu-subtitle').textContent = detail.asset;
  list.innerHTML = `<article class="opportunity-asset" aria-label="${isPt ? 'Detalhes do ativo' : 'Asset details'}"><button class="opportunity-menu__back" type="button">← ${isPt ? 'Voltar para empresas' : 'Back to companies'}</button>${detail.image ? `<img class="opportunity-asset__image" src="${detail.image}" alt="${detail.imageAlt}">` : ''}<p class="opportunity-asset__eyebrow">${isPt ? 'ESTUDO DE CASO DEMONSTRATIVO' : 'DEMO CASE STUDY'}</p><h3>${detail.headline}</h3><p class="opportunity-asset__description">${detail.description}</p><div class="opportunity-asset__tags">${detail.tags.map((tag) => `<span>${tag}</span>`).join('')}</div><section class="opportunity-asset__goal"><div><small>${isPt ? 'Meta ilustrativa' : 'Illustrative goal'}</small><strong>${detail.goal}</strong></div><span>${detail.status}</span><div class="opportunity-asset__progress"><i style="width:${detail.raised === '25%' ? '25%' : '0%'}"></i></div><small>${detail.raised} ${isPt ? 'ilustrativo' : 'illustrative'}</small></section><div class="opportunity-asset__stats"><div><strong>${detail.investors}</strong><small>${isPt ? 'Investidores (demo)' : 'Demo investors'}</small></div><div><strong>${detail.milestones}</strong><small>${isPt ? 'Marcos ilustrativos' : 'Illustrative milestones'}</small></div><div><strong>${detail.minimum}</strong><small>${isPt ? 'Mínimo ilustrativo' : 'Illustrative minimum'}</small></div></div><a class="opportunity-asset__cta" href="pagina-2.html?opportunity=${encodeURIComponent(item.id)}">${isPt ? 'Ver estudo de caso' : 'View demo case study'} <span aria-hidden="true">→</span></a><p class="opportunity-asset__note">${isPt ? 'Dados fictícios para demonstração. Não é uma oferta de investimento e nenhum aporte pode ser realizado.' : 'Fictional demo data. This is not an investment offering; investments are unavailable.'}</p></article>`;
  list.querySelector('.opportunity-menu__back').onclick = () => renderOpportunityList(c); list.querySelector('.opportunity-menu__back').focus();
}
function openOpportunityMenu(id) {
  const c = ISLANDS.find((item) => item.id === id), menu = $('#opportunity-menu');
  renderOpportunityList(c);
  menu.hidden = false; document.body.classList.add('opportunity-menu-open');
  requestAnimationFrame(() => menu.classList.add('is-open'));
  $('#opportunity-menu-close').focus();
}
function closeOpportunityMenu() {
  const menu = $('#opportunity-menu');
  openOpportunityCategory = null; activeOpportunityIndex = null;
  menu.classList.remove('is-open'); document.body.classList.remove('opportunity-menu-open');
  setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, RM ? 0 : 220);
}
$('#opportunity-menu-close').onclick = closeOpportunityMenu;
addEventListener('keydown', (e) => { if (e.key === 'Escape') { const c = ISLANDS.find((item) => item.id === openOpportunityCategory); if (c && activeOpportunityIndex !== null) renderOpportunityList(c); else closeOpportunityMenu(); } });

// ---------- input ----------
const keys = new Set(), ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const MAP = { arrowup: 'u', w: 'u', arrowdown: 'd', s: 'd', arrowleft: 'l', a: 'l', arrowright: 'r', d: 'r' };
addEventListener('keydown', (e) => { const k = MAP[e.key.toLowerCase()]; if (k && !/INPUT|TEXTAREA/.test(e.target.tagName)) { keys.add(k); raft.path = []; raft.targetId = null; e.preventDefault(); } });
addEventListener('keyup', (e) => keys.delete(MAP[e.key.toLowerCase()]));
document.querySelectorAll('.dpad button').forEach((b) => {
  const k = b.dataset.k, on = (e) => { e.preventDefault(); keys.add(k); raft.path = []; raft.targetId = null; }, off = () => keys.delete(k);
  b.addEventListener('pointerdown', on); ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, off));
});
function pick(e) { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); }
let down = null;
canvas.addEventListener('pointerdown', (e) => (down = { x: e.clientX, y: e.clientY }));
canvas.addEventListener('pointerup', (e) => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return; pick(e);
  const h = ray.intersectObjects(hitMeshes)[0]; if (h) return selectIsland(h.object.userData.id, true);
  const pt = new THREE.Vector3(); if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), pt)) return;
  if (pt.length() > 70 || inIsland(pt, 1)) return; sailTo(pt);
});
canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; pick(e); const h = ray.intersectObjects(hitMeshes)[0]; setHover(h ? h.object.userData.id : null); });
canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoomT = THREE.MathUtils.clamp(zoomT * (1 + Math.sign(e.deltaY) * .08), 40, 180); }, { passive: false });
$('#zoom-in').onclick = () => (zoomT = Math.max(40, zoomT * .85)); $('#zoom-out').onclick = () => (zoomT = Math.min(180, zoomT * 1.18));
$('#recenter').onclick = () => { zoomT = 125; raft.path = []; sailTo(new THREE.Vector3(0, 0, 0)); selectedId = null; closeOpportunityMenu(); };

// ---------- loop ----------
function resize() { const r = canvas.parentElement.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); new ResizeObserver(resize).observe(canvas.parentElement);
const clock = new THREE.Clock(), v3 = new THREE.Vector3(), fwd = new THREE.Vector3(-1, 0, -1).normalize(), right = new THREE.Vector3(1, 0, -1).normalize();
let wakeTimer = 0, arrived = false;
function project(i) {
  v3.copy(i.labelPos).setY(8.5 + i.lift); v3.project(camera);
  const x = (v3.x * .5 + .5) * canvas.clientWidth, y = (-v3.y * .5 + .5) * canvas.clientHeight;
  i.el.style.transform = `translate(-50%,-100%) translate(${x}px,${y}px)`; i.el.style.opacity = v3.z < 1 ? 1 : 0;
}
function tick() {
  const dt = Math.min(clock.getDelta(), .05), T = clock.elapsedTime;
  water.material.uniforms.uT.value = RM ? 0 : T; sparkMat.uniforms.uT.value = RM ? 0 : T;
  // movimento
  const input = new THREE.Vector3(); if (keys.has('u')) input.add(fwd); if (keys.has('d')) input.sub(fwd); if (keys.has('r')) input.add(right); if (keys.has('l')) input.sub(right);
  let want = new THREE.Vector3(), max = 0;
  if (input.lengthSq()) { want.copy(input).normalize(); max = 9; }
  else if (raft.path.length) {
    const wp = raft.path[0], d = wp.clone().sub(raft.pos).setY(0), L = d.length(), last = raft.path.length === 1;
    if (L < (last ? .5 : 1.2)) { raft.path.shift(); if (!raft.path.length && raft.targetId) { raft.targetId = null; arrived = true; pulse = 1; } }
    else { want.copy(d).normalize(); max = Math.min(10, 2 + L * 1.2); }
  }
  raft.vel.lerp(want.multiplyScalar(max), 1 - Math.exp(-dt * 3)); raft.speed = raft.vel.length();
  raft.pos.addScaledVector(raft.vel, dt);
  for (const o of obstacles()) { const d = raft.pos.clone().setY(0).sub(o.c.clone().setY(0)); if (d.length() < o.r - 1.1 && !(raft.targetId === o.id)) { raft.pos.copy(o.c).addScaledVector(d.normalize(), o.r - 1.1).setY(0); } }
  raft.pos.x = THREE.MathUtils.clamp(raft.pos.x, -70, 70); raft.pos.z = THREE.MathUtils.clamp(raft.pos.z, -70, 70);
  if (raft.speed > .3) { const ty = Math.atan2(raft.vel.x, raft.vel.z); let dy = ty - raft.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); raft.yaw += dy * (1 - Math.exp(-dt * 4)); }
  const bob = RM ? 0 : 1;
  raft.g.position.set(raft.pos.x, Math.sin(T * 1.6) * .06 * bob, raft.pos.z);
  raft.g.rotation.set(Math.sin(T * 1.3) * .035 * bob + raft.speed * .004, raft.yaw, Math.sin(T * 1.1 + 1) * .05 * bob, 'YXZ');
  // espuma
  wakeTimer += dt; if (raft.speed > 1 && wakeTimer > .06 && !RM) { wakeTimer = 0; wakePts.unshift({ p: raft.pos.clone().addScaledVector(raft.vel.clone().normalize(), -1.4), a: 1 }); if (wakePts.length > 60) wakePts.pop(); }
  { const d = new THREE.Object3D(); wakePts.forEach((w, i) => { w.a -= dt * .8; d.position.copy(w.p); d.scale.setScalar(Math.max(w.a, .001) * (1.4 - w.a * .4) + .3); d.updateMatrix(); wake.setMatrixAt(i, d.matrix); }); while (wakePts.length && wakePts[wakePts.length - 1].a <= 0) wakePts.pop(); wake.count = wakePts.length; wake.instanceMatrix.needsUpdate = true; }
  // rotas
  routeT += dt * 3;
  possible.visible = !raft.path.length; 
  placeAlong(routeDots, [raft.pos.clone().setY(0), ...raft.path], 1.3, RM ? 0 : routeT); routeDots.visible = raft.path.length > 0;
  // ilhas
  for (const i of islands) {
    const hot = hoverId === i.cfg.id, sel = selectedId === i.cfg.id;
    i.lift += (((hot ? .35 : 0) + (sel ? .15 : 0)) * (RM ? 0 : 1) - i.lift) * (1 - Math.exp(-dt * 6));
    i.g.position.y = i.lift; i.light.intensity = 40 + (sel ? 60 : 0) + (hot ? 30 : 0);
    const pu = sel ? 1 + (RM ? 0 : Math.sin(T * 3) * .08) : 1; i.ring.scale.setScalar(pu); i.ring.material.opacity = sel || hot ? 1 : .7; i.glow.material.opacity = sel ? .3 : hot ? .22 : .12;
    i.el.classList.toggle('is-hot', hot || sel); project(i);
  }
  // câmera
  zoom += (zoomT - zoom) * (1 - Math.exp(-dt * 6));
  camTarget.lerp(raft.pos, 1 - Math.exp(-dt * (RM ? 30 : 2.6)));
  camera.position.copy(camTarget).addScaledVector(CAM_DIR, zoom); camera.lookAt(camTarget);
  sun.position.set(camTarget.x - 50, 80, camTarget.z + 40); sun.target.position.copy(camTarget);
  // marcador da jangada
  v3.set(raft.pos.x, 6.4, raft.pos.z).project(camera); marker.style.transform = `translate(-50%,-100%) translate(${(v3.x * .5 + .5) * canvas.clientWidth}px,${(-v3.y * .5 + .5) * canvas.clientHeight}px)`;
  renderer.render(scene, camera); requestAnimationFrame(tick);
}
let pulse = 0;

// ---------- boot ----------
(async function init() {
  possible = new THREE.Group(); scene.add(possible);
  const pm = dots(400, '#ffffff', .1, .22); pm.parent.remove(pm); possible.add(pm);
  routeDots = dots(300, '#fff3b0', .2, .95);
  resize(); const prog = $('#loading-bar'); let done = 0; const total = ISLANDS.length + 1;
  const bump = () => (prog.style.width = ++done / total * 100 + '%');
  const [rm, ...ms] = await Promise.all([loadGLB('raft').then((m) => (bump(), m)).catch(() => (bump(), null)), ...ISLANDS.map((c) => loadGLB(c.model).then((m) => (bump(), m)).catch(() => (bump(), null)))]);
  raftModelHolder.add(rm ? normalize(rm, 5.6, true) : fallbackRaft());
  ISLANDS.forEach((c, i) => buildIsland(c, ms[i]));
  { const pts = []; for (const i of islands) pts.push(new THREE.Vector3(), i.dock.clone().setY(0)); let n = 0; const d = new THREE.Object3D();
    for (let k = 0; k < pts.length; k += 2) { const a = pts[k], b = pts[k + 1], L = a.distanceTo(b); for (let s = 3; s < L - 2.5; s += 2) { d.position.lerpVectors(a, b, s / L); d.updateMatrix(); pm.setMatrixAt(n++, d.matrix); } }
    pm.count = n; pm.instanceMatrix.needsUpdate = true; }
  camTarget.copy(raft.pos); if (innerWidth > 760 && innerWidth <= 1100) $('#dashboard-sidebar').classList.add('is-collapsed'); applyLang();
  $('#loading').classList.add('done'); setTimeout(() => ($('#loading').hidden = true), 600);
  requestAnimationFrame(tick);
  window.__raftt = { selectIsland, raft, islands }; // depuração
})();
