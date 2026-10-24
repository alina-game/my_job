// 미술 체험관: 최대 30분 동안 자유롭게 그림 그리기. 시간이 지나면 자동으로 밖으로.

const ART_COLORS = ['#222222', '#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c7be', '#007aff', '#5856d6', '#af52de', '#ff2d92', '#8e5a2b', '#ffffff'];
const ART_SIZES = [4, 10, 22];

Game.scenes.art = {
  enter() {
    this.color = ART_COLORS[0];
    this.size = ART_SIZES[1];
    this.erasing = false;
    this.end = performance.now() + TIME.art * 1000;
    this.done = false;

    const cv = h('canvas', { id: 'artCanvas', width: 795, height: 515 });
    this.cv = cv;
    this.c = cv.getContext('2d');
    this.c.lineCap = this.c.lineJoin = 'round';

    const pos = e => {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height };
    };
    cv.addEventListener('pointerdown', e => {
      this.drawing = true;
      cv.setPointerCapture(e.pointerId);
      const p = pos(e);
      this.c.strokeStyle = this.erasing ? '#ffffff' : this.color;
      this.c.lineWidth = this.erasing ? this.size * 2 : this.size;
      this.c.beginPath(); this.c.moveTo(p.x, p.y); this.c.lineTo(p.x + 0.1, p.y); this.c.stroke();
    });
    cv.addEventListener('pointermove', e => {
      if (!this.drawing) return;
      const p = pos(e);
      this.c.lineTo(p.x, p.y); this.c.stroke();
    });
    const stop = () => { this.drawing = false; };
    cv.addEventListener('pointerup', stop);
    cv.addEventListener('pointercancel', stop);

    this.timerEl = h('div', { class: 'pill' }, '');
    Game.ui.append(
      h('div', { class: 'topbar' },
        h('button', { class: 'btn small red', onclick: () => Game.go('town') }, '🚪 나가기'),
        h('span', {}, '🎨 미술 체험관 · 자유롭게 그려요!'),
        h('div', { class: 'spacer' }),
        this.timerEl),
      this.buildTools(),
      cv);
  },

  buildTools() {
    const sw = ART_COLORS.map(c => h('div', { class: 'swatch' + (c === this.color ? ' on' : ''), style: `background:${c}` }));
    sw.forEach((el, i) => el.addEventListener('click', () => {
      this.color = ART_COLORS[i];
      this.erasing = false;
      sw.forEach(s => s.classList.remove('on')); el.classList.add('on');
      eraser.classList.remove('on');
    }));
    const sz = ART_SIZES.map(s => h('div', { class: 'size' + (s === this.size ? ' on' : '') }, h('i', { style: `width:${s + 4}px;height:${s + 4}px` })));
    sz.forEach((el, i) => el.addEventListener('click', () => {
      this.size = ART_SIZES[i];
      sz.forEach(s => s.classList.remove('on')); el.classList.add('on');
    }));
    const eraser = h('button', { class: 'btn small gray', onclick: () => { this.erasing = true; eraser.classList.add('on'); } }, '🧽 지우개');
    return h('div', { class: 'art-tools' },
      h('div', { class: 'swatches' }, sw),
      h('div', { class: 'sizes' }, sz),
      eraser,
      h('button', {
        class: 'btn small gray', onclick: () => { this.c.fillStyle = '#fff'; this.c.fillRect(0, 0, this.cv.width, this.cv.height); },
      }, '🗑️ 모두 지우기'));
  },

  update() {
    if (this.done) return;
    const left = (this.end - performance.now()) / 1000;
    this.timerEl.textContent = `⏰ 남은 시간 ${fmt(left)}`;
    if (left <= 0) {
      this.done = true;
      toast(`⏰ ${Math.round(TIME.art / 60)}분이 지나서 밖으로 나왔어요!`, 3000);
      Game.go('town');
    }
  },

  draw(ctx) {
    ctx.fillStyle = '#fff3b0'; ctx.fillRect(0, 0, W, H);
    const splats = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];
    splats.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(30 + i * 22, 560 - (i % 2) * 20, 14, 0, 7); ctx.fill();
    });
  },
};
