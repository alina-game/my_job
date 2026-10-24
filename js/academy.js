// 학원: 8개 반(수학, 피아노, 영어, 축구, 농구, 발레, 만들기, 미술). 반마다 하루에 한 번, 낮에만.
// 수업이 끝나면 숙제를 받고, 집 내 방 책상에서 openHomework()로 숙제를 해요.

const ACADEMY_CLASSES = [
  { key: 'math', icon: '➗', name: '수학', room: 'class', goal: 8 },
  { key: 'piano', icon: '🎹', name: '피아노', room: 'music' },
  { key: 'english', icon: '🔤', name: '영어', room: 'class', goal: 8 },
  { key: 'soccer', icon: '⚽', name: '축구', room: 'field', goal: 5 },
  { key: 'basketball', icon: '🏀', name: '농구', room: 'gym', goal: 5 },
  { key: 'ballet', icon: '🩰', name: '발레', room: 'ballet', goal: 4 },
  { key: 'craft', icon: '✂️', name: '만들기', room: 'craft' },
  { key: 'art', icon: '🎨', name: '미술', room: 'craft' },
];

const NOTE_NAMES = ['도', '레', '미', '파', '솔', '라', '시', '도'];
const NOTE_FREQ = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];
const NOTE_KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];
const SONGS = [
  { name: '나비야', notes: [4, 2, 2, 3, 1, 1, 0, 1, 2, 3, 4, 4, 4] },
  { name: '작은 별', notes: [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0] },
  { name: '비행기', notes: [2, 1, 0, 1, 2, 2, 2, 1, 1, 1, 2, 4, 4] },
];
const BALLET_POSES = [
  { key: 'ArrowLeft', arrow: '←', name: '플리에' },
  { key: 'ArrowUp', arrow: '↑', name: '를르베' },
  { key: 'ArrowRight', arrow: '→', name: '아라베스크' },
  { key: 'ArrowDown', arrow: '↓', name: '파세' },
];
const ACADEMY_WORDS = (typeof WORDS !== 'undefined') ? WORDS : [['🍎', '사과', 'apple'], ['🐶', '강아지', 'dog'], ['🐱', '고양이', 'cat'], ['⭐', '별', 'star'], ['🚗', '자동차', 'car'], ['🐟', '물고기', 'fish']];
const ART_THEMES = ['사과를 그려요 🍎', '고양이를 그려요 🐱', '우리 집을 그려요 🏠', '무지개를 그려요 🌈', '꽃을 그려요 🌷'];
const CRAFTS = [
  {
    name: '집', pieces: [
      { name: '지붕', color: '#e53935', pts: [[-70, 0], [70, 0], [0, -55]], tx: 0, ty: -60 },
      { name: '벽', color: '#ffd54f', pts: [[-55, -45], [55, -45], [55, 45], [-55, 45]], tx: 0, ty: 25 },
      { name: '문', color: '#8d5a2b', pts: [[-14, -25], [14, -25], [14, 25], [-14, 25]], tx: 15, ty: 45 },
      { name: '창문', color: '#64b5f6', pts: [[-14, -14], [14, -14], [14, 14], [-14, 14]], tx: -28, ty: 10 },
      { name: '굴뚝', color: '#78909c', pts: [[-9, -20], [9, -20], [9, 20], [-9, 20]], tx: 40, ty: -95 },
    ],
  },
  {
    name: '배', pieces: [
      { name: '배 바닥', color: '#8d5a2b', pts: [[-90, -20], [90, -20], [60, 20], [-60, 20]], tx: 0, ty: 70 },
      { name: '돛대', color: '#5d4037', pts: [[-5, -70], [5, -70], [5, 70], [-5, 70]], tx: 0, ty: -20 },
      { name: '큰 돛', color: '#ffffff', pts: [[0, -60], [0, 60], [-70, 60]], tx: -8, ty: -15 },
      { name: '작은 돛', color: '#ffeb3b', pts: [[0, -40], [0, 40], [50, 40]], tx: 8, ty: -5 },
      { name: '깃발', color: '#e53935', pts: [[0, -12], [0, 12], [30, 0]], tx: 5, ty: -95 },
    ],
  },
];

let academyAudio = null;
function playNote(i) {
  try {
    if (!academyAudio) academyAudio = new (window.AudioContext || window.webkitAudioContext)();
    const ac = academyAudio, o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle';
    o.frequency.value = NOTE_FREQ[i];
    g.gain.setValueAtTime(0.0001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.35, ac.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.6);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.65);
  } catch (e) { /* 소리 없이 계속 */ }
}

function pointInPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function drawPoly(ctx, pts, x, y, fill, stroke) {
  ctx.beginPath();
  pts.forEach(([px, py], k) => k ? ctx.lineTo(x + px, y + py) : ctx.moveTo(x + px, y + py));
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

Game.scenes.academy = {
  enter() {
    this.t = 0;
    this.phase = 'lobby';
    this.cls = null;
    this.renderLobby();
  },

  renderLobby() {
    Game.ui.innerHTML = '';
    Game.ui.append(
      h('div', { class: 'topbar' },
        h('button', { class: 'btn small gray', onclick: () => Game.go('town') }, '🚪 나가기'),
        h('span', {}, '📚 학원 · 듣고 싶은 반을 골라요'),
        h('div', { class: 'spacer' }),
        h('div', { class: 'pill' }, `📝 숙제 ${State.data.homework.length}개`)),
      h('div', {
        style: 'position:absolute;left:50%;top:120px;transform:translateX(-50%);display:grid;grid-template-columns:repeat(4,190px);gap:16px',
      }, ACADEMY_CLASSES.map(c => {
        const done = State.isDone('academy_' + c.key);
        return h('button', {
          class: 'opt', style: `width:190px;height:150px;${done ? 'background:#e8f5e9' : ''}`,
          onclick: () => done ? toast(`✅ 오늘 ${c.name} 수업은 벌써 들었어요. 내일 또 와요!`) : this.startClass(c.key),
        }, h('span', { class: 'ic' }, c.icon), `${c.name} 반`, h('span', { style: 'font-size:15px;color:#2e7d32' }, done ? '✅ 오늘 끝!' : ''));
      })),
      h('div', { class: 'help' }, '수업이 끝나면 숙제를 받아요 · 숙제는 집 내 방 책상에서 해요'));
  },

  // ---------- 수업 공통 ----------
  startClass(key) {
    const c = ACADEMY_CLASSES.find(x => x.key === key);
    this.cls = c;
    this.phase = 'class';
    this.score = 0;
    this.done = false;
    this.end = performance.now() + TIME.academy * 1000;
    this.fx = [];
    Game.ui.innerHTML = '';
    this.timerEl = h('div', { class: 'pill' }, '');
    this.scoreEl = h('div', { class: 'pill' }, '');
    Game.ui.append(h('div', { class: 'topbar' },
      h('button', { class: 'btn small red', onclick: () => this.quitClass() }, '🚪 그만하기'),
      h('span', {}, `${c.icon} ${c.name} 반`),
      h('div', { class: 'spacer' }),
      this.timerEl, this.scoreEl));
    this['setup_' + key]();
    this.updateScore();
  },

  updateScore() {
    if (!this.scoreEl) return;
    const c = this.cls, labels = { math: '맞힌 문제', english: '맞힌 단어', piano: '친 음', soccer: '골', basketball: '골인', ballet: '성공', craft: '붙인 조각', art: '그린 선' };
    this.scoreEl.textContent = `⭐ ${labels[c.key]} ${this.score}${c.goal ? ' / ' + c.goal : ''}`;
  },

  addScore(n = 1) {
    this.score += n;
    this.updateScore();
    const c = this.cls;
    if (c.goal && this.score >= c.goal) setTimeout(() => this.cls === c && this.phase === 'class' && this.finishClass(), 500);
  },

  quitClass() {
    if (this.done) return;
    this.done = true;
    toast('🚪 수업을 중간에 그만뒀어요. 숙제는 없어요');
    this.enter();
  },

  finishClass() {
    if (this.done) return;
    this.done = true;
    const c = this.cls, d = State.data;
    State.markDone('academy_' + c.key);
    if (!d.homework.some(hw => hw.subject === c.key)) d.homework.push({ subject: c.key });
    State.save();
    const msg = {
      math: `문제를 ${this.score}개 맞혔어요!`, english: `영어 단어를 ${this.score}개 맞혔어요!`,
      piano: `${this.score}음을 정확하게 쳤어요! 🎵`, soccer: `골을 ${this.score}번 넣었어요! ⚽`,
      basketball: `${this.score}번 골인했어요! 🏀`, ballet: `발레 동작을 ${this.score}번 성공했어요! 🩰`,
      craft: `${this.craft ? this.craft.name : '작품'}을(를) 만들었어요! ✂️`, art: `선생님: "${pick(['와! 색깔이 정말 예뻐요 ⭐', '멋진 그림이에요! 칭찬 스티커 하나 💮', '최고의 화가예요 🎨'])}"`,
    }[c.key];
    toast('📝 숙제를 받았어요! 집 내 방 책상에서 해요', 3000);
    modal(
      h('h2', {}, `🔔 ${c.name} 수업 끝!`),
      h('p', {}, msg),
      h('p', { style: 'color:#6a1b9a' }, `📝 ${c.name} 숙제를 받았어요. 집 내 방 책상에서 해요!`),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => this.enter() }, '확인')));
  },

  update(dt) {
    this.t += dt;
    if (this.phase !== 'class' || this.done) return;
    const left = (this.end - performance.now()) / 1000;
    this.timerEl.textContent = `⏰ ${fmt(left)}`;
    if (left <= 0) return this.finishClass();
    const u = this['upd_' + this.cls.key];
    if (u) u.call(this, dt);
    for (const f of this.fx) f.life -= dt;
    this.fx = this.fx.filter(f => f.life > 0);
  },

  onPointerDown(x, y) { if (this.phase === 'class' && !this.done && !Game.hasOverlay()) { const f = this['down_' + this.cls.key]; if (f) f.call(this, x, y); } },
  onPointerMove(x, y) { if (this.phase === 'class' && !this.done) { const f = this['move_' + this.cls.key]; if (f) f.call(this, x, y); } },
  onPointerUp(x, y) { if (this.phase === 'class' && !this.done) { const f = this['up_' + this.cls.key]; if (f) f.call(this, x, y); } },
  onKey(e) {
    if (this.phase !== 'class' || this.done || Game.hasOverlay()) return;
    if (this.cls.key === 'piano') { const i = NOTE_KEYS.indexOf(e.key.toLowerCase()); if (i >= 0) this.pressKey(i); }
    if (this.cls.key === 'ballet') { const p = BALLET_POSES.findIndex(b => b.key === e.key); if (p >= 0) this.balletInput(p); }
  },

  // ---------- 수학 / 영어 (문제 풀기) ----------
  setup_math() { this.quiz(); },
  setup_english() { this.quiz(); },

  makeQuiz() {
    if (this.cls.key === 'math') {
      const a = 2 + Math.floor(Math.random() * 8), b = 2 + Math.floor(Math.random() * 8);
      const div = Math.random() < 0.4;
      const ans = div ? b : a * b;
      const opts = new Set([ans]);
      while (opts.size < 4) { const v = ans + (Math.floor(Math.random() * 9) - 4) * (div ? 1 : 2); if (v > 0) opts.add(v); }
      return { q: div ? `${a * b} ÷ ${a} = ?` : `${a} × ${b} = ?`, ans: String(ans), opts: shuffle([...opts].map(String)) };
    }
    const w = pick(ACADEMY_WORDS);
    const opts = new Set([w[2]]);
    while (opts.size < 4) opts.add(pick(ACADEMY_WORDS)[2]);
    return { q: `${w[0]}  영어로 뭘까요?`, ans: w[2], opts: shuffle([...opts]) };
  },

  quiz() {
    if (this.done) return;
    const q = this.makeQuiz();
    if (this.quizEl) this.quizEl.remove();
    const fb = h('div', { style: 'font-size:24px;font-weight:900;color:#ffe082;min-height:32px;text-shadow:0 2px 0 #000' }, '');
    const opts = h('div', { class: 'opts' }, q.opts.map(o => h('button', {
      class: 'opt', style: 'width:170px;height:90px;font-size:28px', onclick: e => {
        if (o === q.ans) {
          opts.style.pointerEvents = 'none';
          Sound.play('good', 0.8);
          fb.textContent = '⭐ 정답!';
          this.addScore();
          setTimeout(() => this.quiz(), 600);
        } else {
          e.currentTarget.classList.remove('shake'); void e.currentTarget.offsetWidth; e.currentTarget.classList.add('shake');
          Sound.play('wrong', 0.6);
          fb.textContent = '다시 생각해 봐요 🤔';
        }
      },
    }, o)));
    this.quizEl = h('div', { style: 'position:absolute;left:0;right:0;top:110px;display:flex;flex-direction:column;align-items:center;gap:22px;pointer-events:none' },
      h('div', { style: 'color:#fff;font-size:46px;font-weight:900;height:110px;display:flex;align-items:center' }, q.q),
      h('div', { style: 'pointer-events:auto' }, opts), fb);
    Game.ui.append(this.quizEl);
  },

  // ---------- 피아노 ----------
  setup_piano() {
    this.song = pick(SONGS);
    this.noteIdx = 0;
    this.lit = -1;
    this.litT = 0;
    this.wrongT = 0;
    this.songsDone = 0;
    Game.ui.append(h('div', { class: 'help' }, '빛나는 건반을 누르거나 키보드 A S D F G H J K 를 눌러요'));
  },
  keyRect(i) { return { x: 160 + i * 80, y: 370, w: 78, h: 190 }; },
  down_piano(x, y) {
    for (let i = 0; i < 8; i++) {
      const r = this.keyRect(i);
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return this.pressKey(i);
    }
  },
  pressKey(i) {
    if (i == null || i < 0 || i > 7) return;
    playNote(i);
    if (this.noteIdx >= this.song.notes.length) return;
    this.lit = i; this.litT = 0.25;
    const want = this.song.notes[this.noteIdx];
    if (i === want) {
      this.noteIdx++;
      this.addScore();
      this.fx.push({ x: this.keyRect(i).x + 39, y: 350, life: 0.8, s: '🎵' });
      if (this.noteIdx >= this.song.notes.length) {
        this.songsDone++;
        toast(`🎶 「${this.song.name}」 완주! 짝짝짝!`);
        if (this.songsDone >= 2) { const c = this.cls; return setTimeout(() => this.cls === c && this.phase === 'class' && this.finishClass(), 400); }
        this.song = pick(SONGS.filter(s => s !== this.song));
        this.noteIdx = 0;
      }
    } else this.wrongT = 0.4;
  },
  upd_piano(dt) { this.litT -= dt; this.wrongT -= dt; },

  // ---------- 축구 ----------
  setup_soccer() {
    this.ball = null; this.aim = { x: 480, y: 170 }; this.charge = null; this.result = ''; this.resultT = 0;
    Game.ui.append(h('div', { class: 'help' }, '골대를 겨냥하고 꾹 눌러 힘을 모은 다음 떼면 슛! (너무 세면 골대 위로 날아가요)'));
  },
  keeperX() { return 480 + Math.sin(this.t * 1.7) * 120; },
  down_soccer(x, y) { if (!this.ball) { this.aim = { x, y }; this.charge = 0; } },
  move_soccer(x, y) { this.aim = { x, y }; },
  up_soccer(x, y) {
    if (this.charge == null || this.ball) return;
    const p = this.charge;
    this.charge = null;
    const tx = clamp(x, 200, 760), ty = clamp(y, 80, 300);
    const reach = p < 0.3 ? 0.55 : 1;
    this.ball = { sx: 480, sy: 500, tx: 480 + (tx - 480) * reach, ty: 500 + (ty - 500) * reach, t: 0, p };
  },
  upd_soccer(dt) {
    if (this.charge != null) this.charge = Math.min(1.1, this.charge + dt * 0.9);
    this.resultT -= dt;
    const b = this.ball;
    if (!b) return;
    b.t += dt / 0.6;
    if (b.t >= 1 && !b.landed) {
      b.landed = true;
      const inGoal = b.tx > 330 && b.tx < 630 && b.ty > 110 && b.ty < 235;
      const saved = Math.abs(b.tx - this.keeperX()) < 50;
      if (b.p < 0.3) this.result = '힘이 약해요! 💨';
      else if (b.p > 0.95) this.result = '너무 세게 찼어요! 골대 위로~ 🚀';
      else if (!inGoal) this.result = '골대 밖으로 나갔어요! 😅';
      else if (saved) this.result = '골키퍼가 막았어요! 🧤';
      else { this.result = '골~~~인! ⚽🎉'; this.addScore(); }
      this.resultT = 1.3;
      setTimeout(() => { this.ball = null; }, 900);
    }
  },

  // ---------- 농구 ----------
  setup_basketball() {
    this.shot = null; this.result = ''; this.resultT = 0;
    Game.ui.append(h('div', { class: 'help' }, '힘 막대가 초록색 칸에 왔을 때 화면을 눌러 슛!'));
  },
  powerNow() { return (Math.sin(this.t * 2.6) + 1) / 2; },
  down_basketball() {
    if (this.shot) return;
    const p = this.powerNow();
    const good = Math.abs(p - 0.7) < 0.09;
    const ex = good ? 700 : 240 + (700 - 240) * (p / 0.7);
    this.shot = { p, good, sx: 250, sy: 420, ex, ey: good ? 205 : 230 + (p > 0.7 ? -40 : 60), t: 0 };
  },
  upd_basketball(dt) {
    this.resultT -= dt;
    const s = this.shot;
    if (!s) return;
    s.t += dt / 0.9;
    if (s.t >= 1 && !s.done) {
      s.done = true;
      if (s.good) { this.result = '골인! 🏀🎉'; this.addScore(); }
      else this.result = s.p > 0.7 ? '너무 세게 던졌어요! 🙈' : '조금 더 세게! 💪';
      this.resultT = 1.2;
      setTimeout(() => { this.shot = null; }, 700);
    }
  },

  // ---------- 발레 ----------
  setup_ballet() {
    this.seqLen = 2;
    this.newBalletRound();
    Game.ui.append(h('div', { class: 'items-bar' }, BALLET_POSES.map((p, i) =>
      h('button', { class: 'btn pink', onclick: () => this.balletInput(i) }, `${p.arrow} ${p.name}`))));
  },
  newBalletRound(same) {
    if (!same) this.seq = Array.from({ length: this.seqLen }, () => Math.floor(Math.random() * 4));
    this.demoT = 0;
    this.demo = true;
    this.inputs = [];
    this.pose = -1;
    this.poseT = 0;
  },
  balletInput(i) {
    if (this.demo || this.done) return;
    this.pose = i; this.poseT = 0.6;
    const k = this.inputs.length;
    this.inputs.push(i);
    if (this.seq[k] !== i) {
      toast('앗, 순서가 달라요! 선생님을 다시 볼까요? 🩰');
      this.newBalletRound(true);
      return;
    }
    if (this.inputs.length === this.seq.length) {
      toast('👏 브라보! 아름다워요!');
      this.seqLen = Math.min(6, this.seqLen + 1);
      this.addScore();
      if (!this.done) setTimeout(() => !this.done && this.newBalletRound(), 700);
      this.demo = true; this.demoT = -0.7;
    }
  },
  upd_ballet(dt) {
    this.poseT -= dt;
    if (this.demo) {
      this.demoT += dt;
      if (this.demoT >= this.seq.length * 0.9 + 0.3) this.demo = false;
    }
  },

  // ---------- 만들기 ----------
  setup_craft() {
    const c = pick(CRAFTS);
    this.craft = c;
    this.craftCenter = { x: 640, y: 330 };
    this.pieces = shuffle(c.pieces).map((p, k) => ({ ...p, x: 150 + (k % 2) * 150, y: 190 + Math.floor(k / 2) * 130, placed: false }));
    this.cdrag = null;
    Game.ui.append(h('div', { class: 'help' }, `색종이 조각을 끌어서 점선 모양에 맞게 붙여요 → ${c.name} 완성!`));
  },
  down_craft(x, y) {
    for (let k = this.pieces.length - 1; k >= 0; k--) {
      const p = this.pieces[k];
      if (!p.placed && (pointInPoly(x - p.x, y - p.y, p.pts) || Math.hypot(x - p.x, y - p.y) < 30)) {
        this.cdrag = { p, dx: p.x - x, dy: p.y - y };
        return;
      }
    }
  },
  move_craft(x, y) { const d = this.cdrag; if (d) { d.p.x = x + d.dx; d.p.y = y + d.dy; } },
  up_craft() {
    const d = this.cdrag;
    this.cdrag = null;
    if (!d) return;
    const p = d.p, cx = this.craftCenter.x + p.tx, cy = this.craftCenter.y + p.ty;
    if (Math.hypot(p.x - cx, p.y - cy) < 45) {
      p.x = cx; p.y = cy; p.placed = true;
      this.fx.push({ x: cx, y: cy, life: 0.8, s: '✨' });
      this.addScore();
      if (this.pieces.every(q => q.placed)) {
        toast(`🎉 ${this.craft.name} 완성! 풀로 꼭꼭 붙였어요`);
        const c = this.cls;
        setTimeout(() => this.cls === c && this.phase === 'class' && this.finishClass(), 700);
      }
    }
  },

  // ---------- 미술 ----------
  setup_art() {
    this.theme = pick(ART_THEMES);
    this.strokes = 0;
    const cv = h('canvas', { width: 600, height: 400, style: 'position:absolute;left:250px;top:120px;background:#fff;border-radius:12px;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:crosshair' });
    const c = cv.getContext('2d');
    c.lineCap = c.lineJoin = 'round';
    this.artColor = '#222';
    const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
    let drawing = false;
    cv.addEventListener('pointerdown', e => { drawing = true; cv.setPointerCapture(e.pointerId); const p = pos(e); c.strokeStyle = this.artColor; c.lineWidth = 8; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + 0.1, p.y); c.stroke(); });
    cv.addEventListener('pointermove', e => { if (!drawing) return; const p = pos(e); c.lineTo(p.x, p.y); c.stroke(); this.strokes++; if (this.strokes % 10 === 0) { this.score = Math.floor(this.strokes / 10); this.updateScore(); } });
    const stop = () => { drawing = false; };
    cv.addEventListener('pointerup', stop); cv.addEventListener('pointercancel', stop);
    const colors = ['#222', '#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#ff80ab', '#8d5a2b', '#ffffff'];
    const sw = colors.map(col => h('div', { style: `width:40px;height:40px;border-radius:50%;background:${col};border:3px solid ${col === '#222' ? '#ff8a00' : '#fff'};cursor:pointer;box-shadow:0 2px 0 rgba(0,0,0,.2)` }));
    sw.forEach((el, k) => el.addEventListener('click', () => { this.artColor = colors[k]; sw.forEach(s => { s.style.borderColor = '#fff'; }); el.style.borderColor = '#ff8a00'; }));
    Game.ui.append(
      h('div', { style: 'position:absolute;left:250px;top:74px;width:600px;text-align:center;font-size:26px;font-weight:900;color:#5a3410' }, `오늘의 주제: ${this.theme}`),
      h('div', { style: 'position:absolute;left:150px;top:120px;display:grid;grid-template-columns:repeat(2,40px);gap:8px' }, sw),
      cv,
      h('button', { class: 'btn green', style: 'position:absolute;left:470px;top:535px', onclick: () => {
        if (this.strokes < 15) return toast('조금 더 그려 볼까요? 🖍️');
        this.finishClass();
      } }, '✅ 다 그렸어요'));
  },

  // ---------- 그리기 ----------
  draw(ctx) {
    if (this.phase === 'lobby' || !this.cls) return this.drawLobby(ctx);
    const k = this.cls.key;
    this.drawRoom(ctx, this.cls.room);
    const f = this['draw_' + k];
    if (f) f.call(this, ctx);
    for (const e of this.fx) { ctx.globalAlpha = Math.max(0, e.life); emoji(ctx, e.s, e.x, e.y - (0.8 - e.life) * 40, 30); }
    ctx.globalAlpha = 1;
  },

  drawLobby(ctx) {
    ctx.fillStyle = '#f3e5f5'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e1bee7'; for (let x = 0; x < W; x += 60) ctx.fillRect(x, 0, 30, 440);
    ctx.fillStyle = '#c5a3d6'; ctx.fillRect(0, 440, W, 160);
    emoji(ctx, '👩‍🏫', 80, 520, 70);
    bubble(ctx, '어서 와요! 오늘은 무슨 수업을 들을까요?', 280, 470, 18);
  },

  drawRoom(ctx, room) {
    if (room === 'class') {
      ctx.fillStyle = '#fff3d6'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#c69c6d'; ctx.fillRect(0, 470, W, 130);
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(150, 90, 660, 150);
      ctx.fillStyle = '#2e5e3e'; ctx.fillRect(160, 100, 640, 130);
      emoji(ctx, '👨‍🏫', 80, 230, 80);
      drawCharacter(ctx, currentLook(), 480, 560, 1, {});
      ctx.fillStyle = '#a0683a'; rr(ctx, 410, 510, 140, 22, 5); ctx.fill();
    } else if (room === 'music') {
      ctx.fillStyle = '#ede7f6'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b39ddb'; ctx.fillRect(0, 340, W, 260);
      emoji(ctx, '👩‍🏫', 80, 200, 80);
    } else if (room === 'field') {
      const g = ctx.createLinearGradient(0, 0, 0, 100);
      g.addColorStop(0, '#6ec6ff'); g.addColorStop(1, '#e3f6ff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, 100);
      ctx.fillStyle = '#4caf50'; ctx.fillRect(0, 100, W, 500);
      ctx.fillStyle = '#5cbf60'; for (let y = 100; y < H; y += 60) ctx.fillRect(0, y, W, 30);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.strokeRect(250, 100, 460, 200);
      emoji(ctx, '👨‍🏫', 80, 520, 64);
    } else if (room === 'gym') {
      ctx.fillStyle = '#ffe0b2'; ctx.fillRect(0, 0, W, 380);
      ctx.fillStyle = '#d7a86e'; ctx.fillRect(0, 380, W, 220);
      ctx.strokeStyle = '#b5834a'; ctx.lineWidth = 2;
      for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 380); ctx.lineTo(x, H); ctx.stroke(); }
      emoji(ctx, '👨‍🏫', 80, 330, 64);
    } else if (room === 'ballet') {
      ctx.fillStyle = '#fce4ec'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#d7b98e'; ctx.fillRect(0, 440, W, 160);
      ctx.fillStyle = '#dff1fb'; ctx.fillRect(330, 90, 600, 330);
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      ctx.beginPath(); ctx.moveTo(360, 90); ctx.lineTo(430, 90); ctx.lineTo(350, 300); ctx.lineTo(330, 300); ctx.fill();
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(330, 300, 600, 8);
      ctx.fillRect(360, 300, 6, 140); ctx.fillRect(890, 300, 6, 140);
      text(ctx, '거울', 880, 110, 16, '#7a9bb0');
    } else {
      ctx.fillStyle = '#fff8e1'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffcc80'; ctx.fillRect(0, 440, W, 160);
      ctx.fillStyle = '#d7a86e'; rr(ctx, 60, 120, 340, 380, 18); ctx.fill();
      emoji(ctx, '👩‍🏫', 60, 560, 56);
    }
  },

  draw_piano(ctx) {
    // 그랜드 피아노 몸통 + 악보
    ctx.fillStyle = '#212121'; rr(ctx, 150, 330, 660, 250, 20); ctx.fill();
    ctx.fillStyle = '#fff'; rr(ctx, 200, 80, 560, 150, 12); ctx.fill();
    ctx.strokeStyle = '#999'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(215, 110 + k * 12); ctx.lineTo(745, 110 + k * 12); ctx.stroke(); }
    text(ctx, `🎼 ${this.song.name}`, 480, 96, 18, '#5e35b1');
    const notes = this.song.notes, n = notes.length, gap = Math.min(40, 520 / n);
    notes.forEach((nt, k) => {
      const x = 230 + k * gap, y = 166 - nt * 6;
      ctx.fillStyle = k < this.noteIdx ? '#43a047' : k === this.noteIdx ? '#ff6f00' : '#333';
      ctx.beginPath(); ctx.ellipse(x, y, 7, 5, -0.3, 0, 7); ctx.fill();
      ctx.fillRect(x + 6, y - 28, 2, 28);
      text(ctx, NOTE_NAMES[nt], x, 210, 14, k === this.noteIdx ? '#ff6f00' : '#666');
    });
    const want = this.song.notes[this.noteIdx];
    for (let i = 0; i < 8; i++) {
      const r = this.keyRect(i);
      const lit = this.litT > 0 && this.lit === i;
      ctx.fillStyle = lit ? '#ffe082' : i === want ? '#fff7d6' : '#fff';
      rr(ctx, r.x, r.y, r.w, r.h, 6); ctx.fill();
      if (i === want) { ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 4; rr(ctx, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 6); ctx.stroke(); }
      text(ctx, NOTE_NAMES[i], r.x + r.w / 2, r.y + r.h - 40, 20, '#333');
      text(ctx, NOTE_KEYS[i].toUpperCase(), r.x + r.w / 2, r.y + r.h - 15, 13, '#999');
    }
    ctx.fillStyle = '#111';
    for (const i of [0, 1, 3, 4, 5]) rr(ctx, 160 + i * 80 + 55, 370, 46, 110, 4), ctx.fill();
    if (this.wrongT > 0) text(ctx, '다른 건반이에요! 반짝이는 건반을 눌러요', 480, 300, 20, '#d32f2f');
    else bubble(ctx, `다음은 "${NOTE_NAMES[want]}" 예요!`, 180, 300, 16);
  },

  draw_soccer(ctx) {
    // 골대 + 그물
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(330, 240); ctx.lineTo(330, 110); ctx.lineTo(630, 110); ctx.lineTo(630, 240); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1;
    for (let x = 340; x < 630; x += 15) { ctx.beginPath(); ctx.moveTo(x, 114); ctx.lineTo(x, 238); ctx.stroke(); }
    for (let y = 120; y < 240; y += 15) { ctx.beginPath(); ctx.moveTo(334, y); ctx.lineTo(626, y); ctx.stroke(); }
    // 골키퍼
    const kx = this.keeperX();
    drawCharacter(ctx, { hair: 'boy_dark', top: 'hoodie', bottom: 'black_pants', shoes: 'sneakers', hat: 'cap' }, kx, 245, 0.9, { armUp: 0.5 });
    emoji(ctx, '🧤', kx - 30, 175, 22);
    // 나
    drawCharacter(ctx, currentLook(), 420, 570, 1.1, { walk: this.ball ? 1 : 0 });
    const b = this.ball;
    if (b) {
      const t = Math.min(1, b.t), bx = b.sx + (b.tx - b.sx) * t, by = b.sy + (b.ty - b.sy) * t - Math.sin(t * Math.PI) * 60 * (b.p > 0.95 ? 3 : 1);
      emoji(ctx, '⚽', bx, b.p > 0.95 && t >= 1 ? -50 : by, 40 - t * 14);
    } else {
      emoji(ctx, '⚽', 480, 500, 40);
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.setLineDash([8, 8]); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(480, 500); ctx.lineTo(this.aim.x, this.aim.y); ctx.stroke(); ctx.setLineDash([]);
      emoji(ctx, '🎯', this.aim.x, this.aim.y, 30);
    }
    // 힘 막대
    ctx.fillStyle = 'rgba(0,0,0,.4)'; rr(ctx, 830, 330, 40, 220, 10); ctx.fill();
    const p = Math.min(1, this.charge || 0);
    ctx.fillStyle = p > 0.95 ? '#e53935' : p >= 0.3 ? '#66bb6a' : '#ffca28';
    rr(ctx, 835, 545 - 210 * p, 30, 210 * p, 8); ctx.fill();
    text(ctx, '힘', 850, 320, 16, '#fff');
    if (this.resultT > 0) text(ctx, this.result, 480, 330, 36, '#fff');
  },

  draw_basketball(ctx) {
    // 골대
    ctx.fillStyle = '#eee'; ctx.fillRect(770, 120, 10, 300);
    ctx.fillStyle = '#fff'; rr(ctx, 730, 110, 90, 70, 6); ctx.fill();
    ctx.strokeStyle = '#e53935'; ctx.lineWidth = 3; ctx.strokeRect(755, 130, 40, 30);
    ctx.strokeStyle = '#ff5722'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(700, 205, 32, 8, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5;
    for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(700 + k * 9, 210); ctx.lineTo(700 + k * 6, 250); ctx.stroke(); }
    drawCharacter(ctx, currentLook(), 230, 520, 1.3, { armUp: this.shot ? 1 : 0.6 });
    const s = this.shot;
    if (s) {
      const t = Math.min(1, s.t), mx = (s.sx + s.ex) / 2, my = 60;
      const bx = (1 - t) * (1 - t) * s.sx + 2 * (1 - t) * t * mx + t * t * s.ex;
      const by = (1 - t) * (1 - t) * s.sy + 2 * (1 - t) * t * my + t * t * s.ey;
      emoji(ctx, '🏀', bx, by, 40);
    } else emoji(ctx, '🏀', 250, 400, 40);
    // 힘 막대 (초록 칸 = 딱 좋은 힘)
    const p = this.powerNow();
    ctx.fillStyle = 'rgba(0,0,0,.45)'; rr(ctx, 360, 540, 400, 30, 10); ctx.fill();
    ctx.fillStyle = '#66bb6a'; ctx.fillRect(360 + 400 * 0.61, 540, 400 * 0.18, 30);
    ctx.fillStyle = '#fff'; ctx.fillRect(360 + 400 * p - 3, 534, 6, 42);
    text(ctx, '힘', 340, 555, 16, '#5a3410');
    if (this.resultT > 0) text(ctx, this.result, 480, 330, 36, '#e65100');
  },

  draw_ballet(ctx) {
    // 선생님 시범
    const tp = this.demo && this.demoT >= 0 ? Math.floor(this.demoT / 0.9) : -1;
    const demoPose = tp >= 0 && tp < this.seq.length ? this.seq[tp] : -1;
    this.drawDancer(ctx, { hair: 'girl_long', top: 'dress', bottom: 'plaid_skirt', shoes: 'pink_shoes', hat: 'ribbon' }, 180, 520, 1.5, demoPose);
    text(ctx, '선생님', 180, 560, 16, '#ad1457');
    // 나 (거울 앞)
    this.drawDancer(ctx, currentLook(), 620, 520, 1.6, this.poseT > 0 ? this.pose : -1);
    // 순서 카드
    ctx.fillStyle = 'rgba(255,255,255,.9)'; rr(ctx, 30, 80, 290, 150, 16); ctx.fill();
    text(ctx, this.demo ? '👀 선생님을 잘 봐요!' : '🩰 이제 따라 해요!', 175, 105, 18, '#ad1457');
    this.seq.forEach((p, k) => {
      const show = this.demo ? k <= tp : true, done = !this.demo && k < this.inputs.length;
      ctx.fillStyle = done ? '#c8e6c9' : k === tp && this.demo ? '#ffe082' : '#fce4ec';
      rr(ctx, 45 + k * 44, 130, 38, 50, 8); ctx.fill();
      text(ctx, show ? BALLET_POSES[p].arrow : '?', 64 + k * 44, 155, 24, '#6a1b9a');
    });
    if (demoPose >= 0) bubble(ctx, `${BALLET_POSES[demoPose].arrow} ${BALLET_POSES[demoPose].name}!`, 180, 330, 18);
    text(ctx, '방향키나 아래 버튼으로 따라 해요', 175, 210, 13, '#888');
  },

  drawDancer(ctx, look, x, y, s, pose) {
    ctx.save();
    let o = { armUp: 0 };
    if (pose === 0) { ctx.translate(x, y); ctx.scale(1.08, 0.88); ctx.translate(-x, -y); o.armUp = 0.35; }
    else if (pose === 1) { y -= 14; o.armUp = 1; }
    else if (pose === 2) { ctx.translate(x, y); ctx.rotate(0.2); ctx.translate(-x, -y); o.armUp = 0.6; }
    else if (pose === 3) { o.armUp = 0.8; o.walk = 1.2; }
    drawCharacter(ctx, look, x, y, s, o);
    ctx.restore();
  },

  draw_craft(ctx) {
    const c = this.craftCenter;
    ctx.fillStyle = '#fff'; rr(ctx, c.x - 200, c.y - 200, 400, 380, 16); ctx.fill();
    text(ctx, `${this.craft.name} 만들기`, c.x, c.y - 175, 22, '#5a3410');
    ctx.setLineDash([7, 6]); ctx.lineWidth = 2.5;
    for (const p of this.craft.pieces) drawPoly(ctx, p.pts, c.x + p.tx, c.y + p.ty, null, '#9e9e9e');
    ctx.setLineDash([]);
    text(ctx, '색종이 조각', 230, 145, 18, '#5a3410');
    const order = [...this.pieces].sort((a, b) => (a.placed === b.placed ? 0 : a.placed ? -1 : 1));
    for (const p of order) {
      ctx.lineWidth = 2;
      drawPoly(ctx, p.pts, p.x, p.y, p.color, 'rgba(0,0,0,.35)');
      if (!p.placed) text(ctx, p.name, p.x, p.y, 13, '#333');
    }
  },

  draw_art() {},
  draw_math() {},
  draw_english() {},
};

// ---------- 숙제 ----------
const HW_SUBJECT = { math: '➗ 수학', piano: '🎹 피아노', english: '🔤 영어', soccer: '⚽ 축구', basketball: '🏀 농구', ballet: '🩰 발레', craft: '✂️ 만들기', art: '🎨 미술' };

function makeHomeworkSet(subject) {
  const qs = [];
  const ox = (list) => shuffle(list).slice(0, 3).map(([q, a]) => ({ q, ans: a ? 'O' : 'X', opts: ['O', 'X'] }));
  if (subject === 'math') {
    for (let k = 0; k < 3; k++) {
      const a = 2 + Math.floor(Math.random() * 8), b = 2 + Math.floor(Math.random() * 8), ans = a * b;
      const opts = new Set([ans]);
      while (opts.size < 4) { const v = ans + (Math.floor(Math.random() * 7) - 3) * 2; if (v > 0) opts.add(v); }
      qs.push({ q: `${a} × ${b} = ?`, ans: String(ans), opts: shuffle([...opts].map(String)) });
    }
  } else if (subject === 'english') {
    for (const w of shuffle(ACADEMY_WORDS).slice(0, 3)) {
      const opts = new Set([w[1]]);
      while (opts.size < 4) opts.add(pick(ACADEMY_WORDS)[1]);
      qs.push({ q: `"${w[2]}" 은(는) 무슨 뜻일까요?`, ans: w[1], opts: shuffle([...opts]) });
    }
  } else if (subject === 'piano') {
    for (const n of shuffle([0, 1, 2, 3, 4, 5, 6]).slice(0, 3)) {
      qs.push({ q: '이 음표의 계이름은?', note: n, ans: NOTE_NAMES[n], opts: NOTE_NAMES.slice(0, 7) });
    }
  } else if (subject === 'soccer') {
    return ox([['축구에서 골키퍼는 손을 쓸 수 있어요', true], ['축구공은 손으로 던지며 하는 운동이에요', false], ['축구는 한 팀에 11명이 뛰어요', true], ['공이 골대 안에 들어가면 골이에요', true], ['축구에서 친구를 밀어도 돼요', false]]);
  } else if (subject === 'basketball') {
    return ox([['농구는 공을 링(골대)에 넣는 운동이에요', true], ['농구공을 들고 튀기지 않고 계속 뛰어도 돼요', false], ['공을 튀기면서 가는 것을 드리블이라고 해요', true], ['3점 슛은 1점이에요', false]]);
  } else if (subject === 'ballet') {
    const list = [['발끝으로 높이 서는 동작은?', '를르베'], ['무릎을 살짝 굽히는 동작은?', '플리에'], ['한 다리를 뒤로 길게 뻗는 동작은?', '아라베스크'], ['한 발을 다른 무릎에 붙이는 동작은?', '파세']];
    return shuffle(list).slice(0, 3).map(([q, a]) => ({ q, ans: a, opts: shuffle(BALLET_POSES.map(p => p.name)) }));
  } else {
    const mix = [['빨강', '노랑', '주황', '#e53935', '#fdd835'], ['파랑', '노랑', '초록', '#1e88e5', '#fdd835'], ['빨강', '파랑', '보라', '#e53935', '#1e88e5'], ['빨강', '하양', '분홍', '#e53935', '#ffffff'], ['검정', '하양', '회색', '#222222', '#ffffff']];
    return shuffle(mix).slice(0, 3).map(([a, b, ans, c1, c2]) => ({ q: `${a} + ${b} = ?`, colors: [c1, c2], ans, opts: shuffle(['주황', '초록', '보라', '분홍', '회색']).filter(x => x !== ans).slice(0, 3).concat(ans).sort(() => Math.random() - 0.5) }));
  }
  return qs;
}

function drawNoteCanvas(n) {
  const cv = h('canvas', { width: 220, height: 110, style: 'background:#fff;border-radius:10px;border:2px solid #eee' });
  const c = cv.getContext('2d');
  c.strokeStyle = '#555'; c.lineWidth = 1.5;
  for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(15, 25 + k * 12); c.lineTo(205, 25 + k * 12); c.stroke(); }
  emoji(c, '🎼', 30, 49, 30);
  const y = 85 - n * 6;   // 도 = 아래 덧줄
  if (n === 0) { c.beginPath(); c.moveTo(100, 85); c.lineTo(140, 85); c.stroke(); }
  c.fillStyle = '#222';
  c.beginPath(); c.ellipse(120, y, 8, 6, -0.3, 0, 7); c.fill();
  c.fillRect(127, y - 34, 2.5, 34);
  return cv;
}

function openHomework() {
  const d = State.data;
  if (!d.homework.length) {
    const o = modal(h('h2', {}, '📝 숙제'), h('p', {}, '숙제가 없어요! 학원에 가면 숙제를 받아요'),
      h('div', { class: 'row' }, h('button', { class: 'btn gray', onclick: () => o.remove() }, '닫기')));
    return o;
  }
  const o = modal(
    h('h2', {}, '📝 숙제할 시간!'),
    h('p', {}, '어떤 숙제부터 할까요?'),
    h('div', { class: 'row' }, d.homework.map(hw => h('button', {
      class: 'btn blue', onclick: () => { o.remove(); openWorksheet(hw.subject); },
    }, `${HW_SUBJECT[hw.subject] || hw.subject} 숙제`))),
    h('div', { class: 'row' }, h('button', { class: 'btn gray', onclick: () => o.remove() }, '나중에 하기')));
  return o;
}

function openWorksheet(subject) {
  const qs = makeHomeworkSet(subject);
  let idx = 0;
  const body = h('div', {});
  const o = modal(h('h2', {}, `📝 ${HW_SUBJECT[subject] || subject} 숙제`), body);
  const show = () => {
    body.innerHTML = '';
    if (idx >= qs.length) {
      const d = State.data;
      d.homework = d.homework.filter(hw => hw.subject !== subject);
      State.save();
      const allDone = !d.homework.length;
      if (allDone) { State.markDone('homework'); toast('✅ 숙제 끝! 엄마가 좋아하실 거예요', 3000); }
      body.append(
        h('p', { style: 'font-size:26px' }, '💯 참 잘했어요!'),
        h('div', { class: 'row' },
          !allDone ? h('button', { class: 'btn blue', onclick: () => { o.remove(); openHomework(); } }, '다음 숙제') : null,
          h('button', { class: 'btn', onclick: () => o.remove() }, '닫기')));
      return;
    }
    const q = qs[idx];
    const fb = h('p', { style: 'min-height:28px;color:#d32f2f' }, '');
    body.append(h('p', { style: 'color:#888;font-size:16px' }, `문제 ${idx + 1} / ${qs.length}`), h('p', { style: 'font-size:26px;font-weight:bold' }, q.q));
    if (q.note != null) body.append(drawNoteCanvas(q.note));
    if (q.colors) body.append(h('div', { style: 'display:flex;gap:14px;justify-content:center;font-size:30px;align-items:center' },
      h('span', { style: `display:inline-block;width:50px;height:50px;border-radius:50%;background:${q.colors[0]};border:2px solid #ccc` }), '+',
      h('span', { style: `display:inline-block;width:50px;height:50px;border-radius:50%;background:${q.colors[1]};border:2px solid #ccc` }), '= ?'));
    body.append(h('div', { class: 'row' }, q.opts.map(op => h('button', {
      class: 'btn small blue', style: 'font-size:22px;padding:10px 20px', onclick: () => {
        if (op === q.ans) { idx++; show(); }
        else fb.textContent = '다시 생각해 봐요 🤔';
      },
    }, op))), fb);
  };
  show();
  return o;
}
