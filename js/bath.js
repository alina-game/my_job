// 화장실: 손 씻기, 양치하기, 목욕하기(문지르면 거품), 변기 물 내리기.
// 씻으면 그날 밤 병에 덜 걸려요.

const BATH_ACTS = {
  hands: { label: '🧼 손 씻기', hint: '손 위를 문질러서 비누 거품을 내요!', done: '🧼 손이 깨끗해졌어요! ✨', area: { x: 480, y: 380, r: 130 } },
  teeth: { label: '🦷 양치하기', hint: '칫솔로 이를 문질러서 닦아요!', done: '🦷 이가 반짝반짝해요! ✨', area: { x: 480, y: 330, r: 90 } },
  bath: { label: '🛁 목욕하기', hint: '몸을 문질러서 거품 목욕을 해요!', done: '🛁 목욕 끝! 뽀송뽀송해요 ✨', area: { x: 480, y: 330, r: 170 } },
};
const RUB_NEED = FAST ? 600 : 1800;

Game.scenes.bath = {
  enter() {
    this.t = 0;
    this.act = null;
    this.flush = 0;
    this.bubbles = [];
    this.render();
  },

  render() {
    Game.ui.innerHTML = '';
    this.progEl = h('div', { class: 'progress', style: 'width:300px;margin:0' }, h('div', { style: 'width:0%' }));
    Game.ui.append(h('div', { class: 'topbar' },
      h('button', { class: 'btn small gray', onclick: () => this.act ? (this.act = null, this.render()) : Game.go('home') }, this.act ? '⬅ 그만하기' : '🚪 나가기'),
      h('span', {}, this.act ? BATH_ACTS[this.act].label : '🚽 화장실'),
      h('div', { class: 'spacer' }),
      this.act ? this.progEl : (State.data.washed ? h('div', { class: 'pill' }, '✨ 오늘 씻었어요') : null)));
    if (this.act) {
      Game.ui.append(h('div', { class: 'help', style: 'font-size:18px' }, BATH_ACTS[this.act].hint));
      return;
    }
    Game.ui.append(h('div', { class: 'items-bar' },
      Object.keys(BATH_ACTS).map(k => h('button', { class: 'btn blue', onclick: () => this.start(k) }, BATH_ACTS[k].label)),
      h('button', { class: 'btn', onclick: () => this.useToilet() }, '🚽 변기 쓰기')));
  },

  start(k) {
    this.act = k;
    this.prog = 0;
    this.rub = null;
    this.doneT = 0;
    this.bubbles = [];
    this.render();
  },

  useToilet() {
    if (this.flush > 0) return;
    this.flush = 2;
    toast('🚽 볼일 끝! 물을 내려요… 쏴아아~ 🌀');
    setTimeout(() => toast('🧼 손도 꼭 씻어요!'), 2100);
  },

  onPointerDown(x, y) { if (this.act && !this.doneT) this.rub = { x, y }; },
  onPointerUp() { this.rub = null; },
  onPointerMove(x, y) {
    if (this.act) this.brush = { x, y };
    const r = this.rub;
    if (!r || this.doneT) return;
    const a = BATH_ACTS[this.act].area;
    if (Math.hypot(x - a.x, y - a.y) < a.r) {
      this.prog += Math.hypot(x - r.x, y - r.y) / RUB_NEED;
      if (Math.random() < 0.5) this.bubbles.push({ x: x + (Math.random() - 0.5) * 30, y: y + (Math.random() - 0.5) * 30, r: 6 + Math.random() * 14, life: 2.5 });
      this.progEl.firstChild.style.width = Math.min(100, this.prog * 100) + '%';
      if (this.prog >= 1) {
        this.doneT = 1.5;
        State.data.washed = true;
        State.markDone('wash');
        toast(BATH_ACTS[this.act].done, 2500);
      }
    }
    r.x = x; r.y = y;
  },

  update(dt) {
    this.t += dt;
    this.flush = Math.max(0, this.flush - dt);
    for (const b of this.bubbles) b.life -= dt * (this.doneT ? 3 : 0.4);
    this.bubbles = this.bubbles.filter(b => b.life > 0);
    if (this.doneT) {
      this.doneT -= dt;
      if (this.doneT <= 0) { this.act = null; this.doneT = 0; this.render(); }
    }
  },

  draw(ctx) {
    // 타일 벽 + 바닥
    ctx.fillStyle = '#e3f4fb'; ctx.fillRect(0, 0, W, 430);
    ctx.strokeStyle = '#c5e3ef'; ctx.lineWidth = 2;
    for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 430); ctx.stroke(); }
    for (let y = 0; y < 430; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.fillStyle = '#b0bec5'; ctx.fillRect(0, 430, W, 170);

    // 세면대 + 거울
    ctx.fillStyle = '#cfd8dc'; rr(ctx, 120, 110, 160, 120, 14); ctx.fill();
    ctx.fillStyle = '#eaf7ff'; rr(ctx, 130, 120, 140, 100, 10); ctx.fill();
    ctx.fillStyle = '#fff'; rr(ctx, 110, 290, 180, 50, 20); ctx.fill();
    ctx.fillRect(185, 340, 30, 100);
    ctx.fillStyle = '#90a4ae'; ctx.fillRect(195, 270, 10, 26);
    text(ctx, '세면대', 200, 460, 18, '#37474f');
    // 변기
    ctx.fillStyle = '#fff';
    rr(ctx, 440, 270, 90, 90, 10); ctx.fill();
    ctx.beginPath(); ctx.ellipse(485, 390, 60, 30, 0, 0, 7); ctx.fill();
    ctx.fillRect(455, 390, 60, 50);
    ctx.fillStyle = this.flush > 0 ? '#4fc3f7' : '#b3e5fc';
    ctx.beginPath(); ctx.ellipse(485, 388, 42, 18, 0, 0, 7); ctx.fill();
    if (this.flush > 0) {
      ctx.strokeStyle = '#0288d1'; ctx.lineWidth = 3;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(485, 388, 8 + k * 9, this.t * 8 + k, this.t * 8 + k + 4); ctx.stroke(); }
    }
    ctx.fillStyle = '#b0bec5'; ctx.fillRect(500, 285, 18, 8);
    text(ctx, '변기', 485, 460, 18, '#37474f');
    // 욕조
    ctx.fillStyle = '#fff'; rr(ctx, 640, 320, 270, 110, 30); ctx.fill();
    ctx.fillStyle = '#b3e5fc'; rr(ctx, 655, 328, 240, 24, 12); ctx.fill();
    ctx.fillStyle = '#90a4ae'; ctx.fillRect(860, 270, 10, 55); ctx.fillRect(840, 270, 30, 10);
    text(ctx, '욕조', 775, 460, 18, '#37474f');

    if (!this.act) {
      drawCharacter(ctx, currentLook(), 330, 520, 1.2, { sick: State.data.sick });
      return;
    }

    // 가까이 보기
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(0, 62, W, H);
    const id = currentLook();
    if (this.act === 'hands') {
      ctx.fillStyle = '#b0bec5'; rr(ctx, 440, 90, 80, 30, 8); ctx.fill(); ctx.fillRect(470, 120, 20, 40);
      ctx.fillStyle = 'rgba(100,180,255,.5)'; ctx.fillRect(472, 160, 16, 150 + Math.sin(this.t * 20) * 4);
      ctx.fillStyle = '#eceff1'; ctx.beginPath(); ctx.ellipse(480, 470, 260, 60, 0, 0, 7); ctx.fill();
      for (const k of [-1, 1]) {
        ctx.save(); ctx.translate(480 + k * 45, 390); ctx.rotate(k * 0.3);
        ctx.fillStyle = SKIN; rr(ctx, -40, -50, 80, 110, 36); ctx.fill();
        for (let f = 0; f < 4; f++) { rr(ctx, -36 + f * 19, -88, 16, 50, 8); ctx.fill(); }
        ctx.restore();
      }
    } else if (this.act === 'teeth') {
      ctx.save(); ctx.translate(480, 250); ctx.scale(6, 6);
      drawHead(ctx, id.hair, { mouthOpen: true });
      ctx.restore();
      ctx.fillStyle = '#fff'; ctx.fillRect(462, 300, 36, 8);
    } else {
      ctx.fillStyle = '#fff'; rr(ctx, 200, 340, 560, 200, 60); ctx.fill();
      drawCharacter(ctx, id, 480, 560, 2.6, {});
      ctx.fillStyle = '#b3e5fc'; ctx.fillRect(215, 400, 530, 30);
      ctx.fillStyle = '#fff'; rr(ctx, 200, 420, 560, 140, 40); ctx.fill();
    }
    for (const b of this.bubbles) {
      ctx.globalAlpha = Math.min(1, b.life);
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.strokeStyle = '#8fd3ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(b.x, b.y + Math.sin(this.t * 3 + b.r) * 3, b.r, 0, 7); ctx.fill(); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (this.act === 'teeth' && this.brush) {
      const { x, y } = this.brush;
      ctx.fillStyle = '#42a5f5'; rr(ctx, x, y - 6, 120, 12, 6); ctx.fill();
      ctx.fillStyle = '#fff'; rr(ctx, x - 26, y - 16, 30, 14, 3); ctx.fill();
    }
    if (this.doneT) for (let k = 0; k < 6; k++) emoji(ctx, '✨', 480 + Math.cos(k + this.t * 3) * 150, 330 + Math.sin(k * 2 + this.t * 3) * 100, 30);
  },
};
