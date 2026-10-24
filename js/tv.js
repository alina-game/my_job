// TV: 리모컨으로 채널을 바꿔서 만화, 날씨, 뉴스, 음악을 봐요.

const CHANNELS = ['🎬 만화', '☀️ 날씨', '📰 뉴스', '🎵 음악'];
const SCREEN = { x: 150, y: 80, w: 660, h: 380 };


Game.scenes.tv = {
  enter() {
    this.t = 0;
    this.ch = 0;
    this.noise = 0.4;
    const d = State.data;
    const sick = d.cats.filter(c => c.sick).length;
    this.news = [
      `오늘은 ${d.day}일째! 동네${d.maxTown}까지 열렸어요`,
      d.cats.length ? `우리 집 고양이 ${d.cats.length}마리, 모두 귀여워요 🐱` : '길고양이가 동네에 나타났대요! 🐱',
      sick ? '고양이가 아프면 동물병원에 데려가요 🐾' : '감기 조심! 손을 깨끗이 씻어요 🧼',
      `학교 칭찬 스티커 ⭐ ${d.stickers}개 모았어요`,
      `내일 날씨는 ${weatherFor(d.day + 1)[1]}이래요`,
    ];
    Game.ui.append(
      h('div', { class: 'topbar' },
        h('button', { class: 'btn small gray', onclick: () => Game.go('home') }, '⬅ TV 끄기'),
        h('span', {}, '📺 TV 보기')),
      h('div', { class: 'items-bar' }, CHANNELS.map((c, i) => h('button', {
        class: 'btn pink', onclick: () => { this.ch = i; this.noise = 0.35; },
      }, `${i + 1}번 ${c}`))));
  },

  update(dt) {
    this.t += dt;
    this.noise = Math.max(0, this.noise - dt);
  },

  draw(ctx) {
    // 거실 + TV
    ctx.fillStyle = '#3e2f2a'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#222'; rr(ctx, SCREEN.x - 22, SCREEN.y - 22, SCREEN.w + 44, SCREEN.h + 44, 20); ctx.fill();
    const s = SCREEN;
    ctx.save();
    ctx.beginPath(); ctx.rect(s.x, s.y, s.w, s.h); ctx.clip();
    if (this.noise > 0) this.drawNoise(ctx);
    else [this.cartoon, this.weather, this.newsCh, this.music][this.ch].call(this, ctx);
    ctx.restore();
    text(ctx, `CH ${this.ch + 1}`, s.x + s.w - 40, s.y + 20, 16, 'rgba(255,255,255,.8)');
  },

  drawNoise(ctx) {
    const s = SCREEN;
    for (let i = 0; i < 900; i++) {
      const g = Math.floor(Math.random() * 255);
      ctx.fillStyle = `rgb(${g},${g},${g})`;
      ctx.fillRect(s.x + Math.random() * s.w, s.y + Math.random() * s.h, 12, 6);
    }
  },

  cartoon(ctx) {
    const s = SCREEN, t = this.t;
    ctx.fillStyle = '#9be7ff'; ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = '#8bc34a'; ctx.fillRect(s.x, s.y + 290, s.w, 90);
    text(ctx, '고양이 대모험', s.x + s.w / 2, s.y + 36, 28, '#e65100');
    const loop = (t * 160) % (s.w + 300);
    const bx = s.x + loop - 100, by = s.y + 300 - Math.abs(Math.sin(t * 5)) * 70;
    emoji(ctx, '🧶', bx, by - 20, 40);
    drawCat(ctx, 'cheese', bx - 120, s.y + 300 - Math.abs(Math.sin(t * 5 + 1)) * 30, 1.1, { t, happy: true });
    drawCat(ctx, 'black', bx - 240, s.y + 300 - Math.abs(Math.sin(t * 5 + 2)) * 30, 1, { t });
  },

  weather(ctx) {
    const s = SCREEN, d = State.data;
    ctx.fillStyle = '#1e88e5'; ctx.fillRect(s.x, s.y, s.w, s.h);
    text(ctx, '오늘의 날씨', s.x + s.w / 2, s.y + 40, 30, '#fff');
    [[d.day, '오늘'], [d.day + 1, '내일']].forEach(([day, label], k) => {
      const [ic, name, temp] = weatherFor(day), cx = s.x + 180 + k * 300;
      ctx.fillStyle = 'rgba(255,255,255,.2)'; rr(ctx, cx - 120, s.y + 80, 240, 260, 20); ctx.fill();
      text(ctx, label, cx, s.y + 110, 24, '#fff');
      emoji(ctx, ic, cx, s.y + 190 + Math.sin(this.t * 2 + k) * 6, 80);
      text(ctx, name, cx, s.y + 270, 24, '#fff');
      text(ctx, `${temp}°C`, cx, s.y + 310, 28, '#ffe082');
    });
  },

  newsCh(ctx) {
    const s = SCREEN;
    ctx.fillStyle = '#263238'; ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = '#37474f'; ctx.fillRect(s.x, s.y + 220, s.w, 100);
    emoji(ctx, '👩‍💼', s.x + 170, s.y + 170, 120);
    ctx.fillStyle = '#8d6e63'; ctx.fillRect(s.x + 60, s.y + 220, 240, 80);
    text(ctx, '동네 뉴스', s.x + 480, s.y + 60, 34, '#fff');
    const idx = Math.floor(this.t / 4) % this.news.length;
    ctx.fillStyle = '#fff'; rr(ctx, s.x + 340, s.y + 110, 300, 90, 12); ctx.fill();
    text(ctx, `소식 ${idx + 1} / ${this.news.length}`, s.x + 490, s.y + 130, 15, '#888');
    text(ctx, this.news[idx], s.x + 490, s.y + 165, this.news[idx].length > 18 ? 15 : 18, '#263238');
    ctx.fillStyle = '#d32f2f'; ctx.fillRect(s.x, s.y + 330, s.w, 50);
    const all = this.news.join('   ★   ');
    ctx.save(); ctx.beginPath(); ctx.rect(s.x, s.y + 330, s.w, 50); ctx.clip();
    text(ctx, all, s.x + s.w - (this.t * 90) % (s.w + all.length * 18), s.y + 355, 20, '#fff', 'left');
    ctx.restore();
  },

  music(ctx) {
    const s = SCREEN, t = this.t;
    const colors = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];
    colors.forEach((c, k) => { ctx.fillStyle = c; ctx.fillRect(s.x + k * s.w / 5, s.y, s.w / 5 + 1, s.h); });
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(s.x, s.y, s.w, s.h);
    for (let k = 0; k < 10; k++) {
      emoji(ctx, k % 2 ? '🎵' : '🎶', s.x + ((k * 97 + t * 60) % s.w), s.y + s.h - ((t * 70 + k * 53) % s.h), 34);
    }
    const bounce = Math.abs(Math.sin(t * 6)) * 20;
    drawCharacter(ctx, currentLook(), s.x + s.w / 2, s.y + 340 - bounce, 2.2, { walk: t * 12, dir: Math.sin(t * 2) > 0 ? 1 : -1 });
    text(ctx, '신나는 동요 시간 🎤', s.x + s.w / 2, s.y + 30, 24, '#fff');
  },
};
