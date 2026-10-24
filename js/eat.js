// 먹기: 두 번 터치하면 봉지가 벗겨짐. 음료/물 3입, 음식 5입.
// 일반 음식/음료는 입에 가져다 대면 먹음, 라면은 젓가락으로 집어서, 과자는 봉지에서 하나씩 꺼내서.

const MOUTH = { x: 480, y: 207 };
const PLATE = { x: 480, y: 470 };
const CHOP_HOME = { x: 720, y: 470 };
const WRAP_COLOR = { ramen: '#e94b3c', grab: '#43a047', snack: '#ff9800', drink: '#1e88e5' };
const HINT = {
  grab: '음식을 끌어서 입에 가져다 대요!',
  drink: '음료를 끌어서 입에 가져다 대요!',
  ramen: '젓가락을 끌어서 라면을 집고, 입으로 가져가요!',
  snack: '봉지에서 하나를 꺼내서 입에 가져다 대요!',
};

Game.scenes.eat = {
  enter(p) {
    this.idx = p.idx;
    this.item = State.data.bag[p.idx];
    this.cat = this.item.cat;
    this.total = this.cat === 'drink' ? 3 : 5;
    this.bites = 0;
    this.unwrapped = false;
    this.lastTap = 0;
    this.tear = 0;
    this.obj = { ...PLATE };
    this.chop = { ...CHOP_HOME };
    this.piece = null;
    this.drag = null;
    this.holding = false;
    this.yum = 0;
    this.finished = false;
    this.msg = '두 번 터치해서 봉지를 벗겨요!';
    this.t = 0;
    Game.ui.append(h('div', { class: 'topbar' },
      h('button', { class: 'btn small gray', onclick: () => Game.go('home') }, '⬅ 그만 먹기'),
      h('span', {}, `🍽️ ${this.item.icon} ${this.item.name}`)));
  },

  onPointerDown(x, y) {
    if (this.finished) return;
    const p = { x, y };
    if (!this.unwrapped) {
      if (Math.abs(x - PLATE.x) < 100 && Math.abs(y - PLATE.y) < 80) {
        const now = performance.now();
        if (now - this.lastTap < 450) {
          this.unwrapped = true;
          this.tear = 0.6;
          this.msg = HINT[this.cat];
        } else {
          this.lastTap = now;
          this.msg = '한 번 더 터치!';
        }
      }
      return;
    }
    if (this.cat === 'ramen') {
      if (dist(p, this.chop) < 70) this.drag = { o: this.chop, dx: this.chop.x - x, dy: this.chop.y - y };
    } else if (this.cat === 'snack') {
      if (Math.abs(x - PLATE.x) < 80 && Math.abs(y - PLATE.y) < 80) {
        this.piece = { x, y };
        this.drag = { o: this.piece, dx: 0, dy: 0 };
        this.msg = '입으로 가져가요!';
      }
    } else if (dist(p, this.obj) < 80) {
      this.drag = { o: this.obj, dx: this.obj.x - x, dy: this.obj.y - y };
    }
  },

  onPointerMove(x, y) {
    if (!this.drag) return;
    const o = this.drag.o;
    o.x = x + this.drag.dx;
    o.y = y + this.drag.dy;
    if (this.cat === 'ramen' && !this.holding && Math.abs(o.x - PLATE.x) < 95 && Math.abs(o.y - (PLATE.y - 40)) < 45) {
      this.holding = true;
      this.msg = '라면을 집었어요! 입으로 가져가요!';
    }
    const point = this.cat === 'grab' || this.cat === 'drink' ? { x: o.x, y: o.y - 40 } : o;
    const canBite = this.cat !== 'ramen' || this.holding;
    if (canBite && dist(point, MOUTH) < 55) this.bite();
  },

  onPointerUp() {
    this.drag = null;
    if (this.piece) { this.piece = null; this.msg = HINT.snack; }
  },

  bite() {
    this.bites++;
    this.yum = 0.7;
    this.drag = null;
    this.holding = false;
    this.piece = null;
    this.yumText = this.cat === 'drink' ? '꿀꺽!' : '냠냠!';
    if (this.bites >= this.total) {
      this.finished = true;
      State.data.bag.splice(this.idx, 1);
      State.save();
      this.msg = '다 먹었어요! 😋';
      setTimeout(() => modal(
        h('h2', {}, '😋 다 먹었어요!'),
        h('p', {}, `${josa(this.item.name, '을', '를')} 맛있게 먹었어요. 배불러요!`),
        h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => Game.go('home') }, '확인'))), 700);
    } else {
      this.msg = this.cat === 'ramen' ? '젓가락으로 또 집어요!' : HINT[this.cat];
    }
  },

  update(dt) {
    this.t += dt;
    this.yum = Math.max(0, this.yum - dt);
    this.tear = Math.max(0, this.tear - dt);
    if (!this.drag) {   // 놓으면 제자리로 돌아감
      for (const [o, home] of [[this.obj, PLATE], [this.chop, CHOP_HOME]]) {
        o.x += (home.x - o.x) * Math.min(1, dt * 10);
        o.y += (home.y - o.y) * Math.min(1, dt * 10);
      }
    }
  },

  draw(ctx) {
    ctx.fillStyle = '#fbe9d0'; ctx.fillRect(0, 0, W, H);
    // 캐릭터 (크게)
    const held = this.drag ? this.drag.o : null;
    const near = held && dist(held, MOUTH) < 170;
    const mouthOpen = near || (this.yum > 0 && Math.sin(this.t * 25) > 0);
    drawCharacter(ctx, currentLook(), 480, 170 - HEAD_Y * 3.2, 3.2, { mouthOpen });
    // 식탁
    ctx.fillStyle = '#a0683a'; ctx.fillRect(0, 380, W, 220);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(0, 380, W, 12);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(PLATE.x, PLATE.y + 40, 150, 30, 0, 0, 7); ctx.fill();

    text(ctx, this.msg, 480, 88, 24, '#5a3410');
    text(ctx, `남은 입: ${this.total - this.bites} / ${this.total}`, 850, 420, 20, '#fff');
    if (this.yum > 0) text(ctx, this.yumText, MOUTH.x + 110, MOUTH.y - 20, 34, '#e65100');

    if (!this.unwrapped) return this.drawWrapped(ctx);
    if (this.tear > 0) this.drawTear(ctx);
    const left = 1 - this.bites / this.total;

    if (this.cat === 'ramen') {
      this.drawBowl(ctx, left);
      this.drawChopsticks(ctx);
    } else if (this.cat === 'snack') {
      this.drawSnackBag(ctx, left);
      if (this.piece) emoji(ctx, this.item.piece || this.item.icon, this.piece.x, this.piece.y, 50);
    } else if (this.item.icon === '💧') {
      this.drawWaterBottle(ctx, this.obj.x, this.obj.y, left);
    } else {
      emoji(ctx, this.item.icon, this.obj.x, this.obj.y, 110 * (0.45 + 0.55 * left));
    }
  },

  drawWrapped(ctx) {
    const x = PLATE.x, y = PLATE.y, c = WRAP_COLOR[this.cat];
    ctx.fillStyle = c;
    rr(ctx, x - 90, y - 60, 180, 120, 10); ctx.fill();
    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
      ctx.moveTo(x - 90 + i * 20, y - 60); ctx.lineTo(x - 80 + i * 20, y - 72); ctx.lineTo(x - 70 + i * 20, y - 60);
      ctx.moveTo(x - 90 + i * 20, y + 60); ctx.lineTo(x - 80 + i * 20, y + 72); ctx.lineTo(x - 70 + i * 20, y + 60);
    }
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.fillRect(x - 90, y - 40, 180, 10);
    emoji(ctx, this.item.icon, x, y - 12, 46);
    text(ctx, this.item.name, x, y + 34, 18, '#fff');
  },

  drawTear(ctx) {
    const k = 1 - this.tear / 0.6, c = WRAP_COLOR[this.cat];
    ctx.globalAlpha = 1 - k;
    ctx.fillStyle = c;
    ctx.save(); ctx.translate(PLATE.x - 60 - k * 160, PLATE.y - k * 60); ctx.rotate(-k * 1.2);
    ctx.fillRect(-40, -55, 80, 110); ctx.restore();
    ctx.save(); ctx.translate(PLATE.x + 60 + k * 160, PLATE.y - k * 60); ctx.rotate(k * 1.2);
    ctx.fillRect(-40, -55, 80, 110); ctx.restore();
    ctx.globalAlpha = 1;
  },

  drawBowl(ctx, left) {
    const x = PLATE.x, y = PLATE.y;
    ctx.fillStyle = '#d32f2f';
    ctx.beginPath(); ctx.moveTo(x - 110, y - 40); ctx.quadraticCurveTo(x, y + 110, x + 110, y - 40); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(x, y - 40, 110, 28, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#e67e22';
    ctx.beginPath(); ctx.ellipse(x, y - 38, 98, 22, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ffe082'; ctx.lineWidth = 4;
    const n = Math.round(10 * left);
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      const ox = x - 75 + i * 16;
      for (let k = 0; k <= 20; k++) {
        const px = ox + Math.sin(k * 0.9 + i) * 6, py = y - 54 + k * 1.4;
        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    }
    if (n > 0) emoji(ctx, '🥚', x + 50, y - 44, 26);
  },

  drawChopsticks(ctx) {
    const { x, y } = this.chop;
    if (this.holding) {
      ctx.strokeStyle = '#ffe082'; ctx.lineWidth = 4;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        for (let k = 0; k <= 16; k++) {
          const px = x + i * 5 + Math.sin(k * 0.8 + this.t * 6) * 4, py = y + k * 3;
          k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
      }
    }
    ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 4, y); ctx.lineTo(x + 50, y - 150);
    ctx.moveTo(x + 6, y); ctx.lineTo(x + 70, y - 145);
    ctx.stroke();
    ctx.lineCap = 'butt';
    if (!this.drag && !this.holding && this.bites === 0) text(ctx, '젓가락', x + 40, y + 30, 16, '#fff');
  },

  drawSnackBag(ctx, left) {
    const x = PLATE.x, y = PLATE.y;
    const n = Math.max(0, this.total - this.bites);
    for (let i = 0; i < Math.min(n, 4); i++) emoji(ctx, this.item.piece || this.item.icon, x - 45 + i * 30, y - 62 + (i % 2) * 8, 36);
    ctx.fillStyle = WRAP_COLOR.snack;
    ctx.beginPath();
    ctx.moveTo(x - 85, y - 50);
    for (let i = 0; i <= 8; i++) ctx.lineTo(x - 85 + i * 21.25, y - 50 + (i % 2 ? -10 : 0));
    ctx.lineTo(x + 85, y + 60); ctx.lineTo(x - 85, y + 60);
    ctx.fill();
    text(ctx, this.item.name, x, y + 10, 20, '#fff');
    text(ctx, n > 0 ? '여기를 눌러 꺼내요' : '', x, y + 40, 14, '#fff');
  },

  drawWaterBottle(ctx, x, y, left) {
    ctx.fillStyle = 'rgba(220,240,255,.9)';
    rr(ctx, x - 26, y - 70, 52, 130, 14); ctx.fill();
    ctx.fillStyle = '#5ab4ff';
    const lh = 120 * left;
    rr(ctx, x - 22, y + 56 - lh, 44, lh, 10); ctx.fill();
    ctx.fillStyle = '#1e6fd9'; rr(ctx, x - 14, y - 86, 28, 18, 5); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 26, y - 20, 52, 26);
    text(ctx, '물', x, y - 7, 18, '#1e6fd9');
  },
};
