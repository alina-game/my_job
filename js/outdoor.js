// 야외 장소: 무사히 돌아오거나, 길을 잃으면 물건 3개로 10분 동안 버티기

const LOST_ITEMS = ['카메라', '손전등', '비상식량', '핸드폰', '충전기', '물', '이불', '돈', '장난감'];
const ITEM_ICON = { 카메라: '📷', 손전등: '🔦', 비상식량: '🥫', 핸드폰: '📱', 충전기: '🔌', 물: '💧', 이불: '🛏️', 돈: '💵', 장난감: '🧸' };
const NEEDS = { thirst: { say: '목이 말라요', fix: '물', icon: '💧', label: '목마름' }, hunger: { say: '배가 고파요', fix: '비상식량', icon: '🍙', label: '배고픔' } };
const SAFE_REWARD = 30;

Game.scenes.outdoor = {
  enter(p) {
    this.place = p.place;
    this.phase = 'explore';
    this.t = 0;
    this.walk = 0;
    Game.ui.append(h('div', { class: 'help', style: 'bottom:auto;top:40px;font-size:24px' }, `${this.place.icon} ${josa(this.place.name, '을', '를')} 탐험하는 중...`));
  },

  update(dt) {
    this.t += dt;
    if (this.phase === 'explore') {
      this.walk += dt * 10;
      if (this.t > 4) {
        const lostChance = Math.min(0.7, 0.45 + 0.1 * this.place.level);
        Math.random() < lostChance ? this.startLost() : this.safe();
      }
    } else if (this.phase === 'lost') {
      if (this.t >= TIME.lostText) this.startChoose();
    } else if (this.phase === 'survive') {
      this.updateSurvive(dt);
    } else if (this.phase === 'faint') {
      this.faintT = Math.min(1, this.faintT + dt);
      if (this.t > 2 && !this.overShown) { this.overShown = true; this.gameOver(); }
    }
    this.flash = Math.max(0, (this.flash || 0) - dt * 2);
  },

  safe() {
    this.phase = 'safe';
    State.data.coins += SAFE_REWARD;
    State.save();
    Game.ui.innerHTML = '';
    modal(
      h('h2', {}, '😊 무사히 돌아왔어요!'),
      h('p', {}, `${this.place.name}에서 멋진 경치를 구경했어요.`),
      h('p', { style: 'color:#b8860b' }, `💰 +${SAFE_REWARD}코인`),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => Game.go('town') }, '돌아가기')));
  },

  startLost() {
    this.phase = 'lost';
    this.t = 0;
    Game.ui.innerHTML = '';
    Game.ui.append(h('div', { class: 'overlay', style: 'background:rgba(0,0,0,.35)' }, h('div', { class: 'lost-text' }, '길을 잃었어요!')));
  },

  startChoose() {
    this.phase = 'choose';
    this.chosen = [];
    Game.ui.innerHTML = '';
    const count = h('p', {}, '');
    const go = h('button', { class: 'btn green', onclick: () => this.startSurvive() }, '이 물건으로 버티기!');
    const refresh = () => {
      count.textContent = `고른 물건 ${this.chosen.length} / 3 · 다시 누르면 취소돼요`;
      go.disabled = this.chosen.length !== 3;
    };
    const tiles = LOST_ITEMS.map(name => {
      const el = h('div', { class: 'choice' }, name);
      el.addEventListener('click', () => {
        const k = this.chosen.indexOf(name);
        if (k >= 0) {
          this.chosen.splice(k, 1);
          el.classList.remove('on');
          el.querySelector('.check').remove();
        } else {
          if (this.chosen.length >= 3) return toast('3개만 고를 수 있어요! 다른 걸 먼저 취소해요');
          this.chosen.push(name);
          el.classList.add('on');
          el.append(h('span', { class: 'check' }, '✔'));
        }
        refresh();
      });
      return el;
    });
    modal(
      h('h2', {}, '무엇을 가져갈까요? (3개)'),
      h('p', { style: 'font-size:17px;color:#777' }, `${Math.round(TIME.survive / 60)}분 동안 고른 물건으로 버텨야 해요!`),
      h('div', { class: 'choose-grid' }, tiles),
      count,
      h('div', { class: 'row' }, go));
    refresh();
  },

  startSurvive() {
    this.phase = 'survive';
    this.elapsed = 0;
    this.cut = 0;         // 엄마랑 통화해서 줄어든 시간
    this.nextCall = 0;    // 다시 통화할 수 있는 때
    this.askT = 0;
    this.since = { thirst: null, hunger: null };
    this.say = null;
    this.light = false;
    this.blanket = false;
    Game.ui.innerHTML = '';
    this.timerEl = h('div', { class: 'pill' }, '');
    this.chips = { thirst: h('div', { class: 'need' }), hunger: h('div', { class: 'need' }) };
    Game.ui.append(
      h('div', { class: 'topbar' },
        h('span', {}, `${this.place.icon} ${this.place.name} · 길을 잃었어요`),
        h('div', { class: 'spacer' }),
        this.timerEl),
      h('div', { class: 'need-chips' }, this.chips.thirst, this.chips.hunger),
      h('div', { class: 'items-bar' }, this.chosen.map(name =>
        h('button', { class: 'btn', onclick: () => this.useItem(name) }, `${ITEM_ICON[name]} ${name}`))));
  },

  // 엄마랑 통화하면 구조까지 남은 시간이 30초 줄어듦. 30초 지나야 다시 통화 가능.
  callMom(charged) {
    if (!charged) return this.talk('배터리가 없어요... 😢');
    if (this.elapsed < this.nextCall) return this.talk(`엄마가 바빠요. ${Math.ceil(this.nextCall - this.elapsed)}초 뒤에 다시 걸어요`);
    this.cut += CALL_CUT;
    this.nextCall = this.elapsed + CALL_COOLDOWN;
    this.talk(`엄마랑 통화했어요! 구조가 ${CALL_CUT}초 빨라져요 📱`, 4);
    const p = elPos(this.timerEl);
    floatText(`-${CALL_CUT}초`, p.x - 30, p.y + 30);
  },

  talk(msg, sec = 3) { this.say = { msg, until: this.elapsed + sec }; },

  useItem(name) {
    if (this.phase !== 'survive') return;
    const has = n => this.chosen.includes(n);
    const fixNeed = need => {
      if (this.since[need] == null) return this.talk(`아직 ${NEEDS[need].label === '목마름' ? '목마르지' : '배고프지'} 않아요`);
      this.since[need] = null;
      this.talk(need === 'thirst' ? '고마워요! 시원해요 💧' : '고마워요! 배불러요 😋');
    };
    switch (name) {
      case '물': return fixNeed('thirst');
      case '비상식량': return fixNeed('hunger');
      case '손전등': this.light = !this.light; return this.talk(this.light ? '밝아졌어요! 🔦' : '손전등을 껐어요');
      case '카메라': this.flash = 1; return this.talk('찰칵! 사진을 찍었어요 📷');
      case '핸드폰': return this.callMom(has('충전기'));
      case '충전기': return this.talk(has('핸드폰') ? '핸드폰을 충전했어요 🔌' : '충전할 게 없어요...');
      case '이불': this.blanket = !this.blanket; return this.talk(this.blanket ? '포근하고 따뜻해요 🛏️' : '이불을 개었어요');
      case '돈': return this.talk('여기서는 돈을 쓸 곳이 없어요 💵');
      case '장난감': return this.talk('장난감으로 놀았어요! 덜 심심해요 🧸');
    }
  },

  updateSurvive(dt) {
    this.elapsed += dt;
    this.askT += dt;
    if (this.askT >= TIME.ask) {   // 30초마다 랜덤으로 말함
      this.askT = 0;
      const need = Math.random() < 0.5 ? 'thirst' : 'hunger';
      if (this.since[need] == null) this.since[need] = this.elapsed;
      this.talk(NEEDS[need].say + '...', 4);
    }
    for (const need of ['thirst', 'hunger']) {
      const s = this.since[need], n = NEEDS[need], chip = this.chips[need];
      if (s == null) {
        chip.className = 'need';
        chip.textContent = `${n.icon} ${n.label}: 괜찮아요`;
      } else {
        const remain = TIME.faint - (this.elapsed - s);
        chip.className = 'need bad';
        chip.textContent = `${n.icon} ${n.say}! (${fmt(remain)})`;
        if (remain <= 0) return this.faint();
      }
    }
    const left = TIME.survive - this.elapsed - this.cut;
    this.timerEl.textContent = `🚁 구조까지 ${fmt(left)}`;
    if (left <= 0) this.rescued();
  },

  faint() {
    this.phase = 'faint';
    this.t = 0;
    this.faintT = 0;
    this.overShown = false;
    Game.ui.innerHTML = '';
  },

  gameOver() {
    modal(
      h('h2', {}, '😵 캐릭터가 쓰러졌어요...'),
      h('p', {}, '말을 너무 오래 무시했어요.'),
      h('p', { style: 'color:#d32f2f;font-size:28px;font-weight:900' }, '게임 오버'),
      h('p', {}, '처음부터 다시 해야 해요.'),
      h('div', { class: 'row' }, h('button', {
        class: 'btn red', onclick: () => { State.reset(); Game.go('select'); },
      }, '처음부터 다시하기')));
  },

  rescued() {
    this.phase = 'rescued';
    Game.ui.innerHTML = '';
    modal(
      h('h2', {}, '🚁 구조되었어요!'),
      h('p', {}, `${Math.round(TIME.survive / 60)}분 동안 잘 버텼어요! 무사히 집으로 돌아왔어요.`),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => Game.go('home') }, '집으로')));
  },

  // ---------- 그리기 ----------
  draw(ctx) {
    const lost = this.phase !== 'explore' && this.phase !== 'safe';
    const c = this.place.color;
    const g = ctx.createLinearGradient(0, 0, 0, 420);
    g.addColorStop(0, lost ? '#1b1f3a' : '#7fd1ff');
    g.addColorStop(1, lost ? '#3b3f5c' : '#e8f8ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 420);
    ctx.fillStyle = shade(c, lost ? -60 : -10);
    ctx.beginPath(); ctx.moveTo(0, 420); ctx.lineTo(220, 180); ctx.lineTo(420, 330); ctx.lineTo(650, 150); ctx.lineTo(960, 400); ctx.lineTo(960, 420); ctx.fill();
    ctx.fillStyle = lost ? '#2c3a22' : '#7cb342'; ctx.fillRect(0, 420, W, 180);
    const scroll = this.phase === 'explore' ? this.t * 120 : 0;
    for (let i = 0; i < 12; i++) {
      const tx = ((i * 97 - scroll) % 1060 + 1060) % 1060 - 60, th = 120 + (i % 4) * 30, base = 430 + (i % 3) * 30;
      ctx.fillStyle = '#5d4037'; ctx.fillRect(tx + 22, base - 30, 10, 30);
      ctx.fillStyle = lost ? '#1e3a1e' : shade('#2e7d32', (i % 2) * 25);
      ctx.beginPath(); ctx.moveTo(tx, base - 25); ctx.lineTo(tx + 27, base - 25 - th); ctx.lineTo(tx + 54, base - 25); ctx.fill();
    }

    const id = currentLook(), cx = 480, cy = 500;
    if (this.phase === 'faint') {
      drawCharacter(ctx, id, cx, cy, 1.6, { rotate: this.faintT * Math.PI / 2, faint: true });
    } else {
      drawCharacter(ctx, id, cx, cy, 1.6, { walk: this.phase === 'explore' ? this.t * 10 : 0, sad: lost });
      if (this.blanket) {
        ctx.fillStyle = 'rgba(200,70,70,.9)';
        rr(ctx, cx - 34, cy - 118, 68, 90, 16); ctx.fill();
      }
    }

    if (lost) {
      // 어둠 (손전등을 켜면 밝아짐)
      ctx.save();
      if (this.light) {
        const rg = ctx.createRadialGradient(cx, cy - 80, 40, cx, cy - 80, 330);
        rg.addColorStop(0, 'rgba(0,0,15,0)');
        rg.addColorStop(1, 'rgba(0,0,15,.7)');
        ctx.fillStyle = rg;
      } else ctx.fillStyle = 'rgba(0,0,15,.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${this.flash})`; ctx.fillRect(0, 0, W, H); }

    if (this.phase === 'survive') {
      let msg = null;
      if (this.say && this.elapsed < this.say.until) msg = this.say.msg;
      else if (this.since.thirst != null) msg = NEEDS.thirst.say + '...';
      else if (this.since.hunger != null) msg = NEEDS.hunger.say + '...';
      if (msg) bubble(ctx, msg, cx, cy - 185, 22);
    }
  },
};
