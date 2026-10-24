// 게임 엔진: 화면(scene) 전환, 게임 루프, 공용 도우미 함수

const W = 960, H = 600;
const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
const TEXT_FONT = '"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif';

const Game = {
  scenes: {},
  scene: null,
  sceneName: '',
  keys: {},

  go(name, params = {}) {
    if (this.scene && this.scene.exit) this.scene.exit();
    this.ui.innerHTML = '';
    this.keys = {};
    this.sceneName = name;
    this.scene = this.scenes[name];
    if (this.scene.enter) this.scene.enter(params);
  },

  hasOverlay() {
    return !!this.ui.querySelector('.overlay');
  },

  fit() {
    const s = Math.min(innerWidth / W, innerHeight / H) * 0.98;
    this.root.style.transform = `translate(-50%, -50%) scale(${s})`;
  },

  toCanvas(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  },

  loop(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000);
    this.last = t;
    const sc = this.scene;
    if (sc) {
      if (sc.update) sc.update(dt);
      if (typeof Sound !== 'undefined') Sound.tick(dt);
      this.ctx.clearRect(0, 0, W, H);
      if (sc.draw) sc.draw(this.ctx);
    }
    requestAnimationFrame(tt => this.loop(tt));
  },
};

// ---------- DOM 도우미 ----------
function h(tag, props, ...children) {
  const e = document.createElement(tag);
  for (const k in props || {}) {
    const v = props[k];
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'disabled') e.disabled = true;
    else e.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return e;
}

function modal(...children) {
  const o = h('div', { class: 'overlay' }, h('div', { class: 'card' }, ...children));
  Game.ui.append(o);
  return o;
}

function toast(msg, ms = 2300) {
  const box = document.getElementById('toasts');
  const t = h('div', { class: 'toast' }, msg);
  box.append(t);
  setTimeout(() => { t.style.opacity = '0'; }, ms);
  setTimeout(() => t.remove(), ms + 450);
}

function floatText(text, x, y) {
  const f = h('div', { class: 'float', style: `left:${x}px;top:${y}px` }, text);
  Game.ui.append(f);
  setTimeout(() => f.remove(), 850);
}

// 버튼 위치(게임 화면 좌표)
function elPos(el) {
  const r = el.getBoundingClientRect(), g = Game.root.getBoundingClientRect();
  const s = g.width / W;
  return { x: (r.left - g.left + r.width / 2) / s, y: (r.top - g.top) / s };
}

// ---------- 기타 도우미 ----------
function fmt(sec) {
  sec = Math.max(0, Math.ceil(sec));
  return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

// 받침에 따라 조사 고르기: josa('빵집', '이', '가') -> '빵집이'
function josa(word, withBatchim, without) {
  const code = word.charCodeAt(word.length - 1) - 0xAC00;
  if (code < 0 || code > 11171) return word + withBatchim + '(' + without + ')';
  return word + (code % 28 ? withBatchim : without);
}

function seeded(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = s * 16807 % 2147483647, (s - 1) / 2147483646);
}

// ---------- 캔버스 도우미 ----------
function rr(ctx, x, y, w, hh, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + hh, r);
  ctx.arcTo(x + w, y + hh, x, y + hh, r);
  ctx.arcTo(x, y + hh, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function emoji(ctx, ch, x, y, size) {
  ctx.font = `${size}px ${EMOJI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  ctx.fillText(ch, x, y);
}
function text(ctx, s, x, y, size, color = '#333', align = 'center', weight = 'bold') {
  ctx.font = `${weight} ${size}px ${TEXT_FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp((n >> 16) + amt, 0, 255), g = clamp(((n >> 8) & 255) + amt, 0, 255), b = clamp((n & 255) + amt, 0, 255);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function bubble(ctx, s, x, y, size = 20) {
  ctx.font = `bold ${size}px ${TEXT_FONT}`;
  const w = ctx.measureText(s).width + 30, hh = size + 22;
  ctx.fillStyle = '#fff';
  rr(ctx, x - w / 2, y - hh, w, hh, 14);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 1); ctx.lineTo(x + 8, y - 1); ctx.lineTo(x, y + 12);
  ctx.fill();
  text(ctx, s, x, y - hh / 2, size, '#333');
}
