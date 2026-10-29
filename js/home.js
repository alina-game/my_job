// 집: 거실(TV, 식탁, 화장실, 달력, 현관) ↔ 내 방(침대, 옷장, 책상). 고양이. 3일마다 월급 50코인.
// 달력 일정을 안 지키고 밤에 집에 오면 5초 뒤 엄마가 들어와서 등짝 스매싱!

const ROOMS = {
  living: {
    name: '🛋️ 거실',
    spots: {
      door: { x: 20, y: 170, w: 90, h: 235 },
      calendar: { x: 150, y: 90, w: 150, h: 150 },
      tv: { x: 385, y: 250, w: 150, h: 90 },
      table: { x: 590, y: 360, w: 210, h: 120 },
      bath: { x: 830, y: 170, w: 100, h: 235 },
    },
    momDoor: 'door',
  },
  room: {
    name: '🛏️ 내 방',
    spots: {
      bed: { x: 40, y: 330, w: 290, h: 150 },
      closet: { x: 370, y: 140, w: 170, h: 265 },
      desk: { x: 600, y: 300, w: 200, h: 120 },
      door: { x: 840, y: 170, w: 90, h: 235 },
    },
    momDoor: 'door',
  },
};
const inside = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

Game.scenes.home = {
  room: 'living',

  enter(p = {}) {
    const d = State.data, night = State.isNight();
    if (p.room) this.room = p.room;
    this.t = 0;
    this.hearts = [];
    this.pet = null;
    this.play = null;
    this.mom = null;
    this.shake = 0;
    this.handprint = false;
    this.catPos = d.cats.map((c, i) => ({ x: 180 + i * 230, y: 470 + (i % 2) * 25, tx: 0, ty: 0, wait: Math.random() * 2, dir: 1, petT: 0 }));
    this.buildUi();
    // 밤에 집에 왔는데 오늘 일정을 다 안 했으면 5초 뒤 엄마가 들어와요
    this.momTimer = (!p.room && !p.noMom && night && d.momDay !== d.day && State.unfinishedToday().length) ? TIME.momWait : 0;
  },

  buildUi() {
    const d = State.data, night = State.isNight();
    Game.ui.innerHTML = '';
    const btn = (label, left, cls, fn) => h('button', { class: 'btn home-act ' + cls, style: `left:${left}px;top:540px`, onclick: fn }, label);
    const unfinished = State.unfinishedToday();
    Game.ui.append(
      h('div', { class: 'topbar' },
        h('button', { class: 'btn small gray', onclick: () => Game.go('town') }, '🚪 밖으로 나가기'),
        h('span', {}, `🏠 우리 집 · ${ROOMS[this.room].name}`),
        h('div', { class: 'spacer' }),
        healthPill(),
        (d.schedule[d.day] || []).length ? h('div', { class: 'pill', style: unfinished.length ? 'background:#fff3cd' : 'background:#d4f5dc' },
          unfinished.length ? `📅 남은 일정 ${unfinished.length}개` : '📅 오늘 일정 끝!') : null,
        h('div', { class: 'pill' }, `${night ? '🌙 밤' : '☀️ 낮'} · ${d.day}일째`),
        h('div', { class: 'pill' }, `💰 ${d.coins}`)));
    if (this.room === 'living') {
      Game.ui.append(
        btn('📅 달력', 40, 'blue', () => openCalendar()),
        btn('📺 TV', 230, 'pink', () => Game.go('tv')),
        btn('🍽️ 밥 먹기', 400, '', () => this.table()),
        btn('🚽 화장실', 590, 'green', () => Game.go('bath')),
        btn('내 방 ➡', 790, 'gray', () => Game.go('home', { room: 'room' })));
    } else {
      Game.ui.append(
        btn('⬅ 거실', 30, 'gray', () => Game.go('home', { room: 'living' })),
        btn('🛏️ 잠자기', 200, 'blue', () => this.sleep()),
        btn('👚 옷장', 400, 'pink', () => openCloset()),
        btn('📝 숙제하기', 580, 'green', () => this.homework()));
    }
    if (d.cats.length) Game.ui.append(h('div', { class: 'help', style: 'bottom:auto;top:70px' }, '🐱 고양이를 누르면 돌봐줄 수 있어요 · 고양이 위를 문지르면 쓰다듬어요'));
  },

  homework() {
    if (typeof openHomework === 'function') openHomework();
    else toast('📝 숙제가 없어요!');
  },

  catAt(x, y) {
    return this.catPos.findIndex(p => Math.abs(x - p.x) < 34 && y > p.y - 75 && y < p.y + 8);
  },

  onPointerDown(x, y) {
    if (Game.hasOverlay() || this.mom) return;
    if (this.play) { this.play.x = x; this.play.y = y; return; }
    const ci = this.catAt(x, y);
    if (ci >= 0) { this.pet = { i: ci, moved: 0, lx: x, ly: y }; return; }
    const s = ROOMS[this.room].spots;
    if (this.room === 'living') {
      if (inside(s.calendar, x, y)) openCalendar();
      else if (inside(s.tv, x, y)) Game.go('tv');
      else if (inside(s.table, x, y)) this.table();
      else if (inside(s.bath, x, y)) Game.go('bath');
    } else {
      if (inside(s.bed, x, y)) this.sleep();
      else if (inside(s.closet, x, y)) openCloset();
      else if (inside(s.desk, x, y)) this.homework();
    }
  },

  onPointerMove(x, y) {
    if (this.play) { this.play.x = x; this.play.y = y; return; }
    const p = this.pet;
    if (!p) return;
    const dd = Math.hypot(x - p.lx, y - p.ly);
    p.moved += dd; p.lx = x; p.ly = y;
    if (p.moved > 25 && this.catAt(x, y) === p.i) {
      const c = State.data.cats[p.i];
      c.happy = Math.min(100, c.happy + dd / 40);
      if (this.catPos[p.i].petT <= 0) Sound.play('purr', 0.6);
      this.catPos[p.i].petT = 0.6;
      if (Math.random() < 0.2) this.hearts.push({ x, y: y - 20, life: 1 });
    }
  },

  onPointerUp() {
    const p = this.pet;
    this.pet = null;
    if (!p) return;
    if (p.moved < 15) this.openCat(p.i);
    else State.save();
  },

  // ---------- 고양이 돌보기 ----------
  openCat(i) {
    const d = State.data, c = d.cats[i];
    const cv = h('canvas', { width: 170, height: 140 });
    drawCat(cv.getContext('2d'), c.color, 85, 130, 1.4, { t: 1, lying: c.sick, sick: c.sick });
    const bar = (v, color) => h('span', { class: 'bar' }, h('i', { style: `width:${v}%;background:${color}` }));
    const useItem = kind => {
      const k = d.bag.findIndex(it => it.kind === kind);
      if (k < 0) return false;
      d.bag.splice(k, 1);
      return true;
    };
    const o = modal(
      h('h2', {}, `🐱 ${c.name}`),
      cv,
      h('p', {}, '🍚 배부름 ', bar(c.hunger, '#ffb74d'), '  💕 기분 ', bar(c.happy, '#ff7aa8')),
      h('p', { style: c.sick ? 'color:#d32f2f' : 'color:#2e7d32' },
        c.sick ? (c.medicine ? '🤒 아파요… 약을 먹었으니 하룻밤 자면 나아요' : '🤒 아파요… 동물병원에 가거나 고양이 약을 먹여요') : '😊 건강해요!'),
      h('div', { class: 'row' },
        h('button', {
          class: 'btn', onclick: () => {
            if (!useItem('catfood')) return toast('🐟 고양이 사료가 없어요. 편의점 반려동물 코너에서 사 와요');
            c.hunger = Math.min(100, c.hunger + 40);
            c.happy = Math.min(100, c.happy + 5);
            State.markDone('catfeed'); o.remove();
            toast(`😺 ${c.name}: 냠냠! 맛있다옹~`);
          },
        }, '🍚 밥 주기'),
        h('button', {
          class: 'btn pink', onclick: () => {
            if (c.sick) return toast(`🤒 ${josa(c.name, '이', '가')} 기운이 없어서 못 놀아요…`);
            o.remove();
            this.play = { i, t: FAST ? 4 : 8, x: 480, y: 450 };
            Sound.play('meow', 0.9);
            toast('🧶 마우스를 움직여서 털실로 놀아줘요!');
          },
        }, '🧶 놀아주기'),
        c.sick && !c.medicine ? h('button', {
          class: 'btn blue', onclick: () => {
            if (!useItem('catmed')) return toast('💊 고양이 약이 없어요. 편의점 반려동물 코너에서 사 와요');
            c.medicine = true;
            State.save(); o.remove();
            toast(`💊 ${josa(c.name, '이', '가')} 약을 먹었어요. 하룻밤 자면 나을 거예요`);
          },
        }, '💊 약 먹이기') : null,
        h('button', { class: 'btn gray', onclick: () => o.remove() }, '닫기')));
  },

  // ---------- 잠자기 ----------
  sleep() {
    if (this.play || this.mom) return;
    const d = State.data;
    // 일정을 안 지켰으면 자기 전에 엄마가 먼저 들어와요
    if (d.momDay !== d.day && State.unfinishedToday().length) return this.startMom(true);
    const o = h('div', { class: 'overlay', style: 'background:#000;transition:opacity .6s;opacity:0' },
      h('div', { style: 'font-size:60px;color:#fff;font-weight:900' }, '💤 쿨쿨...'));
    Game.ui.append(o);
    requestAnimationFrame(() => { o.style.opacity = '1'; });
    setTimeout(() => {
      const news = [];
      d.day++;
      d.jobsToday = 0;
      d.nightNotice = false;
      const paid = (d.day - 1) % SALARY_DAYS === 0;
      if (paid) d.coins += SALARY;

      // 병: 낫거나, 그냥 두면 심해지거나, 너무 심하면 구급차 (illness.js)
      const ambulance = Illness.night(news);
      d.washed = false;

      // 고양이: 배고파지고, 가끔 아픔
      for (const c of d.cats) {
        if (c.sick && c.medicine) { c.sick = false; news.push(`😺 ${josa(c.name, '이', '가')} 약 먹고 다 나았어요!`); }
        c.medicine = false;
        c.hunger = Math.max(0, c.hunger - 30);
        c.happy = Math.max(0, c.happy - 15);
        if (!c.sick && Math.random() < (c.hunger < 30 ? 0.25 : 0.08)) {
          c.sick = true;
          news.push(`🤒 ${josa(c.name, '이', '가')} 아파요… 동물병원에 가거나 고양이 약을 먹여요`);
        } else if (c.hunger < 30) news.push(`🍚 ${josa(c.name, '이', '가')} 배고파해요!`);
      }
      const todo = d.schedule[d.day] || [];
      if (todo.length) news.push('📅 오늘 일정: ' + todo.map(t => TASKS[t]).join(', '));
      const wx = weatherFor(d.day);
      news.push(`${wx[0]} 오늘 날씨: ${wx[1]} ${wx[2]}°C`);
      State.save();
      Game.go('home', { noMom: true });
      modal(
        h('h2', {}, `☀️ ${d.day}일째 아침이에요!`),
        h('p', {}, d.illness ? '오늘은 몸이 안 좋아요…' : '푹 잤어요. 오늘도 힘내요!'),
        paid ? h('p', { style: 'color:#b8860b;font-size:26px' }, `💰 월급 ${SALARY}코인을 받았어요!`) : h('p', { style: 'color:#888' }, `월급까지 ${SALARY_DAYS - (d.day - 1) % SALARY_DAYS}일 남았어요`),
        news.map(m => h('p', { style: 'font-size:18px' }, m)),
        h('div', { class: 'row' }, ambulance
          ? h('button', { class: 'btn red', onclick: () => Game.go('ward') }, '🚑 구급차 타고 병원으로')
          : h('button', { class: 'btn', onclick: e => e.currentTarget.closest('.overlay').remove() }, '좋아요')));
      if (ambulance) Sound.play('siren', 0.8);
    }, 1800);
  },

  // ---------- 엄마 등짝 스매싱 ----------
  startMom(thenSleep) {
    Sound.play('door_open', 1);
    const door = ROOMS[this.room].spots[ROOMS[this.room].momDoor];
    const fromX = door.x + door.w / 2;
    const missed = State.unfinishedToday().map(t => TASKS[t].replace(/^\S+\s/, ''));
    this.mom = { phase: 'door', t: 0, x: fromX, fromX, door, thenSleep, missed, armUp: 0 };
    this.momTimer = 0;
    this.blocker = h('div', { class: 'overlay', style: 'background:transparent' });
    Game.ui.append(this.blocker);
  },

  updateMom(dt) {
    const m = this.mom, kidX = 460;
    m.t += dt;
    const target = kidX + (m.fromX < kidX ? -75 : 75);
    const next = (phase) => { m.phase = phase; m.t = 0; };
    switch (m.phase) {
      case 'door': if (m.t > 0.9) next('walk'); break;
      case 'walk':
        m.x += Math.sign(target - m.x) * 230 * dt;
        if (Math.abs(target - m.x) < 6) { m.x = target; next('talk'); }
        break;
      case 'talk': if (m.t > 2.2) next('smash'); break;
      case 'smash':
        m.armUp = m.t < 0.35 ? m.t / 0.35 : Math.max(0, 1 - (m.t - 0.35) / 0.12);
        if (m.t >= 0.4 && !this.handprint) { Sound.play('smash', 1); this.handprint = true; this.shake = 0.5; this.smashT = 0.9; }
        if (m.t > 0.7) next('ouch');
        break;
      case 'ouch': if (m.t > 1.8) next('leave'); break;
      case 'leave':
        m.x += Math.sign(m.fromX - m.x) * 260 * dt;
        if (Math.abs(m.fromX - m.x) < 6) next('close');
        break;
      case 'close':
        if (m.t > 0.6) {
          State.data.momDay = State.data.day;
          State.save();
          this.mom = null;
          if (this.blocker) this.blocker.remove();
          if (m.thenSleep) this.sleep();
          else toast('😭 아야야… 내일은 일정을 꼭 지켜야지!', 3000);
        }
        break;
    }
  },

  // ---------- 식탁 ----------
  table() {
    const d = State.data;
    const items = d.bag.map((it, idx) => ({ it, idx })).filter(f => f.it.kind === 'food' || f.it.kind === 'medicine');
    const o = modal(
      h('h2', {}, '🍽️ 무엇을 먹을까요?'),
      items.length
        ? h('div', { class: 'list' }, items.map(f => h('button', {
          class: 'opt', onclick: () => f.it.kind === 'medicine' ? this.takeMedicine(f.idx, o) : Game.go('eat', { idx: f.idx }),
        }, h('span', { class: 'ic' }, f.it.icon), f.it.name,
          Illness.isSpoiled(f.it) ? h('span', { style: 'color:#d32f2f;font-size:13px' }, '⚠️ 3일 지났어요') : null)))
        : h('p', {}, '먹을 음식이 없어요. 편의점에서 사 와요! 🏪'),
      h('div', { class: 'row' }, h('button', { class: 'btn gray', onclick: () => o.remove() }, '닫기')));
  },

  takeMedicine(idx, o) {
    const d = State.data, item = d.bag[idx];
    const problem = Illness.takeMedicine(item);
    if (problem) return toast(problem, 3000);
    d.bag.splice(idx, 1);
    State.save();
    o.remove();
    const def = Illness.def();
    toast(`💊 ${josa(item.name, '을', '를')} 먹었어요. 푹 자고 나면 ${def.nights > 1 ? '조금씩' : ''} 나을 거예요`, 3000);
  },

  // ---------- 움직임 ----------
  update(dt) {
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt);
    this.smashT = Math.max(0, (this.smashT || 0) - dt);
    if (this.momTimer > 0) {
      this.momTimer -= dt;
      if (this.momTimer <= 0 && !Game.hasOverlay()) this.startMom(false);
      else if (this.momTimer <= 0) this.momTimer = 0.5; // 팝업이 닫히면 들어옴
    }
    if (this.mom) this.updateMom(dt);
    const cats = State.data.cats;
    this.catPos.forEach((p, i) => {
      p.petT = Math.max(0, p.petT - dt);
      const c = cats[i];
      if (!c || c.sick) return;
      if (this.play && this.play.i === i) {
        const dx = this.play.x - p.x, dy = clamp(this.play.y, 440, 505) - p.y;
        const dd = Math.hypot(dx, dy);
        if (dd > 20) { p.x += dx / dd * 260 * dt; p.y += dy / dd * 260 * dt; p.dir = dx > 0 ? 1 : -1; }
        return;
      }
      if (this.pet && this.pet.i === i) return;
      if (p.wait > 0) { p.wait -= dt; if (p.wait <= 0) { p.tx = 120 + Math.random() * 700; p.ty = 445 + Math.random() * 55; } return; }
      const dx = p.tx - p.x, dy = p.ty - p.y, dd = Math.hypot(dx, dy);
      if (dd < 5) { p.wait = 2 + Math.random() * 4; return; }
      p.x += dx / dd * 60 * dt; p.y += dy / dd * 60 * dt; p.dir = dx > 0 ? 1 : -1;
    });
    if (this.play) {
      this.play.t -= dt;
      if (Math.random() < dt * 4) this.hearts.push({ x: this.catPos[this.play.i].x, y: this.catPos[this.play.i].y - 80, life: 1 });
      if (this.play.t <= 0) {
        const c = cats[this.play.i];
        c.happy = Math.min(100, c.happy + 25);
        State.save();
        toast(`😻 ${josa(c.name, '이', '가')} 신나게 놀았어요! 기분 최고!`);
        this.play = null;
      }
    }
    for (const hh of this.hearts) { hh.life -= dt; hh.y -= dt * 40; }
    this.hearts = this.hearts.filter(hh => hh.life > 0);
  },

  // ---------- 그리기 ----------
  draw(ctx) {
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18);
    const s = ROOMS[this.room].spots;
    this.drawWalls(ctx);
    if (this.room === 'living') this.drawLiving(ctx, s);
    else this.drawMyRoom(ctx, s);
    this.drawDoor(ctx, s.door);

    // 캐릭터 + 고양이 + 엄마 (화면 아래쪽에 있는 것을 나중에 그림)
    const m = this.mom;
    const ouch = m && (m.phase === 'ouch' || m.phase === 'leave' || m.phase === 'close');
    const things = [{ y: 505, draw: () => drawCharacter(ctx, currentLook(), 460, 505, 1.3, { ...Illness.look(), ouch: ouch || undefined, handprint: this.handprint, dir: m ? Math.sign(m.x - 460) || 1 : 1 }) }];
    State.data.cats.forEach((c, i) => {
      const p = this.catPos[i];
      if (!p) return;
      things.push({
        y: p.y, draw: () => {
          drawCat(ctx, c.color, p.x, p.y, 0.85, { t: this.t + i, dir: p.dir, lying: c.sick, sick: c.sick, happy: p.petT > 0 });
          text(ctx, c.name, p.x, p.y + 14, 14, '#5a3410');
          if (c.sick) emoji(ctx, '🤒', p.x + 26, p.y - 40, 20);
          else if (c.hunger < 30 && Math.sin(this.t * 1.5 + i) > 0.3) bubble(ctx, '배고파옹…', p.x, p.y - 80, 14);
        },
      });
    });
    if (m && m.phase !== 'door' && m.phase !== 'close') {
      const walking = m.phase === 'walk' || m.phase === 'leave';
      things.push({ y: 512, draw: () => drawCharacter(ctx, MOM_LOOK, m.x, 512, 1.85, { walk: walking ? this.t * 10 : 0, dir: m.phase === 'leave' ? Math.sign(m.fromX - m.x) : Math.sign(460 - m.x), armUp: m.armUp, angry: true }) });
    }
    things.sort((a, b2) => a.y - b2.y).forEach(o => o.draw());

    if (m) {
      if (m.phase === 'door') text(ctx, '벌컥!', m.fromX, 150, 34, '#d32f2f');
      if (m.phase === 'talk') bubble(ctx, `너! 오늘 ${m.missed.slice(0, 2).join(', ')} 안 했지!!`, m.x, 270, 20);
      if (m.phase === 'ouch') { bubble(ctx, '아야! 😭', 460, 330, 22); bubble(ctx, '내일은 꼭 해!', m.x, 262, 18); }
    }
    if (this.smashT > 0) {
      ctx.globalAlpha = Math.min(1, this.smashT * 2);
      text(ctx, '짝!!', 400, 300, 110, '#ff1744');
      ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 6;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ctx.moveTo(460 + Math.cos(a) * 40, 430 + Math.sin(a) * 40); ctx.lineTo(460 + Math.cos(a) * 80, 430 + Math.sin(a) * 80); }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (this.momTimer > 0 && this.momTimer < 2.5) text(ctx, '…쿵쿵쿵 (누가 오고 있어요!)', 480, 270, 22, '#6d4220');

    if (this.play) emoji(ctx, '🧶', this.play.x, this.play.y, 36);
    for (const hh of this.hearts) { ctx.globalAlpha = hh.life; emoji(ctx, '💕', hh.x, hh.y, 22); }
    ctx.globalAlpha = 1;
    ctx.restore();
  },

  drawWalls(ctx) {
    const living = this.room === 'living';
    ctx.fillStyle = living ? '#fbe9d0' : '#e8f0ff'; ctx.fillRect(-20, -20, W + 40, 420);
    ctx.fillStyle = living ? '#f5dcb8' : '#dbe6fb';
    for (let x = 0; x < W; x += 40) ctx.fillRect(x, 0, 20, 400);
    ctx.fillStyle = living ? '#c69c6d' : '#b98d62'; ctx.fillRect(-20, 400, W + 40, 220);
    ctx.fillStyle = 'rgba(0,0,0,.08)';
    for (let y = 400; y < H; y += 30) ctx.fillRect(0, y, W, 2);
  },

  drawDoor(ctx, dr) {
    const m = this.mom;
    let open = 0;
    if (m) open = m.phase === 'door' ? Math.min(1, m.t / 0.5) : m.phase === 'close' ? Math.max(0, 1 - m.t / 0.5) : 1;
    ctx.fillStyle = '#efe2cf'; ctx.fillRect(dr.x - 6, dr.y - 8, dr.w + 12, dr.h + 8);
    ctx.fillStyle = '#3b2a1e'; ctx.fillRect(dr.x, dr.y, dr.w, dr.h);
    const w = dr.w * (1 - open * 0.8);
    const left = dr.x < W / 2;
    const px = left ? dr.x : dr.x + dr.w - w;
    ctx.fillStyle = '#a0683a'; ctx.fillRect(px, dr.y, w, dr.h);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(px + w * 0.15, dr.y + 20, w * 0.7, 80); ctx.fillRect(px + w * 0.15, dr.y + 120, w * 0.7, 90);
    ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.arc(left ? px + w - 14 : px + 14, dr.y + dr.h / 2 + 10, 5, 0, 7); ctx.fill();
    if (this.room === 'living') text(ctx, '현관', dr.x + dr.w / 2, dr.y - 22, 16, '#6d4220');
  },

  drawLiving(ctx, s) {
    const night = State.isNight();
    // 창문
    const wg = ctx.createLinearGradient(0, 70, 0, 230);
    wg.addColorStop(0, night ? '#0b1033' : '#6ec6ff');
    wg.addColorStop(1, night ? '#2b2f63' : '#d9f2ff');
    ctx.fillStyle = '#fff'; ctx.fillRect(380, 70, 160, 160);
    ctx.fillStyle = wg; ctx.fillRect(388, 78, 144, 144);
    emoji(ctx, night ? '🌙' : weatherFor(State.data.day)[0], 495, 115, 30);
    ctx.fillStyle = '#fff'; ctx.fillRect(457, 78, 6, 144); ctx.fillRect(388, 147, 144, 6);

    // 달력
    const c = s.calendar, d = State.data;
    ctx.fillStyle = '#fff'; rr(ctx, c.x, c.y, c.w, c.h, 8); ctx.fill();
    ctx.fillStyle = '#e53935'; rr(ctx, c.x, c.y, c.w, 34, 8); ctx.fill();
    text(ctx, `📅 ${d.day}일째`, c.x + c.w / 2, c.y + 17, 16, '#fff');
    const todo = d.schedule[d.day] || [];
    if (!todo.length) text(ctx, '일정 없음', c.x + c.w / 2, c.y + 85, 14, '#999');
    todo.slice(0, 4).forEach((t, k) => text(ctx, `${State.isDone(t) ? '✅' : '⬜'} ${TASKS[t].split(' ').slice(1).join(' ')}`, c.x + 10, c.y + 52 + k * 24, 13, '#333', 'left'));

    // TV + 장식장
    const tv = s.tv;
    ctx.fillStyle = '#8d5a2b'; rr(ctx, tv.x - 20, tv.y + tv.h, tv.w + 40, 62, 6); ctx.fill();
    ctx.fillStyle = '#a0683a'; ctx.fillRect(tv.x - 10, tv.y + tv.h + 12, tv.w / 2 - 5, 40); ctx.fillRect(tv.x + tv.w / 2 + 15, tv.y + tv.h + 12, tv.w / 2 - 5, 40);
    ctx.fillStyle = '#222'; rr(ctx, tv.x, tv.y, tv.w, tv.h, 8); ctx.fill();
    ctx.fillStyle = '#3a4050'; ctx.fillRect(tv.x + 7, tv.y + 7, tv.w - 14, tv.h - 14);
    ctx.fillStyle = 'rgba(255,255,255,.15)';
    ctx.beginPath(); ctx.moveTo(tv.x + 10, tv.y + 10); ctx.lineTo(tv.x + 50, tv.y + 10); ctx.lineTo(tv.x + 10, tv.y + 50); ctx.fill();
    text(ctx, 'TV', tv.x + tv.w / 2, tv.y + tv.h / 2, 18, '#8890a0');

    // 식탁
    const t = s.table;
    ctx.fillStyle = '#6d4220';
    ctx.fillRect(t.x + 20, t.y + 20, 14, t.h - 20); ctx.fillRect(t.x + t.w - 34, t.y + 20, 14, t.h - 20);
    ctx.fillStyle = '#a0683a'; rr(ctx, t.x, t.y, t.w, 26, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(t.x + 60, t.y + 2, 28, 8, 0, 0, 7); ctx.ellipse(t.x + 150, t.y + 2, 28, 8, 0, 0, 7); ctx.fill();
    text(ctx, '식탁', t.x + t.w / 2, t.y - 30, 20, '#6d4220');

    // 화장실 문
    const dr = s.bath;
    ctx.fillStyle = '#e3f2fd'; ctx.fillRect(dr.x - 6, dr.y - 6, dr.w + 12, dr.h + 6);
    ctx.fillStyle = '#90caf9'; rr(ctx, dr.x, dr.y, dr.w, dr.h, 6); ctx.fill();
    ctx.fillStyle = '#fff'; rr(ctx, dr.x + 20, dr.y + 20, 60, 40, 8); ctx.fill();
    emoji(ctx, '🚽', dr.x + dr.w / 2, dr.y + 40, 28);
    ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.arc(dr.x + 16, dr.y + dr.h / 2 + 20, 6, 0, 7); ctx.fill();
    text(ctx, '화장실', dr.x + dr.w / 2, dr.y - 22, 18, '#1565c0');
  },

  drawMyRoom(ctx, s) {
    // 침대
    const b = s.bed;
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(b.x, b.y - 60, 20, b.h + 60);
    ctx.fillRect(b.x + b.w - 14, b.y + 10, 14, b.h - 10);
    ctx.fillStyle = '#fff'; rr(ctx, b.x + 20, b.y + 10, b.w - 34, 70, 12); ctx.fill();
    ctx.fillStyle = '#fff7fb'; rr(ctx, b.x + 30, b.y - 6, 80, 40, 14); ctx.fill();
    ctx.fillStyle = '#ffb3d1'; rr(ctx, b.x + 100, b.y + 6, b.w - 114, 80, 12); ctx.fill();
    ctx.fillStyle = '#ff9cc2';
    for (let i = 0; i < 4; i++) ctx.fillRect(b.x + 120 + i * 40, b.y + 6, 14, 80);
    ctx.fillStyle = '#6d4220'; ctx.fillRect(b.x + 20, b.y + 80, b.w - 34, 40);
    text(ctx, '침대', b.x + b.w / 2, b.y - 30, 20, '#6d4220');

    // 옷장
    const c = s.closet;
    ctx.fillStyle = '#8d5a2b'; rr(ctx, c.x, c.y, c.w, c.h, 8); ctx.fill();
    ctx.fillStyle = '#a97142'; ctx.fillRect(c.x + 8, c.y + 8, c.w / 2 - 12, c.h - 16); ctx.fillRect(c.x + c.w / 2 + 4, c.y + 8, c.w / 2 - 12, c.h - 16);
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath(); ctx.arc(c.x + c.w / 2 - 12, c.y + c.h / 2, 5, 0, 7); ctx.arc(c.x + c.w / 2 + 12, c.y + c.h / 2, 5, 0, 7); ctx.fill();
    text(ctx, '👚 옷장', c.x + c.w / 2, c.y - 18, 18, '#6d4220');

    // 책상 + 의자 + 스탠드
    const k = s.desk;
    ctx.fillStyle = '#6d4220'; ctx.fillRect(k.x + 10, k.y + 20, 12, k.h - 20); ctx.fillRect(k.x + k.w - 22, k.y + 20, 12, k.h - 20);
    ctx.fillStyle = '#c68a52'; rr(ctx, k.x, k.y, k.w, 24, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(k.x + 40, k.y - 8, 60, 10);
    ctx.fillStyle = '#4a90e2'; ctx.fillRect(k.x + 110, k.y - 16, 30, 18);
    ctx.strokeStyle = '#555'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(k.x + 170, k.y); ctx.lineTo(k.x + 170, k.y - 60); ctx.lineTo(k.x + 150, k.y - 80); ctx.stroke();
    ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); ctx.moveTo(k.x + 135, k.y - 70); ctx.lineTo(k.x + 165, k.y - 92); ctx.lineTo(k.x + 160, k.y - 70); ctx.fill();
    const hw = State.data.homework.length;
    text(ctx, hw ? `📝 숙제 ${hw}개` : '책상', k.x + k.w / 2, k.y - 110, 18, hw ? '#d32f2f' : '#6d4220');
    // 창문
    ctx.fillStyle = '#fff'; ctx.fillRect(600, 80, 160, 120);
    ctx.fillStyle = State.isNight() ? '#1a1f45' : '#9bdcff'; ctx.fillRect(608, 88, 144, 104);
    emoji(ctx, State.isNight() ? '🌙' : weatherFor(State.data.day)[0], 680, 140, 30);
  },
};
