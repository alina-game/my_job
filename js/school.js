// 학교: 수업(수학, 한글, 영어 문제)으로 칭찬 스티커 모으기 → 쉬는 시간에 친구들이랑 놀기.
// 하루에 한 번, 낮에만 갈 수 있어요.

const WORDS = [['🍎', '사과', 'apple'], ['🐶', '강아지', 'dog'], ['🐱', '고양이', 'cat'], ['🌙', '달', 'moon'], ['⭐', '별', 'star'],
  ['🚗', '자동차', 'car'], ['🌸', '꽃', 'flower'], ['🍌', '바나나', 'banana'], ['🐟', '물고기', 'fish'], ['☀️', '해', 'sun'],
  ['🏠', '집', 'house'], ['📚', '책', 'book']];
const CLASS_QUESTIONS = 5;
const FRIENDS = ['👦', '👧', '🧒', '👱', '👩'];

function makeQuestion() {
  const kind = pick(['수학', '한글', '영어']);
  if (kind === '수학') {
    const plus = Math.random() < 0.6;
    let a = 1 + Math.floor(Math.random() * 9), b = 1 + Math.floor(Math.random() * 9);
    if (!plus && b > a) [a, b] = [b, a];
    const ans = plus ? a + b : a - b;
    const opts = new Set([ans]);
    while (opts.size < 4) { const v = ans + Math.floor(Math.random() * 7) - 3; if (v >= 0) opts.add(v); }
    return { kind, q: `${a} ${plus ? '+' : '-'} ${b} = ?`, ans: String(ans), opts: shuffle([...opts].map(String)) };
  }
  const w = pick(WORDS), col = kind === '한글' ? 1 : 2;
  const opts = new Set([w[col]]);
  while (opts.size < 4) opts.add(pick(WORDS)[col]);
  return { kind, q: kind === '한글' ? `${w[0]} 이 그림의 이름은?` : `${w[0]} 영어로 뭐라고 할까요?`, ans: w[col], opts: shuffle([...opts]) };
}

Game.scenes.school = {
  enter() {
    const d = State.data;
    d.schoolDay = d.day;
    State.markDone('school');
    this.t = 0;
    this.phase = 'class';
    this.qn = 0;
    this.got = 0;
    this.nextQuestion();
  },

  bar(title) {
    return h('div', { class: 'topbar' },
      h('button', { class: 'btn small gray', onclick: () => Game.go('town') }, '🎒 하교하기'),
      h('span', {}, title),
      h('div', { class: 'spacer' }),
      h('div', { class: 'pill' }, `⭐ 칭찬 스티커 ${State.data.stickers}`));
  },

  // ---------- 수업 ----------
  nextQuestion() {
    if (this.qn >= CLASS_QUESTIONS) return this.classOver();
    this.qn++;
    const q = makeQuestion();
    Game.ui.innerHTML = '';
    const fb = h('div', { class: 'feedback', style: 'color:#ffe082' }, '');
    const opts = h('div', { class: 'opts' }, q.opts.map(o => h('button', {
      class: 'opt', style: 'width:170px;height:90px;font-size:28px', onclick: e => {
        opts.style.pointerEvents = 'none';
        if (o === q.ans) {
          this.got++;
          State.data.stickers++;
          State.save();
          Sound.play('good', 0.8);
          fb.textContent = '⭐ 정답! 칭찬 스티커를 받았어요!';
        } else {
          Sound.play('wrong', 0.6);
          e.currentTarget.classList.add('shake');
          fb.textContent = `아쉬워요! 정답은 "${q.ans}" 예요`;
        }
        setTimeout(() => this.phase === 'class' && this.nextQuestion(), 1200);
      },
    }, o)));
    Game.ui.append(
      this.bar(`🏫 수업 시간 · ${q.kind} (${this.qn}/${CLASS_QUESTIONS})`),
      h('div', { class: 'pass', style: 'position:absolute;left:180px;right:180px;top:110px;text-align:center;color:#fff;font-size:44px;font-weight:900' }, q.q),
      h('div', { class: 'job-top', style: 'top:250px;pointer-events:none' }, h('div', { style: 'pointer-events:auto' }, opts), fb));
  },

  classOver() {
    this.phase = 'over';
    Game.ui.innerHTML = '';
    Game.ui.append(this.bar('🏫 수업 끝'));
    modal(
      h('h2', {}, '🔔 수업 끝!'),
      h('p', {}, `${CLASS_QUESTIONS}문제 중에 ${this.got}개 맞혀서 ⭐ 칭찬 스티커 ${this.got}개를 받았어요!`),
      h('p', {}, '쉬는 시간이에요. 친구들이랑 뭐 하고 놀까요?'),
      h('div', { class: 'row' },
        h('button', { class: 'btn green', onclick: () => this.startBall() }, '⚽ 공 튀기기'),
        h('button', { class: 'btn pink', onclick: () => this.startTag() }, '🏃 술래잡기'),
        h('button', { class: 'btn gray', onclick: () => Game.go('town') }, '🎒 집에 가기')));
  },

  // ---------- 쉬는 시간 ----------
  startBall() {
    this.phase = 'ball';
    this.left = FAST ? 10 : 30;
    this.score = 0;
    this.ball = { x: 480, y: 200, vx: 60, vy: 0 };
    Game.ui.innerHTML = '';
    this.scoreEl = h('div', { class: 'pill' }, '');
    Game.ui.append(h('div', { class: 'topbar' }, h('span', {}, '⚽ 공 튀기기: 공을 눌러서 땅에 안 떨어지게 해요!'), h('div', { class: 'spacer' }), this.scoreEl));
  },

  startTag() {
    this.phase = 'tag';
    this.left = FAST ? 10 : 20;
    this.score = 0;
    this.friends = FRIENDS.map(f => ({ f, x: 150 + Math.random() * 660, y: 240 + Math.random() * 280, vx: (Math.random() - 0.5) * 360, vy: (Math.random() - 0.5) * 300, caught: false }));
    Game.ui.innerHTML = '';
    this.scoreEl = h('div', { class: 'pill' }, '');
    Game.ui.append(h('div', { class: 'topbar' }, h('span', {}, '🏃 술래잡기: 도망가는 친구들을 눌러서 잡아요!'), h('div', { class: 'spacer' }), this.scoreEl));
  },

  playOver(msg) {
    this.phase = 'done';
    modal(
      h('h2', {}, '😆 재미있게 놀았어요!'),
      h('p', {}, msg),
      h('p', {}, '오늘 학교 끝! 내일 또 만나요 👋'),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => Game.go('town') }, '하교하기')));
  },

  onPointerDown(x, y) {
    if (Game.hasOverlay()) return;
    if (this.phase === 'ball') {
      const b = this.ball;
      if (Math.hypot(x - b.x, y - b.y) < 70) {
        b.vy = -620;
        b.vx = (b.x - x) * 8 + (Math.random() - 0.5) * 120;
        this.score++;
      }
    } else if (this.phase === 'tag') {
      const f = this.friends.find(f => !f.caught && Math.hypot(x - f.x, y - f.y) < 45);
      if (f) {
        f.caught = true;
        this.score++;
        if (this.friends.every(ff => ff.caught)) this.playOver(`친구 ${this.score}명을 모두 잡았어요! 술래잡기 대장! 🏆`);
      }
    }
  },

  update(dt) {
    this.t += dt;
    if (this.phase !== 'ball' && this.phase !== 'tag') return;
    this.left -= dt;
    this.scoreEl.textContent = `⏰ ${fmt(this.left)} · ${this.phase === 'ball' ? '튀긴 횟수' : '잡은 친구'} ${this.score}`;
    if (this.phase === 'ball') {
      const b = this.ball;
      b.vy += 900 * dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < 60 || b.x > 900) { b.vx *= -1; b.x = clamp(b.x, 60, 900); }
      if (b.y < 90) { b.y = 90; b.vy = Math.abs(b.vy); }
      if (b.y > 540) return this.playOver(`공을 ${this.score}번 튀겼어요! 👏`);
      if (this.left <= 0) return this.playOver(`공을 ${this.score}번이나 튀겼어요! 한 번도 안 떨어뜨렸어요! 🏆`);
    } else {
      for (const f of this.friends) {
        if (f.caught) continue;
        f.x += f.vx * dt; f.y += f.vy * dt;
        if (f.x < 60 || f.x > 900) f.vx *= -1;
        if (f.y < 200 || f.y > 550) f.vy *= -1;
        f.x = clamp(f.x, 60, 900); f.y = clamp(f.y, 200, 550);
        if (Math.random() < dt) { f.vx = (Math.random() - 0.5) * 380; f.vy = (Math.random() - 0.5) * 320; }
      }
      if (this.left <= 0) this.playOver(`친구 ${this.score}명을 잡았어요!`);
    }
  },

  draw(ctx) {
    if (this.phase === 'class' || this.phase === 'over') return this.drawClassroom(ctx);
    // 운동장
    const g = ctx.createLinearGradient(0, 0, 0, 200);
    g.addColorStop(0, '#6ec6ff'); g.addColorStop(1, '#e3f6ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 200);
    ctx.fillStyle = '#f7d9a8'; ctx.fillRect(560, 70, 300, 130);
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.moveTo(550, 70); ctx.lineTo(710, 30); ctx.lineTo(870, 70); ctx.fill();
    ctx.fillStyle = '#d7b98e'; ctx.fillRect(0, 200, W, 400);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(480, 400, 300, 140, 0, 0, 7); ctx.stroke();
    if (this.phase === 'ball' || (this.phase === 'done' && this.ball)) {
      drawCharacter(ctx, currentLook(), this.ball.x, 560, 1, {});
      emoji(ctx, '⚽', this.ball.x, this.ball.y, 56);
      FRIENDS.slice(0, 3).forEach((f, k) => emoji(ctx, f, 120 + k * 360, 250 + (k % 2) * 30, 44));
    } else if (this.friends) {
      for (const f of this.friends) {
        emoji(ctx, f.f, f.x, f.y, 52);
        if (f.caught) emoji(ctx, '✋', f.x + 24, f.y - 26, 26);
      }
      drawCharacter(ctx, currentLook(), 480, 570, 1, { walk: this.t * 10 });
    }
  },

  drawClassroom(ctx) {
    ctx.fillStyle = '#fff3d6'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#c69c6d'; ctx.fillRect(0, 470, W, 130);
    // 칠판
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(150, 80, 660, 160);
    ctx.fillStyle = '#2e5e3e'; ctx.fillRect(160, 90, 640, 140);
    emoji(ctx, '👩‍🏫', 80, 230, 80);
    // 책상과 친구들
    const seats = [140, 330, 630, 820];
    seats.forEach((x, k) => {
      emoji(ctx, FRIENDS[k], x, 470, 46);
      ctx.fillStyle = '#a0683a'; rr(ctx, x - 60, 485, 120, 20, 5); ctx.fill();
      ctx.fillStyle = '#6d4220'; ctx.fillRect(x - 50, 505, 10, 60); ctx.fillRect(x + 40, 505, 10, 60);
    });
    drawCharacter(ctx, currentLook(), 480, 540, 1.1, {});
    ctx.fillStyle = '#a0683a'; rr(ctx, 410, 495, 140, 22, 5); ctx.fill();
  },
};
