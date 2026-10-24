// 입원(사고 후): 입원실에서 눈을 뜨고, 3분 동안 병원 복도를 다니며 여러 병실의 환자들과 친해져요.

const WARD_PATIENTS = [
  {
    name: '민준', room: 101, desc: '다리에 깁스한 아이', s: 1, cast: 'leg',
    look: { hair: 'boy_brown', top: 'gown', bottom: 'shorts', shoes: 'slippers', hat: 'none' },
    lines: ['축구하다가 넘어져서 다리가 부러졌어 ⚽', '깁스에 그림 그려 줄래? 헤헤', '빨리 나아서 다시 뛰고 싶어!', '병원 밥은 좀 싱거워…', '너도 다쳤어? 우리 같이 힘내자!'],
  },
  {
    name: '순자 할머니', room: 102, desc: '허리가 아픈 할머니', s: 1.2, glasses: true, grey: true,
    look: { hair: 'mom_bun', top: 'gown', bottom: 'long_skirt', shoes: 'slippers', hat: 'none' },
    lines: ['아이고, 귀여운 손님이 왔네~', '우리 손주도 너만 하단다 😊', '옛날에는 말이야, 이 동네가 다 논밭이었어', '사탕 하나 줄까? 호호', '자주 놀러 오렴~'],
  },
  {
    name: '지훈 형', room: 103, desc: '팔을 다친 중학생 형', s: 1.2, cast: 'arm',
    look: { hair: 'boy_dark', top: 'gown', bottom: 'black_pants', shoes: 'slippers', hat: 'none' },
    lines: ['자전거 타다가 팔을 다쳤어 🚲', '오른팔이라 숙제를 못 해서 좋아! …아니 안 좋아', '게임 좋아해? 나중에 같이 하자', '헬멧은 꼭 써야 해, 알았지?', '너 은근히 재밌다 ㅋㅋ'],
  },
  {
    name: '서아', room: 104, desc: '감기에 걸린 꼬마', s: 0.9, sick: true,
    look: { hair: 'girl_pony', top: 'gown', bottom: 'jeans', shoes: 'pink_shoes', hat: 'none' },
    lines: ['콜록콜록… 안녕 🤧', '주사 맞았는데 하나도 안 울었어!', '토끼 인형 보고 싶어…', '너는 무슨 색 좋아해? 나는 분홍색!', '감기 다 나으면 놀이터 가자!'],
  },
  {
    name: '덕배 할아버지', room: 105, desc: '수술받은 할아버지', s: 1.2, glasses: true, grey: true, mustache: true,
    look: { hair: 'boy_dark', top: 'gown', bottom: 'black_pants', shoes: 'slippers', hat: 'beanie' },
    lines: ['허허, 어디서 온 꼬마 손님이냐?', '할아버지가 젊었을 땐 택시 기사였단다 🚖', '바둑 둘 줄 아니? 허허', '밥 잘 먹어야 쑥쑥 큰다', '오늘 날씨가 어떻냐? 창밖이 궁금하구나'],
  },
];
const WARD_DOORS = WARD_PATIENTS.map((p, i) => ({ i, x: 380 + i * 240 }));
const WARD_MY_DOOR = 140;
const WARD_WIDTH = 1700;

Game.scenes.ward = {
  enter() {
    this.t = 0;
    this.wake = 1.6;
    this.left = TIME.ward;
    this.view = 'myroom';
    this.room = -1;
    this.px = WARD_MY_DOOR;
    this.py = 500;
    this.dir = 1;
    this.walk = 0;
    this.target = null;
    this.say = { msg: '여기가 어디지…?', until: 4 };
    this.talkIdx = {};
    this.out = false;
    if (!State.data.friends) State.data.friends = {};
    this.render();
    toast('🏥 병원 입원실에서 눈을 떴어요… 3분 동안 입원해요', 3500);
  },

  look() { return { ...currentLook(), top: 'gown', hat: 'none' }; },

  render() {
    Game.ui.innerHTML = '';
    this.timerEl = h('div', { class: 'pill' }, '');
    const title = this.view === 'hall' ? '🏥 병원 복도' : this.view === 'myroom' ? '🛏️ 내 병실 (100호)' : `🚪 ${WARD_PATIENTS[this.room].room}호 · ${WARD_PATIENTS[this.room].name}`;
    Game.ui.append(h('div', { class: 'topbar' },
      this.view === 'room' ? h('button', { class: 'btn small gray', onclick: () => this.toHall() }, '⬅ 복도로') : null,
      h('span', {}, title),
      h('div', { class: 'spacer' }),
      this.timerEl));
    if (this.view === 'myroom') {
      Game.ui.append(h('div', { class: 'items-bar' }, h('button', { class: 'btn green', onclick: () => this.toHall() }, '🚶 복도로 나가기')));
    } else if (this.view === 'room') {
      Game.ui.append(h('div', { class: 'items-bar' },
        h('button', { class: 'btn', onclick: () => this.talk() }, '💬 이야기하기'),
        h('button', { class: 'btn pink', onclick: () => this.gift() }, '🎁 선물하기'),
        h('button', { class: 'btn blue', onclick: () => this.rps() }, '✊ 가위바위보')));
    } else {
      Game.ui.append(h('div', { class: 'help' }, '방향키로 걸어요 · 병실 문 앞에서 스페이스바(또는 문 클릭)로 들어가요'));
    }
  },

  toHall() {
    if (this.view === 'room') this.px = WARD_DOORS[this.room].x;
    else if (this.view === 'myroom') this.px = WARD_MY_DOOR;
    this.view = 'hall';
    this.room = -1;
    this.say = null;
    this.target = null;
    this.render();
  },

  enterRoom(i) {
    if (i < 0) { this.view = 'myroom'; this.say = null; this.render(); return; }
    this.view = 'room';
    this.room = i;
    const p = WARD_PATIENTS[i], f = State.data.friends[p.name] || 0;
    this.say = { msg: f >= 100 ? '친구야! 또 왔구나 😄' : f > 0 ? '또 왔네! 반가워 😊' : '안녕? 처음 보는 얼굴이네!', until: this.t + 3 };
    this.render();
  },

  // ---------- 친해지기 ----------
  patient() { return WARD_PATIENTS[this.room]; },

  addFriend(n, msg) {
    const p = this.patient(), fr = State.data.friends;
    const before = fr[p.name] || 0, after = Math.min(100, before + n);
    fr[p.name] = after;
    State.save();
    this.say = { msg, until: this.t + 3.5 };
    floatText(`💕 +${n}`, 640, 160);
    if (before < 100 && after >= 100) {
      setTimeout(() => modal(
        h('h2', {}, `🎉 ${josa(p.name, '이', '가')} 친구가 됐어요!`),
        h('p', {}, `${p.name}: "우리 이제 진짜 친구야! 퇴원해도 잊지 마!" 💕`),
        h('div', { class: 'row' }, h('button', { class: 'btn', onclick: e => e.currentTarget.closest('.overlay').remove() }, '좋아요'))), 300);
    }
  },

  talk() {
    const p = this.patient();
    const k = this.talkIdx[p.name] || 0;
    this.talkIdx[p.name] = k + 1;
    this.addFriend(10, p.lines[k % p.lines.length]);
  },

  gift() {
    const bag = State.data.bag;
    const o = modal(
      h('h2', {}, '🎁 무엇을 선물할까요?'),
      bag.length
        ? h('div', { class: 'list' }, bag.map((it, idx) => h('button', {
          class: 'opt', onclick: () => {
            bag.splice(idx, 1);
            o.remove();
            this.addFriend(25, `와! ${it.icon} ${it.name}! 정말 고마워! 💕`);
          },
        }, h('span', { class: 'ic' }, it.icon), it.name)))
        : h('p', {}, '가방이 비어 있어요… 다음에 선물을 가져와요'),
      h('div', { class: 'row' }, h('button', { class: 'btn gray', onclick: () => o.remove() }, '닫기')));
  },

  rps() {
    const hands = [['✊', '바위'], ['✌️', '가위'], ['✋', '보']];
    const res = h('p', { style: 'font-size:22px;min-height:30px' }, '하나를 골라요!');
    const row = h('div', { class: 'row' });
    const o = modal(h('h2', {}, '✊ ✌️ ✋ 가위바위보!'), res, row,
      h('div', { class: 'row' }, h('button', { class: 'btn gray', onclick: () => o.remove() }, '그만하기')));
    hands.forEach((hd, i) => row.append(h('button', {
      class: 'opt', style: 'width:110px;height:100px', onclick: () => {
        const j = Math.floor(Math.random() * 3);
        // 0 바위, 1 가위, 2 보 : i가 j를 이기면 (i+1)%3 === j
        const r = i === j ? 'draw' : (i + 1) % 3 === j ? 'win' : 'lose';
        const p = this.patient();
        res.textContent = `나 ${hd[0]} vs ${p.name} ${hands[j][0]} → ${r === 'win' ? '내가 이겼다! 🎉' : r === 'draw' ? '비겼어요!' : '졌어요… 😆'}`;
        this.addFriend(r === 'win' ? 15 : r === 'draw' ? 10 : 5,
          r === 'win' ? '으앗, 졌다! 한 판 더 해!' : r === 'draw' ? '헤헤 마음이 통했나 봐!' : '내가 이겼지롱~ 😜');
      },
    }, h('span', { class: 'ic' }, hd[0]), hd[1])));
  },

  discharge() {
    this.out = true;
    State.data.sick = false;
    State.save();
    Game.ui.innerHTML = '';
    const friends = WARD_PATIENTS.filter(p => (State.data.friends[p.name] || 0) >= 100).map(p => p.name);
    modal(
      h('h2', {}, '🏥 퇴원해요!'),
      h('p', {}, '다 나았어요! 이제 집으로 가요 😊'),
      friends.length ? h('p', {}, `💕 병원 친구: ${friends.join(', ')}`) : h('p', { style: 'color:#888' }, '다음에는 환자들과 더 친해져 봐요'),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => Game.go('home') }, '🏠 집으로')));
  },

  // ---------- 움직임 ----------
  update(dt) {
    this.t += dt;
    this.wake = Math.max(0, this.wake - dt);
    if (this.out) return;
    this.left -= dt;
    if (this.timerEl) this.timerEl.textContent = `⏰ 퇴원까지 ${fmt(this.left)}`;
    if (this.left <= 0) return this.discharge();
    if (this.view !== 'hall' || Game.hasOverlay()) return;
    const k = Game.keys;
    let vx = 0;
    if (k.ArrowLeft) vx -= 1;
    if (k.ArrowRight) vx += 1;
    if (k.ArrowUp) this.py = clamp(this.py - 120 * dt, 470, 540);
    if (k.ArrowDown) this.py = clamp(this.py + 120 * dt, 470, 540);
    if (vx) this.target = null;
    if (this.target) {
      const dx = this.target.tx - this.px;
      if (Math.abs(dx) < 8) { const r = this.target.room; this.target = null; if (r != null) return this.enterRoom(r); }
      else vx = Math.sign(dx);
    }
    this.px = clamp(this.px + vx * 220 * dt, 30, WARD_WIDTH - 30);
    if (vx) this.dir = vx;
    this.walk = vx ? this.walk + dt * 11 : 0;
    this.near = Math.abs(this.px - WARD_MY_DOOR) < 60 ? -1 : (WARD_DOORS.find(d => Math.abs(d.x - this.px) < 60) || { i: null }).i;
    this.cam = clamp(this.px - W / 2, 0, WARD_WIDTH - W);
  },

  onKey(e) {
    if (Game.hasOverlay()) return;
    if (e.key === 'Escape' && this.view !== 'hall') return this.toHall();
    if ((e.key === ' ' || e.key === 'Enter') && this.view === 'hall' && this.near != null) this.enterRoom(this.near);
  },

  onPointerDown(x, y) {
    if (this.view !== 'hall' || Game.hasOverlay()) return;
    const wx = x + (this.cam || 0);
    if (y > 220 && y < 440) {
      if (Math.abs(wx - WARD_MY_DOOR) < 55) return (this.target = { tx: WARD_MY_DOOR, room: -1 });
      const d = WARD_DOORS.find(d => Math.abs(d.x - wx) < 55);
      if (d) return (this.target = { tx: d.x, room: d.i });
    }
    this.target = { tx: wx };
  },

  // ---------- 그리기 ----------
  draw(ctx) {
    const blur = this.wake > 0 ? Math.round(this.wake * 6) : 0;
    if (blur) ctx.filter = `blur(${blur}px)`;
    if (this.view === 'hall') this.drawHall(ctx);
    else this.drawRoom(ctx);
    ctx.filter = 'none';
    if (this.wake > 0) {   // 눈꺼풀이 위아래로 열려요
      const k = 1 - this.wake / 1.6, open = k < 0.3 ? k * 0.8 : k < 0.45 ? 0.24 - (k - 0.3) : Math.min(1, 0.09 + (k - 0.45) * 1.7);
      const lid = (1 - open) * (H / 2 + 40);
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, lid - 40); ctx.quadraticCurveTo(W / 2, lid + 40, 0, lid - 40); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(W, H); ctx.lineTo(W, H - lid + 40); ctx.quadraticCurveTo(W / 2, H - lid - 40, 0, H - lid + 40); ctx.fill();
    }
  },

  drawHall(ctx) {
    const cam = this.cam || 0;
    ctx.fillStyle = '#e8f5e9'; ctx.fillRect(0, 0, W, 440);
    ctx.fillStyle = '#c8e6c9'; ctx.fillRect(0, 380, W, 60);
    ctx.fillStyle = '#a5d6a7'; ctx.fillRect(0, 372, W, 8);
    for (let y = 440; y < H; y += 40) for (let x = -(cam % 80); x < W; x += 40) {
      ctx.fillStyle = (((x + cam) / 40 | 0) + y / 40) % 2 ? '#eceff1' : '#cfd8dc';
      ctx.fillRect(x, y, 40, 40);
    }
    // 천장 조명
    ctx.fillStyle = '#fffde7';
    for (let x = -(cam % 300) + 100; x < W; x += 300) rr(ctx, x, 70, 120, 14, 6), ctx.fill();
    // 문들
    const door = (x, label, sub, color) => {
      const sx = x - cam;
      if (sx < -100 || sx > W + 100) return;
      ctx.fillStyle = '#90a4ae'; ctx.fillRect(sx - 60, 228, 120, 212);
      ctx.fillStyle = color; rr(ctx, sx - 52, 236, 104, 204, 4); ctx.fill();
      ctx.fillStyle = '#e3f2fd'; ctx.fillRect(sx - 30, 256, 60, 40);
      ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(sx + 36, 340, 6, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; rr(ctx, sx - 70, 160, 140, 56, 10); ctx.fill();
      text(ctx, label, sx, 178, 18, '#2e7d32');
      text(ctx, sub, sx, 200, 14, '#555');
    };
    door(WARD_MY_DOOR, '100호', '내 병실', '#b39ddb');
    WARD_DOORS.forEach(d => {
      const p = WARD_PATIENTS[d.i], f = State.data.friends[p.name] || 0;
      door(d.x, `${p.room}호`, `${p.name}${f >= 100 ? ' 💕' : ''}`, '#81d4fa');
    });
    // 간호사실
    const nx = 1560 - cam;
    if (nx < W + 200) {
      ctx.fillStyle = '#fff'; rr(ctx, nx - 100, 300, 200, 100, 10); ctx.fill();
      ctx.fillStyle = '#e53935'; ctx.fillRect(nx - 100, 300, 200, 10);
      emoji(ctx, '👩‍⚕️', nx, 260, 70);
      text(ctx, '간호사실', nx, 350, 18, '#c62828');
      text(ctx, '🤫 조용히 해 주세요', nx, 380, 13, '#555');
    }
    drawCharacter(ctx, this.look(), this.px - cam, this.py, 1, { walk: this.walk, dir: this.dir });
    if (this.near != null && !Game.hasOverlay()) {
      const label = this.near < 0 ? '내 병실' : `${WARD_PATIENTS[this.near].room}호`;
      bubble(ctx, `스페이스바: ${label} 들어가기`, this.px - cam, this.py - 122, 16);
    }
  },

  drawRoom(ctx) {
    ctx.fillStyle = '#f1f8e9'; ctx.fillRect(0, 0, W, 430);
    ctx.fillStyle = '#d7ccc8'; ctx.fillRect(0, 430, W, 170);
    // 창문
    const night = State.isNight();
    ctx.fillStyle = '#fff'; ctx.fillRect(90, 100, 180, 150);
    ctx.fillStyle = night ? '#1a237e' : '#b3e5fc'; ctx.fillRect(98, 108, 164, 134);
    ctx.fillStyle = '#fff'; ctx.fillRect(177, 108, 6, 134);
    ctx.fillStyle = '#f8bbd0'; ctx.fillRect(80, 92, 30, 170); ctx.fillRect(250, 92, 30, 170);
    // 침대
    const bx = 520;
    ctx.fillStyle = '#b0bec5'; ctx.fillRect(bx - 10, 300, 14, 190); ctx.fillRect(bx + 300, 360, 14, 130);
    ctx.fillStyle = '#eceff1'; rr(ctx, bx, 400, 310, 60, 10); ctx.fill();
    ctx.fillStyle = '#90a4ae'; ctx.fillRect(bx, 460, 310, 14);
    ctx.fillStyle = '#fff'; rr(ctx, bx + 20, 340, 110, 50, 16); ctx.fill();
    // 링거
    ctx.fillStyle = '#9e9e9e'; ctx.fillRect(bx - 60, 150, 5, 330);
    ctx.fillStyle = 'rgba(180,220,255,.9)'; rr(ctx, bx - 78, 160, 40, 56, 8); ctx.fill();

    if (this.view === 'myroom') {
      this.drawInBed(ctx, this.look(), bx + 80, 1.3, {});
      text(ctx, '100호 · 내 병실', 480, 92, 20, '#2e7d32');
    } else {
      const p = this.patient();
      this.drawInBed(ctx, p.look, bx + 80, 1.3 * p.s, p);
      drawCharacter(ctx, this.look(), 330, 540, 1.3, {});
      // 친한 마음
      const f = State.data.friends[p.name] || 0;
      ctx.fillStyle = 'rgba(255,255,255,.9)'; rr(ctx, 330, 76, 300, 56, 14); ctx.fill();
      text(ctx, `${p.name} · ${p.desc}`, 480, 92, 16, '#333');
      ctx.fillStyle = '#eee'; rr(ctx, 350, 108, 200, 14, 7); ctx.fill();
      ctx.fillStyle = '#ff7aa8'; rr(ctx, 350, 108, 2 * f + 1, 14, 7); ctx.fill();
      text(ctx, `💕 ${f}/100${f >= 100 ? ' 친구!' : ''}`, 590, 115, 13, '#c2185b');
    }
    if (this.say && this.t < this.say.until && this.say.msg) {
      const x = this.view === 'myroom' ? 600 : 640;
      bubble(ctx, this.say.msg, Math.min(x, 960 - 10 - this.say.msg.length * 9), 250, 18);
    }
  },

  // 침대에 앉아 있는 사람 (이불 덮음)
  drawInBed(ctx, look, x, S, p) {
    const fy = 448;
    drawCharacter(ctx, look, x, fy, S, { sick: p.sick });
    const hx = x, hy = fy + HEAD_Y * S, k = HEAD_R / 21 * S;
    if (p.grey) {
      ctx.fillStyle = 'rgba(220,220,225,.85)';
      ctx.beginPath(); ctx.arc(hx, hy - 1 * k, 23 * k, Math.PI, Math.PI * 2); ctx.fill();
      if (look.hair === 'mom_bun') { ctx.beginPath(); ctx.arc(hx, hy - 24 * k, 10 * k, 0, 7); ctx.fill(); }
    }
    if (p.glasses) {
      ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 1.6 * k;
      ctx.beginPath(); ctx.arc(hx - 7.5 * k, hy + 2 * k, 5 * k, 0, 7); ctx.moveTo(hx + 12.5 * k, hy + 2 * k); ctx.arc(hx + 7.5 * k, hy + 2 * k, 5 * k, 0, 7);
      ctx.moveTo(hx - 2.5 * k, hy + 2 * k); ctx.lineTo(hx + 2.5 * k, hy + 2 * k); ctx.stroke();
    }
    if (p.mustache) {
      ctx.fillStyle = '#cfcfcf';
      ctx.beginPath(); ctx.ellipse(hx - 4 * k, hy + 7.5 * k, 4.5 * k, 2 * k, 0.2, 0, 7); ctx.ellipse(hx + 4 * k, hy + 7.5 * k, 4.5 * k, 2 * k, -0.2, 0, 7); ctx.fill();
    }
    if (p.cast === 'arm') {
      ctx.fillStyle = '#fff';
      ctx.save(); ctx.translate(x + 4 * S, fy - 48 * S); ctx.rotate(-0.5);
      rr(ctx, -6 * S, -5 * S, 26 * S, 11 * S, 4 * S); ctx.fill(); ctx.restore();
      ctx.strokeStyle = '#64b5f6'; ctx.lineWidth = 3 * S;
      ctx.beginPath(); ctx.moveTo(x - 12 * S, fy - 57 * S); ctx.lineTo(x + 16 * S, fy - 40 * S); ctx.stroke();
    }
    // 이불
    ctx.fillStyle = '#81d4fa';
    rr(ctx, x - 50 * Math.max(1, S / 1.3), fy - 40 * S, 260, 40 * S + 20, 14); ctx.fill();
    ctx.fillStyle = '#4fc3f7';
    for (let i = 0; i < 4; i++) ctx.fillRect(x - 30 + i * 60, fy - 40 * S, 14, 40 * S + 20);
    if (p.cast === 'leg') {   // 깁스한 다리를 매달아 둠
      const k0 = { x: x + 150, y: fy - 22 }, k1 = { x: x + 215, y: fy - 78 };
      ctx.strokeStyle = '#9e9e9e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(k1.x - 10, 250); ctx.lineTo(k1.x - 10, k1.y - 8); ctx.stroke();
      ctx.strokeStyle = '#fafafa'; ctx.lineWidth = 26; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(k0.x, k0.y); ctx.lineTo(k1.x, k1.y); ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(k1.x + 10, k1.y - 9, 9, 0, 7); ctx.fill();
      ctx.strokeStyle = '#ef9a9a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(k0.x + 15, k0.y - 18); ctx.lineTo(k0.x + 28, k0.y - 26); ctx.stroke();
      ctx.save(); ctx.translate((k0.x + k1.x) / 2 + 8, (k0.y + k1.y) / 2); ctx.rotate(-0.7);
      text(ctx, '힘내!♥', 0, 0, 11, '#1e88e5'); ctx.restore();
    }
  },
};
