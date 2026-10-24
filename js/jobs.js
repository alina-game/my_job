// 아르바이트: 손님 주문을 작업 테이블에서 진짜처럼 만들기 (3분).
// 레시피(recipes.js)의 단계마다 계량하기, 붓기, 달걀 깨기, 반죽 치대기, 밀대로 밀기, 자르기, 모양 만들기,
// 발효, 오븐 굽기, 장식, 포장을 직접 해요. 다 만들면 완성품이 손님에게 날아가요.

const CUSTOMERS = ['🧑', '👩', '👨', '👵', '👴', '👦', '👧', '🧔', '👱‍♀️'];
const MAKE_REWARD = 6;
const JOB_BONUS = FAST ? 100 : 10;
const TABLE_RECT = { x: 215, y: 200, w: 550, h: 290 };
const WORK = { x: 470, y: 335 };
const SHELF = { x: 785, y: 200, w: 150, h: 290 };
const SRC = [{ x: 860, y: 264 }, { x: 860, y: 352 }, { x: 860, y: 440 }];
const CUSTOMER_POS = { x: 105, y: 340 };
const SLIDER = { x0: 300, x1: 640, y: 455, min: 50, max: 350 };
const OVEN_BTN = { x: WORK.x - 75, y: WORK.y + 95, w: 150, h: 42 };
const RUB_DIST = 1000;   // 이만큼 문지르면 젓기/치대기 끝
const ROLL_DIST = 700;   // 이만큼 밀면 밀기 끝
const POUR_TIME = 2.6;   // 목표량까지 붓는 데 걸리는 시간(초)
const BAKE_TIME = 4.5;   // 오븐에서 다 타기까지 시간(초)
const GOLD = [0.55, 0.8]; // 노릇노릇 구간

function inZone(x, y) { return Math.abs(x - WORK.x) < 175 && Math.abs(y - WORK.y) < 120; }
function sliderX(v) { return SLIDER.x0 + (v - SLIDER.min) / (SLIDER.max - SLIDER.min) * (SLIDER.x1 - SLIDER.x0); }
function sliderV(x) { return Math.round((SLIDER.min + clamp((x - SLIDER.x0) / (SLIDER.x1 - SLIDER.x0), 0, 1) * (SLIDER.max - SLIDER.min)) / 10) * 10; }

Game.scenes.job = {
  enter(p) {
    this.n = p.n;
    this.i = p.i;
    this.b = getTown(this.n).shops[this.i];
    this.earned = 0;
    this.made = 0;
    this.done = false;
    this.t = 0;
    this.sparks = [];
    this.end = performance.now() + TIME.job * 1000;
    // 이 가게에서 쓰는 재료들 (다른 재료가 선반에 같이 놓여서 골라야 해요)
    const all = new Map();
    for (const g of this.b.goods) for (const s of getRecipe(this.b, g)) if (s.type === 'pour' || s.type === 'add') all.set(s.item, s.icon);
    this.shopItems = [...all].map(([item, icon]) => ({ item, icon }));

    this.timerEl = h('div', { class: 'pill' }, '');
    this.coinEl = h('div', { class: 'pill' }, '💰 0');
    this.recipeEl = h('div', { class: 'recipe', style: 'font-size:15px;padding:6px 12px;gap:5px' });
    this.fb = h('div', { class: 'feedback', style: 'font-size:20px;min-height:26px' }, '');
    Game.ui.append(
      h('div', { class: 'topbar' },
        h('button', { class: 'btn small red', onclick: () => this.quit() }, '🚪 나가기'),
        h('span', {}, `${this.b.icon} ${this.b.name} 아르바이트 · 물건 만들기`),
        h('div', { class: 'spacer' }),
        this.timerEl, this.coinEl),
      h('div', { class: 'job-top', style: 'pointer-events:none' }, this.recipeEl, this.fb));
    this.newOrder();
  },

  earn(c) {
    this.earned += c;
    State.data.coins += c;
    addEarned(this.n, this.i, c);
    State.save();
    this.coinEl.textContent = `💰 ${this.earned}`;
  },

  newOrder() {
    const good = pick(this.b.goods);
    this.order = { icon: good[0], name: good[1], recipe: getRecipe(this.b, good), face: pick(CUSTOMERS) };
    this.si = 0;
    this.work = { items: [], blob: null, smooth: 0, sheet: 0, cuts: [], pieces: [], toppings: [], baked: false };
    this.finishing = null;
    this.fb.textContent = `${this.order.icon} ${josa(this.order.name, '을', '를')} 만들어요!`;
    this.startStep();
  },

  step() { return this.order.recipe[this.si]; },

  startStep() {
    const s = this.step();
    const prev = this.order.recipe[this.si - 1];
    if (prev && prev.zone !== s.zone) this.work.cuts = [];   // 다른 작업대로 옮기면 자른 자국은 정리
    const st = { t: 0, prog: 0, count: 0, drag: null, amount: 0, phase: '', taps: 0 };
    if (s.type === 'pour' || s.type === 'add') {
      const decoys = shuffle(this.shopItems.filter(it => it.item !== s.item)).slice(0, 2);
      st.sources = shuffle([{ item: s.item, icon: s.icon, ok: true }, ...decoys.map(d => ({ ...d, ok: false }))])
        .map((it, k) => ({ ...it, ...SRC[k] }));
    } else if (s.type === 'shape') {
      const n = s.count, cols = n <= 3 ? n : Math.ceil(n / 2), rows = Math.ceil(n / cols);
      st.slots = Array.from({ length: n }, (_, k) => ({
        x: WORK.x + ((k % cols) - (cols - 1) / 2) * 72, y: WORK.y + (Math.floor(k / cols) - (rows - 1) / 2) * 66, filled: false,
      }));
    } else if (s.type === 'decorate') {
      const n = s.count;
      st.spots = Array.from({ length: n }, (_, k) => n === 1 ? { x: WORK.x, y: WORK.y - 10, on: false }
        : { x: WORK.x + Math.cos(k / n * Math.PI * 2 - 1.2) * 62, y: WORK.y - 5 + Math.sin(k / n * Math.PI * 2 - 1.2) * 40, on: false });
    } else if (s.type === 'oven') {
      st.phase = 'dial'; st.temp = SLIDER.min; st.bake = 0;
    } else if (s.type === 'wrap') {
      st.phase = 'drag';
    } else if (s.type === 'roll') {
      st.pinY = WORK.y;
    }
    this.st = st;
    this.renderRecipe();
  },

  complete(msg) {
    for (let k = 0; k < 8; k++) this.sparks.push({ x: WORK.x + (Math.random() - 0.5) * 160, y: WORK.y + (Math.random() - 0.5) * 90, life: 0.7 });
    this.si++;
    if (this.si >= this.order.recipe.length) {
      this.made++;
      this.finishing = { t: 0 };
      this.st = { drag: null };
      this.fb.textContent = `✨ ${this.order.name} 완성! 손님에게 드려요 😊`;
      this.renderRecipe();
    } else {
      this.fb.textContent = `${msg || '잘했어요!'} 다음은 ${stepName(this.step())}`;
      this.startStep();
    }
  },

  oops(msg) {
    this.fb.textContent = msg;
    this.shakeT = 0.4;
  },

  renderRecipe() {
    this.recipeEl.innerHTML = '';
    this.recipeEl.append(h('b', {}, `📋 ${this.order.icon} ${this.order.name}`));
    this.order.recipe.forEach((st, k) => {
      if (k) this.recipeEl.append(h('span', { class: 'arrow-r' }, '→'));
      const cls = k < this.si ? 'step done' : k === this.si ? 'step now' : 'step';
      this.recipeEl.append(h('span', { class: cls, style: 'padding:3px 7px' }, k < this.si ? '✅' : st.icon, ' ', stepName(st)));
    });
  },

  hint() {
    const s = this.step(), st = this.st;
    if (!s) return '';
    switch (s.type) {
      case 'pour': return `${s.icon} ${josa(s.item, '을', '를')} 끌어와서 꾹 누르고 있으면 부어져요. ${s.target}${s.unit}쯤에서 손을 떼요!`;
      case 'add': return `${s.icon} ${josa(s.item, '을', '를')} 선반에서 끌어서 넣어요`;
      case 'crack': return `🥚 달걀을 그릇 가장자리에 톡톡톡 3번 두드려요 (${st.taps}/3)`;
      case 'mix': return `${s.icon} ${s.label}: 위를 빙글빙글 문질러요`;
      case 'roll': return '🥖 밀대를 잡고 위아래로 쭉쭉 밀어요';
      case 'cut': return `${s.icon} ${s.label}: 길게 쭉 선을 그어요 (${st.count}/${s.count})`;
      case 'shape': return `${s.icon} 오른쪽에서 끌어서 빈 자리에 놓아요 (${st.count}/${s.count})`;
      case 'wait': return `${s.icon} ${s.label} 중… 잠깐 기다려요`;
      case 'oven': return st.phase === 'dial' ? `🌡️ 손잡이를 밀어서 ${s.temp}℃에 맞춰요 (지금 ${st.temp}℃)` : "🔥 막대가 노릇노릇 노란 칸일 때 '꺼내기'를 눌러요!";
      case 'decorate': return `${s.icon} 반짝이는 자리를 눌러요 (${st.count}/${s.count})`;
      case 'wrap': return st.phase === 'drag' ? `완성된 것을 끌어서 ${s.icon}에 넣어요` : '🎀 리본을 눌러서 마무리해요!';
    }
    return '';
  },

  // ---------- 입력 ----------
  onPointerDown(x, y) {
    if (this.done || this.finishing || Game.hasOverlay()) return;
    this.ptr = { down: true, x, y };
    const s = this.step(), st = this.st;
    switch (s.type) {
      case 'pour': case 'add': {
        const src = st.sources.find(o => Math.abs(x - o.x) < 60 && Math.abs(y - o.y) < 42);
        if (!src) return;
        if (!src.ok) return this.oops(`그건 ${src.item}예요! 지금은 ${s.icon} ${s.item}이 필요해요`);
        st.drag = { x, y, icon: src.icon, src };
        break;
      }
      case 'crack':
        if (Math.hypot(x - (WORK.x + 100), y - (WORK.y - 40)) < 50) {
          st.taps++;
          this.sparks.push({ x: WORK.x + 100, y: WORK.y - 40, life: 0.4 });
          if (st.taps >= 3) { this.work.items.push('🍳'); this.complete('톡! 달걀을 깨뜨려 넣었어요!'); }
          else this.fb.textContent = `톡! (${st.taps}/3)`;
        }
        break;
      case 'mix':
        if (inZone(x, y)) st.rub = { lx: x, ly: y };
        break;
      case 'roll':
        if (Math.abs(y - st.pinY) < 40 && Math.abs(x - WORK.x) < 180) st.drag = { ly: y };
        break;
      case 'cut':
        if (inZone(x, y)) st.line = { x0: x, y0: y, x1: x, y1: y };
        break;
      case 'shape':
        if (st.count < s.count && Math.hypot(x - SRC[1].x, y - SRC[1].y) < 60) st.drag = { x, y };
        break;
      case 'oven':
        if (st.phase === 'dial') {
          if (Math.abs(y - SLIDER.y) < 30 && x > SLIDER.x0 - 30 && x < SLIDER.x1 + 30) { st.drag = true; st.temp = sliderV(x); }
        } else if (x >= OVEN_BTN.x && x <= OVEN_BTN.x + OVEN_BTN.w && y >= OVEN_BTN.y && y <= OVEN_BTN.y + OVEN_BTN.h) this.takeOut();
        break;
      case 'decorate': {
        const sp = st.spots.find(o => !o.on && Math.hypot(x - o.x, y - o.y) < 34);
        if (!sp) return;
        sp.on = true; st.count++;
        this.work.toppings.push({ x: sp.x - WORK.x, y: sp.y - WORK.y, icon: s.icon });
        if (st.count >= s.count) this.complete(`${s.label} 끝!`);
        break;
      }
      case 'wrap':
        if (st.phase === 'drag' && Math.hypot(x - WORK.x, y - WORK.y) < 120) st.drag = { x, y };
        else if (st.phase === 'ribbon' && Math.hypot(x - SRC[1].x, y - SRC[1].y) < 60) this.complete('예쁘게 포장했어요!');
        break;
    }
  },

  onPointerMove(x, y) {
    if (this.ptr) { this.ptr.x = x; this.ptr.y = y; }
    const s = this.step(), st = this.st;
    if (!s || !st) return;
    if (st.drag && typeof st.drag === 'object' && 'x' in st.drag) { st.drag.x = x; st.drag.y = y; }
    if (s.type === 'mix' && st.rub) {
      if (inZone(x, y)) {
        st.prog += Math.hypot(x - st.rub.lx, y - st.rub.ly) / RUB_DIST;
        if (s.color) { if (!this.work.blob) this.work.blob = s.color; this.work.smooth = Math.min(1, st.prog); }
        if (Math.random() < 0.3) this.sparks.push({ x, y, life: 0.5, ic: s.knead ? '💫' : '✨' });
      }
      st.rub.lx = x; st.rub.ly = y;
      if (st.prog >= 1) { st.rub = null; this.complete(`${s.label} 끝!`); }
    } else if (s.type === 'roll' && st.drag) {
      const ny = clamp(y, WORK.y - 85, WORK.y + 85);
      st.prog += Math.abs(ny - st.pinY) / ROLL_DIST;
      st.pinY = ny;
      if (!this.work.blob) this.work.blob = '#f3d9a4';
      this.work.smooth = 1;
      this.work.sheet = Math.max(this.work.sheet, Math.min(1, st.prog));
      if (st.prog >= 1) { st.drag = null; this.complete('넓게 쭉 밀었어요!'); }
    } else if (s.type === 'cut' && st.line) {
      st.line.x1 = x; st.line.y1 = y;
    } else if (s.type === 'oven' && st.drag === true) {
      st.temp = sliderV(x);
    }
  },

  onPointerUp(x, y) {
    if (this.ptr) this.ptr.down = false;
    const s = this.step(), st = this.st;
    if (!s || !st) return;
    switch (s.type) {
      case 'pour':
        if (st.drag) { st.drag = null; this.judgePour(); }
        break;
      case 'add':
        if (st.drag) {
          st.drag = null;
          if (inZone(x, y)) { this.work.items.push(s.icon); this.complete(`${s.icon} ${s.item} 넣었어요!`); }
        }
        break;
      case 'mix': st.rub = null; break;
      case 'roll': st.drag = null; break;
      case 'cut':
        if (st.line) {
          const l = st.line, len = Math.hypot(l.x1 - l.x0, l.y1 - l.y0);
          st.line = null;
          if (len >= 120) {
            this.work.cuts.push({ x0: l.x0 - WORK.x, y0: l.y0 - WORK.y, x1: l.x1 - WORK.x, y1: l.y1 - WORK.y });
            st.count++;
            if (st.count >= s.count) {
              const w = this.work;
              if (s.obj && !w.items.length && !w.blob && !w.sheet && !w.pieces.length) w.items.push(s.obj);
              this.complete(`${s.label} 끝!`);
            } else this.fb.textContent = `싹둑! (${st.count}/${s.count})`;
          } else if (len > 10) this.oops('더 길게 쭉 그어요!');
        }
        break;
      case 'shape':
        if (st.drag) {
          const slot = st.slots.find(o => !o.filled && Math.hypot(x - o.x, y - o.y) < 48);
          st.drag = null;
          if (!slot) return;
          slot.filled = true; st.count++;
          if (st.count >= s.count) {
            // 반죽이 조각들이 됨
            this.work.blob = null; this.work.sheet = 0; this.work.cuts = []; this.work.items = [];
            this.work.pieces = st.slots.map(o => ({ x: o.x - WORK.x, y: o.y - WORK.y, icon: s.icon }));
            this.complete(`${s.label} 끝!`);
          }
        }
        break;
      case 'oven':
        if (st.drag === true) {
          st.drag = null;
          if (Math.abs(st.temp - s.temp) <= 10) { st.phase = 'bake'; st.bake = 0; this.fb.textContent = `${s.temp}℃ 딱 맞아요! 굽는 중… 🔥`; }
          else this.oops(`온도가 달라요! ${s.temp}℃에 맞춰요 (지금 ${st.temp}℃)`);
        }
        break;
      case 'wrap':
        if (st.drag) {
          st.drag = null;
          if (Math.hypot(x - SRC[1].x, y - SRC[1].y) < 75) { st.phase = 'ribbon'; this.fb.textContent = '쏙! 이제 리본을 눌러요 🎀'; }
        }
        break;
    }
  },

  judgePour() {
    const s = this.step(), st = this.st, a = st.amount, t = s.target;
    if (a <= 0) return;
    if (a >= t * 0.9 && a <= t * 1.1) {
      this.work.items.push(s.icon);
      this.complete(`${s.item} ${Math.round(a)}${s.unit} 딱 맞아요!`);
    } else if (a < t * 0.9) {
      this.fb.textContent = `조금 더 부어요! (${Math.round(a)} / ${t}${s.unit})`;
    } else {
      st.amount = 0;
      this.oops(`너무 많아요! (${Math.round(a)}${s.unit}) 덜어내고 다시 계량해요`);
    }
  },

  takeOut() {
    const s = this.step(), st = this.st;
    if (st.bake < GOLD[0]) return this.oops(`아직 덜 익었어요! 조금만 더 기다려요`);
    if (st.bake <= GOLD[1]) { this.work.baked = true; return this.complete(`노릇노릇 잘 구워졌어요! (${s.device})`); }
    st.bake = 0;
    this.oops('앗, 탔어요! 🔥 새로 다시 구워요');
  },

  // ---------- 진행 ----------
  update(dt) {
    this.t += dt;
    this.shakeT = Math.max(0, (this.shakeT || 0) - dt);
    for (const s of this.sparks) s.life -= dt;
    this.sparks = this.sparks.filter(s => s.life > 0);
    if (this.done) return;
    const left = (this.end - performance.now()) / 1000;
    this.timerEl.textContent = `⏰ 남은 시간 ${fmt(left)}`;
    if (left <= 0) return this.finish();

    const f = this.finishing;
    if (f) {
      f.t += dt;
      if (f.t >= 1.3 && !f.paid) {
        f.paid = true;
        this.earn(MAKE_REWARD);
        floatText(`+${MAKE_REWARD}`, CUSTOMER_POS.x + 30, CUSTOMER_POS.y - 120);
      }
      if (f.t >= 1.8) this.newOrder();
      return;
    }
    const s = this.step(), st = this.st;
    if (s.type === 'pour') {
      st.pouring = !!(st.drag && this.ptr && this.ptr.down && inZone(st.drag.x, st.drag.y));
      if (st.pouring) {
        st.amount += s.target / POUR_TIME * dt;
        if (st.amount > s.target * 1.25) {
          st.amount = 0; st.drag = null; st.pouring = false;
          this.oops('넘쳤어요! 💦 닦고 다시 계량해요');
        }
      }
    } else if (s.type === 'wait') {
      st.t += dt;
      if (st.t >= s.sec) this.complete(`${s.label} 끝!`);
    } else if (s.type === 'oven' && st.phase === 'bake') {
      st.bake += dt / BAKE_TIME;
      if (st.bake >= 1) { st.bake = 0; this.oops('앗, 너무 오래 둬서 탔어요! 🔥 다시 구워요'); }
    }
  },

  finish() {
    this.done = true;
    this.earn(JOB_BONUS);
    const d = State.data;
    d.jobsToday++;
    if (d.jobsToday >= JOBS_PER_DAY) State.markDone('jobs');
    const msgs = checkUnlocks(this.n);
    State.save();
    const night = State.isNight();
    modal(
      h('h2', {}, '🎉 아르바이트 끝!'),
      h('p', {}, `물건을 ${this.made}개 만들었어요!`),
      h('p', {}, `💰 ${this.earned}코인을 벌었어요! (끝까지 한 보너스 +${JOB_BONUS})`),
      h('p', {}, `오늘 한 아르바이트: ${Math.min(d.jobsToday, JOBS_PER_DAY)} / ${JOBS_PER_DAY}`),
      msgs.map(m => h('p', { style: 'color:#2e7d32' }, m)),
      night ? h('p', { style: 'color:#3949ab' }, `🌙 아르바이트 ${JOBS_PER_DAY}개를 다 했어요! 이제 밤이 되었어요.`) : null,
      h('div', { class: 'row' }, h('button', {
        class: 'btn', onclick: () => night ? Game.go('town') : Game.go('shop', { townN: this.n, index: this.i }),
      }, '확인')));
  },

  quit() {
    if (this.done) return;
    this.done = true;
    const msgs = checkUnlocks(this.n);
    Game.go('shop', { townN: this.n, index: this.i, msgs: [`🚪 중간에 나왔어요. ${this.earned}코인을 벌었어요`, ...msgs] });
  },

  // ---------- 그리기 ----------
  draw(ctx) {
    drawShopInterior(ctx, this.b);
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.fillRect(0, 0, W, H);
    const o = this.order, f = this.finishing;

    // 손님
    emoji(ctx, o.face, CUSTOMER_POS.x, CUSTOMER_POS.y, 84);
    bubble(ctx, f && f.t > 1.1 ? '고마워요! 💕' : `${o.icon} 주세요!`, CUSTOMER_POS.x + 10, CUSTOMER_POS.y - 55, 16);

    // 작업 테이블
    const r = TABLE_RECT;
    ctx.fillStyle = '#6d4220';
    ctx.fillRect(r.x + 24, r.y + r.h - 10, 18, 40); ctx.fillRect(r.x + r.w - 42, r.y + r.h - 10, 18, 40);
    ctx.fillStyle = '#c68a52';
    rr(ctx, r.x, r.y, r.w, r.h, 18); ctx.fill();
    ctx.fillStyle = '#b07440';
    for (let k = 1; k < 7; k++) ctx.fillRect(r.x + 12, r.y + k * 41, r.w - 24, 2);

    if (f) {
      const k = Math.min(1, f.t / 0.5);
      if (f.t < 0.7) emoji(ctx, o.icon, WORK.x, WORK.y, 40 + 70 * k);
      else {
        const m = Math.min(1, (f.t - 0.7) / 0.6);
        emoji(ctx, o.icon, WORK.x + (CUSTOMER_POS.x + 60 - WORK.x) * m, WORK.y - Math.sin(m * Math.PI) * 120 + (CUSTOMER_POS.y - WORK.y) * m, 110 - 50 * m);
      }
      this.drawSparks(ctx);
      return;
    }

    const s = this.step(), st = this.st;
    const sh = this.shakeT > 0 ? Math.sin(this.t * 60) * 5 : 0;
    ctx.save(); ctx.translate(sh, 0);
    if (s.type === 'oven') this.drawOven(ctx, s, st);
    else {
      this.drawZone(ctx, s.zone || 'bench');
      this.drawWork(ctx, WORK.x, WORK.y, 1, s);
    }
    ctx.restore();
    this.drawStepUI(ctx, s, st);
    this.drawSparks(ctx);

    // 안내
    const hint = this.hint();
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    rr(ctx, 20, 512, W - 40, 40, 14); ctx.fill();
    text(ctx, hint, W / 2, 532, hint.length > 40 ? 16 : 18, '#fff');
  },

  drawSparks(ctx) {
    for (const s of this.sparks) {
      ctx.globalAlpha = Math.max(0, s.life / 0.7);
      emoji(ctx, s.ic || '✨', s.x, s.y - (0.7 - s.life) * 30, 18);
    }
    ctx.globalAlpha = 1;
  },

  // 작업하는 곳 그림
  drawZone(ctx, zone) {
    const x = WORK.x, y = WORK.y;
    switch (zone) {
      case 'bowl': case 'cake': case 'plate':
        if (zone === 'cake') {
          ctx.fillStyle = '#eceff1'; ctx.beginPath(); ctx.ellipse(x, y + 55, 150, 30, 0, 0, 7); ctx.fill();
          ctx.fillStyle = '#b0bec5'; ctx.fillRect(x - 10, y + 55, 20, 30);
          break;
        }
        if (zone === 'plate') {
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, y + 10, 165, 75, 0, 0, 7); ctx.fill();
          ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, y + 10, 130, 55, 0, 0, 7); ctx.stroke();
          break;
        }
        ctx.fillStyle = '#b0bec5';
        ctx.beginPath(); ctx.moveTo(x - 135, y - 25); ctx.quadraticCurveTo(x - 120, y + 95, x, y + 95); ctx.quadraticCurveTo(x + 120, y + 95, x + 135, y - 25); ctx.fill();
        ctx.fillStyle = '#eceff1'; ctx.beginPath(); ctx.ellipse(x, y - 25, 135, 38, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.ellipse(x, y - 22, 118, 30, 0, 0, 7); ctx.fill();
        break;
      case 'board':
        ctx.fillStyle = '#d7a86e'; rr(ctx, x - 175, y - 95, 350, 190, 20); ctx.fill();
        ctx.strokeStyle = '#c4935a'; ctx.lineWidth = 2;
        for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(x - 160, y + k * 25); ctx.quadraticCurveTo(x, y + k * 25 + 8, x + 160, y + k * 25); ctx.stroke(); }
        ctx.fillStyle = '#c4935a'; ctx.beginPath(); ctx.arc(x + 150, y - 70, 9, 0, 7); ctx.fill();
        break;
      case 'tray': case 'box': case 'basket':
        if (zone === 'tray') {
          ctx.fillStyle = '#90a4ae'; rr(ctx, x - 175, y - 100, 350, 200, 12); ctx.fill();
          ctx.fillStyle = '#b0bec5'; rr(ctx, x - 165, y - 90, 330, 180, 8); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x - 160, y - 85, 320, 10);
        } else if (zone === 'box') {
          ctx.fillStyle = '#c8a06a'; rr(ctx, x - 165, y - 90, 330, 185, 6); ctx.fill();
          ctx.fillStyle = '#a77d48'; ctx.fillRect(x - 165, y - 90, 330, 12);
          ctx.fillStyle = '#b48b56'; ctx.beginPath(); ctx.moveTo(x - 165, y - 90); ctx.lineTo(x - 200, y - 120); ctx.lineTo(x + 200, y - 120); ctx.lineTo(x + 165, y - 90); ctx.fill();
        } else {
          ctx.fillStyle = '#c58b4e'; ctx.beginPath(); ctx.ellipse(x, y + 10, 170, 95, 0, 0, 7); ctx.fill();
          ctx.strokeStyle = '#9c6a35'; ctx.lineWidth = 3;
          for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(x + k * 36, y - 80); ctx.lineTo(x + k * 36, y + 100); ctx.stroke(); }
          ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x, y - 30, 120, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        }
        break;
      case 'pot': {
        ctx.fillStyle = '#546e7a'; rr(ctx, x - 125, y - 50, 250, 140, 20); ctx.fill();
        ctx.fillStyle = '#37474f'; rr(ctx, x - 160, y - 40, 40, 14, 6); ctx.fill(); rr(ctx, x + 120, y - 40, 40, 14, 6); ctx.fill();
        ctx.fillStyle = '#78909c'; ctx.beginPath(); ctx.ellipse(x, y - 50, 125, 30, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#90caf9'; ctx.beginPath(); ctx.ellipse(x, y - 45, 110, 22, 0, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.5)';
        for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x - 70 + k * 45, y - 70 - ((this.t * 30 + k * 13) % 40), 5, 0, 7); ctx.fill(); }
        break;
      }
      case 'cup': case 'blender':
        if (zone === 'blender') {
          ctx.fillStyle = '#455a64'; rr(ctx, x - 80, y + 40, 160, 55, 10); ctx.fill();
          ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.arc(x, y + 68, 12, 0, 7); ctx.fill();
        }
        ctx.fillStyle = 'rgba(225,245,255,.85)';
        ctx.beginPath(); ctx.moveTo(x - 70, y - 100); ctx.lineTo(x + 70, y - 100); ctx.lineTo(x + 55, y + 40); ctx.lineTo(x - 55, y + 40); ctx.fill();
        ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 3; ctx.stroke();
        break;
      case 'paper':
        ctx.fillStyle = '#f8bbd0';
        ctx.beginPath(); ctx.moveTo(x - 150, y - 90); ctx.lineTo(x + 150, y - 90); ctx.lineTo(x + 20, y + 100); ctx.lineTo(x - 20, y + 100); ctx.fill();
        ctx.fillStyle = '#fce4ec'; ctx.beginPath(); ctx.moveTo(x - 110, y - 90); ctx.lineTo(x + 40, y - 90); ctx.lineTo(x, y + 60); ctx.fill();
        break;
      case 'sewing':
        ctx.fillStyle = '#fafafa'; rr(ctx, x - 160, y + 20, 320, 70, 10); ctx.fill();
        ctx.fillStyle = '#e0e0e0'; rr(ctx, x + 60, y - 100, 90, 130, 14); ctx.fill();
        rr(ctx, x - 120, y - 100, 270, 40, 14); ctx.fill();
        ctx.fillStyle = '#bdbdbd'; ctx.fillRect(x - 100, y - 60, 8, 50 + Math.abs(Math.sin(this.t * 20)) * 6);
        ctx.fillStyle = '#ef5350'; ctx.beginPath(); ctx.arc(x + 105, y - 80, 10, 0, 7); ctx.fill();
        text(ctx, '재봉틀', x + 105, y - 40, 14, '#555');
        break;
      case 'ironing':
        ctx.fillStyle = '#90caf9'; ctx.beginPath(); ctx.ellipse(x, y, 180, 70, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#e3f2fd'; ctx.beginPath(); ctx.ellipse(x, y, 165, 58, 0, 0, 7); ctx.fill();
        break;
      case 'sink':
        ctx.fillStyle = '#cfd8dc'; rr(ctx, x - 170, y - 80, 340, 175, 24); ctx.fill();
        ctx.fillStyle = '#b3e5fc'; rr(ctx, x - 150, y - 60, 300, 135, 18); ctx.fill();
        ctx.fillStyle = '#90a4ae'; ctx.fillRect(x - 10, y - 115, 20, 40); ctx.fillRect(x - 10, y - 115, 60, 14);
        ctx.fillStyle = 'rgba(100,180,255,.6)'; ctx.fillRect(x + 38, y - 100, 8, 70);
        break;
      case 'scale': {
        ctx.fillStyle = '#eceff1'; rr(ctx, x - 140, y + 20, 280, 70, 14); ctx.fill();
        ctx.fillStyle = '#b0bec5'; rr(ctx, x - 160, y + 5, 320, 20, 8); ctx.fill();
        ctx.fillStyle = '#263238'; rr(ctx, x - 50, y + 40, 100, 34, 6); ctx.fill();
        const a = this.st && this.st.amount ? Math.round(this.st.amount) : 0;
        text(ctx, `${a} g`, x, y + 57, 18, '#69f0ae');
        break;
      }
      case 'book':
        ctx.fillStyle = '#fffde7'; rr(ctx, x - 170, y - 85, 170, 170, 6); ctx.fill(); rr(ctx, x, y - 85, 170, 170, 6); ctx.fill();
        ctx.strokeStyle = '#e0d9b5'; ctx.lineWidth = 2;
        for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(x - 150, y - 55 + k * 25); ctx.lineTo(x - 20, y - 55 + k * 25); ctx.moveTo(x + 20, y - 55 + k * 25); ctx.lineTo(x + 150, y - 55 + k * 25); ctx.stroke(); }
        ctx.fillStyle = '#bcaaa4'; ctx.fillRect(x - 3, y - 85, 6, 170);
        break;
      case 'machine':
        ctx.fillStyle = '#eceff1'; rr(ctx, x - 120, y - 110, 240, 200, 18); ctx.fill();
        ctx.fillStyle = '#80deea'; rr(ctx, x - 90, y - 85, 180, 90, 12); ctx.fill();
        ctx.fillStyle = '#b0bec5'; ctx.fillRect(x - 15, y + 5, 30, 30);
        text(ctx, '❄️ 냉동', x, y + 70, 16, '#0277bd');
        break;
      default: // bench
        ctx.fillStyle = '#4caf7d'; rr(ctx, x - 175, y - 95, 350, 190, 14); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1;
        for (let k = -6; k <= 6; k++) { ctx.beginPath(); ctx.moveTo(x + k * 27, y - 95); ctx.lineTo(x + k * 27, y + 95); ctx.stroke(); }
        for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(x - 175, y + k * 27); ctx.lineTo(x + 175, y + k * 27); ctx.stroke(); }
    }
  },

  // 만들고 있는 것 (반죽, 재료, 조각, 토핑)
  drawWork(ctx, x, y, sc, s) {
    const w = this.work;
    if (w.pieces.length) {
      const rise = s && s.type === 'wait' ? 1 + Math.min(1, this.st.t / s.sec) * 0.25 : 1;
      for (const p of w.pieces) emoji(ctx, p.icon, x + p.x * sc, y + p.y * sc, 40 * sc * rise);
    } else if (w.sheet > 0) {
      const ww = (120 + 190 * w.sheet) * sc, hh = (80 + 40 * w.sheet) * sc;
      ctx.fillStyle = w.blob || '#f3d9a4';
      rr(ctx, x - ww / 2, y - hh / 2, ww, hh, 30 * sc); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.25)'; rr(ctx, x - ww / 2 + 10, y - hh / 2 + 6, ww - 20, 10, 5); ctx.fill();
    } else if (w.blob) {
      const rough = 1 - w.smooth, R0 = 58 * sc;
      ctx.fillStyle = w.blob;
      ctx.beginPath();
      for (let k = 0; k <= 24; k++) {
        const a = k / 24 * Math.PI * 2, rr2 = R0 * (1 + rough * 0.18 * Math.sin(k * 3.7 + 1));
        const px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2 * 0.75;
        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(x - 18 * sc, y - 16 * sc, 16 * sc, 8 * sc, -0.3, 0, 7); ctx.fill();
    } else if (w.items.length) {
      w.items.forEach((ic, k) => {
        const a = k * 2.4, rad = w.items.length > 1 ? 40 : 0;
        emoji(ctx, ic, x + Math.cos(a) * rad * sc, y - 10 * sc + Math.sin(a) * rad * 0.5 * sc, 44 * sc);
      });
    } else if (s && s.type === 'cut' && s.obj) {
      for (let k = -1; k <= 1; k++) emoji(ctx, s.obj, x + k * 60, y, 64);
    }
    // 자른 선
    ctx.strokeStyle = 'rgba(90,50,20,.75)'; ctx.lineWidth = 3; ctx.setLineDash([8, 5]);
    for (const c of w.cuts) { ctx.beginPath(); ctx.moveTo(x + c.x0 * sc, y + c.y0 * sc); ctx.lineTo(x + c.x1 * sc, y + c.y1 * sc); ctx.stroke(); }
    ctx.setLineDash([]);
    for (const tp of w.toppings) emoji(ctx, tp.icon, x + tp.x * sc, y + tp.y * sc, 30 * sc);
  },

  drawOven(ctx, s, st) {
    const x = WORK.x, y = WORK.y;
    const fire = s.device === '화덕';
    ctx.fillStyle = fire ? '#8d6e63' : '#455a64';
    if (fire) { ctx.beginPath(); ctx.moveTo(x - 170, y + 75); ctx.lineTo(x - 170, y - 40); ctx.quadraticCurveTo(x, y - 190, x + 170, y - 40); ctx.lineTo(x + 170, y + 75); ctx.fill(); }
    else { rr(ctx, x - 170, y - 125, 340, 200, 16); ctx.fill(); }
    ctx.fillStyle = '#263238'; rr(ctx, x - 130, y - 95, 260, 140, 12); ctx.fill();
    const glow = st.phase === 'bake' ? 0.5 + 0.2 * Math.sin(this.t * 8) : 0.1;
    ctx.fillStyle = `rgba(255,140,40,${glow})`; rr(ctx, x - 130, y - 95, 260, 140, 12); ctx.fill();
    ctx.save(); ctx.beginPath(); rr(ctx, x - 130, y - 95, 260, 140, 12); ctx.clip();
    this.drawWork(ctx, x, y - 25, 0.62);
    if (st.phase === 'bake') {
      const b = st.bake;
      ctx.fillStyle = `rgba(${b > GOLD[1] ? '40,20,10' : '160,90,20'},${Math.min(0.75, b * 0.7)})`;
      ctx.fillRect(x - 130, y - 95, 260, 140);
    }
    ctx.restore();
    text(ctx, `${s.device} ${st.phase === 'dial' ? st.temp : s.temp}℃`, x - 100, y - 110 + (fire ? 40 : 0), 15, '#fff', 'left');

    if (st.phase === 'dial') {
      ctx.fillStyle = '#eceff1'; rr(ctx, SLIDER.x0 - 20, SLIDER.y - 30, SLIDER.x1 - SLIDER.x0 + 40, 54, 14); ctx.fill();
      const g = ctx.createLinearGradient(SLIDER.x0, 0, SLIDER.x1, 0);
      g.addColorStop(0, '#4fc3f7'); g.addColorStop(1, '#e53935');
      ctx.fillStyle = g; rr(ctx, SLIDER.x0, SLIDER.y - 6, SLIDER.x1 - SLIDER.x0, 12, 6); ctx.fill();
      const tx = sliderX(s.temp);
      ctx.fillStyle = 'rgba(46,125,50,.5)'; ctx.fillRect(sliderX(s.temp - 10), SLIDER.y - 16, sliderX(s.temp + 10) - sliderX(s.temp - 10), 32);
      text(ctx, `${s.temp}℃`, tx, SLIDER.y - 22, 12, '#2e7d32');
      const kx = sliderX(st.temp);
      ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.arc(kx, SLIDER.y, 15, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
      text(ctx, '🌡️', SLIDER.x0 - 34, SLIDER.y, 20);
    } else {
      const bx = x - 140, by = y + 58, bw = 280;
      ctx.fillStyle = '#ffe0b2'; ctx.fillRect(bx, by, bw * GOLD[0], 14);
      ctx.fillStyle = '#ffb300'; ctx.fillRect(bx + bw * GOLD[0], by, bw * (GOLD[1] - GOLD[0]), 14);
      ctx.fillStyle = '#5d4037'; ctx.fillRect(bx + bw * GOLD[1], by, bw * (1 - GOLD[1]), 14);
      text(ctx, '노릇노릇', bx + bw * (GOLD[0] + GOLD[1]) / 2, by + 7, 10, '#5d4037');
      ctx.fillStyle = '#fff'; ctx.fillRect(bx + bw * st.bake - 2, by - 5, 4, 24);
      ctx.fillStyle = '#ef5350'; rr(ctx, OVEN_BTN.x, OVEN_BTN.y, OVEN_BTN.w, OVEN_BTN.h, 12); ctx.fill();
      text(ctx, '🧤 꺼내기', OVEN_BTN.x + OVEN_BTN.w / 2, OVEN_BTN.y + OVEN_BTN.h / 2, 19, '#fff');
    }
  },

  drawShelf(ctx, label) {
    ctx.fillStyle = 'rgba(90,52,16,.9)'; rr(ctx, SHELF.x, SHELF.y, SHELF.w, SHELF.h, 14); ctx.fill();
    text(ctx, label, SHELF.x + SHELF.w / 2, SHELF.y + 14, 13, '#ffe082');
  },

  drawStepUI(ctx, s, st) {
    const x = WORK.x, y = WORK.y, ptr = this.ptr || { x: x, y: y };
    switch (s.type) {
      case 'pour': case 'add': {
        this.drawShelf(ctx, '재료 선반');
        for (const src of st.sources) {
          const using = st.drag && st.drag.src === src;
          ctx.fillStyle = using ? 'rgba(255,255,255,.4)' : '#fff';
          rr(ctx, src.x - 62, src.y - 37, 124, 76, 12); ctx.fill();
          emoji(ctx, src.icon, src.x, src.y - 10, 36);
          text(ctx, src.item, src.x, src.y + 24, src.item.length > 5 ? 11 : 14, '#444');
        }
        if (s.type === 'pour') {
          // 계량 눈금
          const gx = TABLE_RECT.x + 18, gy = TABLE_RECT.y + 20, gh = 200;
          ctx.fillStyle = 'rgba(255,255,255,.9)'; rr(ctx, gx, gy, 46, gh + 40, 10); ctx.fill();
          const max = s.target * 1.25, lvl = Math.min(1, st.amount / max);
          ctx.fillStyle = 'rgba(46,125,50,.35)';
          ctx.fillRect(gx + 6, gy + 8 + gh * (1 - 1.1 / 1.25), 34, gh * (0.2 / 1.25));
          ctx.fillStyle = st.amount > s.target * 1.1 ? '#e53935' : '#42a5f5';
          ctx.fillRect(gx + 12, gy + 8 + gh * (1 - lvl), 22, gh * lvl);
          ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 2;
          const ty = gy + 8 + gh * (1 - 1 / 1.25);
          ctx.beginPath(); ctx.moveTo(gx + 2, ty); ctx.lineTo(gx + 44, ty); ctx.stroke();
          text(ctx, `${Math.round(st.amount)}`, gx + 23, gy + gh + 22, 13, '#333');
          text(ctx, `${s.target}${s.unit}`, gx + 23, ty - 9, 10, '#2e7d32');
        }
        if (st.drag) {
          ctx.save(); ctx.translate(st.drag.x, st.drag.y);
          if (st.pouring) ctx.rotate(-0.7);
          emoji(ctx, st.drag.icon, 0, 0, 56);
          ctx.restore();
          if (st.pouring) {
            ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.moveTo(st.drag.x - 20, st.drag.y + 10); ctx.lineTo(st.drag.x - 24, y); ctx.stroke();
          }
        }
        break;
      }
      case 'crack': {
        const ex = x + 100, ey = y - 40;
        emoji(ctx, '🥚', ex, ey, 48);
        ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 2;
        for (let k = 0; k < st.taps; k++) { ctx.beginPath(); ctx.moveTo(ex - 14 + k * 8, ey - 4); ctx.lineTo(ex - 8 + k * 8, ey + 4); ctx.lineTo(ex - 2 + k * 8, ey - 3); ctx.stroke(); }
        break;
      }
      case 'mix': {
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.arc(x, y, 92, 0, 7); ctx.stroke();
        ctx.strokeStyle = '#ffd23f';
        ctx.beginPath(); ctx.arc(x, y, 92, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, st.prog)); ctx.stroke();
        const tx = st.rub ? ptr.x : x + Math.cos(this.t * 3) * 50, ty = st.rub ? ptr.y : y + Math.sin(this.t * 3) * 30;
        emoji(ctx, s.icon, tx, ty, 48);
        break;
      }
      case 'roll': {
        const py = st.pinY;
        ctx.fillStyle = '#d7a86e'; rr(ctx, x - 150, py - 13, 300, 26, 13); ctx.fill();
        ctx.fillStyle = '#8d5a2b'; rr(ctx, x - 195, py - 7, 50, 14, 7); ctx.fill(); rr(ctx, x + 145, py - 7, 50, 14, 7); ctx.fill();
        if (!st.drag) emoji(ctx, '👆', x + Math.sin(this.t * 3) * 10, py + 30 + Math.sin(this.t * 4) * 20, 26);
        this.progressBar(ctx, st.prog);
        break;
      }
      case 'cut':
        if (st.line) {
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.setLineDash([10, 6]);
          ctx.beginPath(); ctx.moveTo(st.line.x0, st.line.y0); ctx.lineTo(st.line.x1, st.line.y1); ctx.stroke();
          ctx.setLineDash([]);
          emoji(ctx, s.icon, st.line.x1, st.line.y1, 40);
        } else emoji(ctx, s.icon, x - 150 + ((this.t * 120) % 300), y - 70, 34);
        break;
      case 'shape': {
        for (const sl of st.slots) {
          if (sl.filled) emoji(ctx, s.icon, sl.x, sl.y, 44);
          else { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(sl.x, sl.y, 28, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
        }
        this.drawShelf(ctx, '여기서 끌어요');
        emoji(ctx, s.icon, SRC[1].x, SRC[1].y - 10, 52);
        text(ctx, `남은 것 ${s.count - st.count}`, SRC[1].x, SRC[1].y + 36, 14, '#fff');
        if (st.drag) emoji(ctx, s.icon, st.drag.x, st.drag.y, 52);
        break;
      }
      case 'wait': {
        const k = Math.min(1, st.t / s.sec);
        emoji(ctx, s.icon, x + 140, y - 80, 40);
        ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x + 140, y - 80, 32, 0, 7); ctx.stroke();
        ctx.strokeStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x + 140, y - 80, 32, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke();
        break;
      }
      case 'decorate': {
        for (const sp of st.spots) {
          if (sp.on) continue;
          const pulse = 26 + Math.sin(this.t * 6) * 4;
          ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 3; ctx.setLineDash([5, 4]);
          ctx.beginPath(); ctx.arc(sp.x, sp.y, pulse, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        }
        emoji(ctx, s.icon, x + 160, y - 90, 34);
        break;
      }
      case 'wrap': {
        this.drawShelf(ctx, st.phase === 'drag' ? '여기에 넣어요' : '리본을 눌러요');
        emoji(ctx, s.icon, SRC[1].x, SRC[1].y, 64);
        if (st.phase === 'ribbon') emoji(ctx, '🎀', SRC[1].x, SRC[1].y - 36 + Math.sin(this.t * 6) * 3, 38);
        if (st.drag) emoji(ctx, this.order.icon, st.drag.x, st.drag.y, 64);
        else if (st.phase === 'drag') emoji(ctx, '👉', x + 120, y, 32);
        break;
      }
    }
  },

  progressBar(ctx, p) {
    ctx.fillStyle = 'rgba(255,255,255,.6)'; rr(ctx, WORK.x - 100, TABLE_RECT.y + TABLE_RECT.h - 22, 200, 12, 6); ctx.fill();
    ctx.fillStyle = '#ffd23f'; rr(ctx, WORK.x - 100, TABLE_RECT.y + TABLE_RECT.h - 22, 200 * Math.min(1, p), 12, 6); ctx.fill();
  },
};
