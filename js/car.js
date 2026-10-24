// 택시: 가고 싶은 장소를 글자로 입력하면 창문 너머로 길이 보이면서 그곳으로 가요.
// 가끔 사고가 나면 구급차가 달려오고, 병원 입원실(ward)에서 눈을 떠요.

const TAXI_FACILITIES = ['store', 'school', 'hospital', 'vet', 'academy', 'taxi'];

// 지금 갈 수 있는 장소 목록
function taxiPlaces() {
  const d = State.data, n = d.town, town = getTown(n), list = [];
  list.push({ name: '우리 집', keys: ['집', '우리집', '홈'], home: true });
  for (let k = 1; k <= d.maxTown; k++) list.push({ name: `동네${k}`, keys: [`동네${k}`], town: k, x: 60 });
  const seen = new Set();
  for (const b of town.buildings) {
    if (seen.has(b.name)) continue;
    const open = TAXI_FACILITIES.includes(b.kind) || ((b.kind === 'shop' || b.kind === 'art') && isShopOpen(n, b.index));
    if (!open || b.kind === 'outdoor') continue;
    seen.add(b.name);
    const keys = [b.name];
    if (b.kind === 'taxi') keys.push('택시');
    list.push({ name: b.name, keys, town: n, x: b.x + b.w / 2 });
  }
  for (let k = 1; k <= d.maxTown; k += 10) {
    const o = getTown(k).outdoor;
    if (o) list.push({ name: o.name, keys: [o.name], town: k, x: o.x + o.w / 2 });
  }
  return list;
}

// 입력한 글자로 장소 찾기. { place } 또는 { error, suggest }
function taxiFind(text) {
  const q = text.replace(/\s/g, '');
  const list = taxiPlaces();
  const norm = s => s.replace(/\s/g, '');
  if (!q) return { error: '가고 싶은 곳을 적어 주세요!', suggest: list };
  const m = q.match(/^동네(\d+)$/);
  if (m) {
    const k = Number(m[1]);
    if (k >= 1 && k <= State.data.maxTown) return { place: list.find(p => p.town === k && p.name === `동네${k}`) };
    return { error: `🔒 동네${k}은(는) 아직 갈 수 없어요. 가게를 더 열어 봐요!`, suggest: list };
  }
  let p = list.find(p => p.keys.some(k => norm(k) === q));
  if (!p) p = list.find(p => p.keys.some(k => norm(k).includes(q) || q.includes(norm(k))));
  if (p) return { place: p };
  // 잠긴 가게 이름?
  const town = getTown(State.data.town);
  const locked = town.shops.find(b => norm(b.name).includes(q) || q.includes(norm(b.name)));
  if (locked) return { error: `🔒 ${josa(locked.name, '은', '는')} 아직 잠겨 있어요. 옆 가게에서 코인을 더 모아 봐요!`, suggest: list };
  return { error: `🤔 "${text.trim()}"… 그런 곳은 잘 모르겠어요. 이런 곳은 어때요?`, suggest: list };
}

Game.scenes.taxi = {
  enter() {
    this.t = 0;
    this.phase = 'ask';
    this.speed = 0;
    this.scroll = 0;
    this.dest = null;
    this.render();
  },

  render() {
    Game.ui.innerHTML = '';
    Game.ui.append(h('div', { class: 'topbar' },
      h('button', { class: 'btn small gray', onclick: () => this.phase === 'ask' && Game.go('town') }, '🚪 내리기'),
      h('span', {}, '🚖 택시'),
      h('div', { class: 'spacer' }),
      h('div', { class: 'pill' }, `요금 💰 ${TAXI_FEE} · 내 코인 ${State.data.coins}`)));
    if (this.phase !== 'ask') return;
    const input = h('input', { class: 'name-input', maxlength: 14, placeholder: '예: 동네2, 학원, 빵집, 집', style: 'width:300px' });
    this.msg = h('div', { style: 'min-height:26px;font-size:17px;font-weight:bold;color:#5a3410;margin:8px 0' }, '');
    this.sugg = h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center' });
    const go = () => this.depart(input.value);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    Game.ui.append(h('div', {
      class: 'card', style: 'position:absolute;left:50%;top:92px;transform:translateX(-50%);width:600px;padding:16px 24px',
    },
      h('div', { style: 'font-size:26px;font-weight:900' }, '🚖 기사님: 어디로 갈까요?'),
      h('div', { style: 'margin-top:10px;display:flex;gap:10px;justify-content:center' }, input, h('button', { class: 'btn green', onclick: go }, '출발')),
      this.msg, this.sugg));
    this.input = input;
    setTimeout(() => input.focus(), 50);
  },

  showSuggest(list) {
    this.sugg.innerHTML = '';
    shuffle(list).slice(0, 6).forEach(p => this.sugg.append(h('button', {
      class: 'btn small blue', onclick: () => { this.input.value = p.name; this.depart(p.name); },
    }, p.name)));
  },

  depart(text) {
    if (this.phase !== 'ask') return;
    const r = taxiFind(text);
    if (!r.place) { this.msg.textContent = r.error; this.showSuggest(r.suggest); return; }
    const d = State.data;
    if (d.coins < TAXI_FEE) { this.msg.textContent = `😢 택시비 ${TAXI_FEE}코인이 부족해요. 아르바이트로 모아 봐요!`; return; }
    d.coins -= TAXI_FEE;
    State.save();
    this.dest = r.place;
    this.phase = 'drive';
    this.t = 0;
    this.crashAt = Math.random() < ACCIDENT_CHANCE ? TIME.drive * (0.4 + Math.random() * 0.3) : null;
    this.render();
    Game.ui.append(h('div', { class: 'help', style: 'font-size:18px' }, `🚖 ${this.dest.name}(으)로 가는 중…`));
  },

  arrive() {
    const p = this.dest;
    this.phase = 'done';
    toast(`🚖 ${p.name}에 도착했어요!`, 2500);
    if (p.home) return Game.go('home');
    State.data.town = p.town;
    State.data.x = p.x;
    State.save();
    Game.go('town', { x: p.x });
  },

  update(dt) {
    this.t += dt;
    if (this.phase === 'drive') {
      this.speed = Math.min(420, this.speed + dt * 300);
      this.scroll += this.speed * dt;
      if (this.crashAt != null && this.t >= this.crashAt) {
        this.phase = 'crash';
        this.t = 0;
        setTimeout(() => { Sound.play('crash', 1); Sound.play('glass', 0.8); }, 500);
        Game.ui.innerHTML = '';
      } else if (this.t >= TIME.drive) this.arrive();
    } else if (this.phase === 'crash') {
      this.speed = Math.max(0, this.speed - dt * 900);
      this.scroll += this.speed * dt;
      if (this.t >= 2.2) { this.phase = 'ambulance'; this.t = 0; Sound.play('siren', 0.8); }
    } else if (this.phase === 'ambulance') {
      if (this.t >= 3.5) { this.phase = 'done'; Game.go('ward'); }
    }
  },

  // ---------- 그리기 ----------
  draw(ctx) {
    if (this.phase === 'ambulance') return this.drawAmbulance(ctx);
    ctx.save();
    if (this.phase === 'crash' && this.t > 0.5 && this.t < 1.3) ctx.translate((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30);
    this.drawWindow(ctx);
    this.drawInterior(ctx);
    ctx.restore();
    if (this.phase === 'crash') {
      const t = this.t;
      if (t < 0.5) text(ctx, '끼이익~!!', 480, 200, 64, '#ffeb3b');
      if (t >= 0.5 && t < 1.4) {
        ctx.fillStyle = `rgba(255,0,0,${0.5 * (1 - (t - 0.5) / 0.9)})`; ctx.fillRect(0, 0, W, H);
        ctx.save(); ctx.translate(480, 260); ctx.rotate(-0.1); ctx.scale(1 + (t - 0.5), 1 + (t - 0.5));
        text(ctx, '쾅!', 0, 0, 110, '#fff'); ctx.restore();
      }
      if (t >= 1.2) { ctx.fillStyle = `rgba(0,0,0,${Math.min(1, (t - 1.2) / 0.9)})`; ctx.fillRect(0, 0, W, H); }
    }
  },

  drawWindow(ctx) {
    const night = State.isNight(), wx = todayWeather();
    const gloomy = wx === 'rain' || wx === 'cloud' || wx === 'snow';
    const s = this.scroll;
    ctx.save();
    ctx.beginPath(); rr(ctx, 60, 70, 840, 320, 40); ctx.clip();
    const g = ctx.createLinearGradient(0, 70, 0, 300);
    g.addColorStop(0, night ? '#070b2a' : gloomy ? '#8a9bb0' : '#6ec6ff');
    g.addColorStop(1, night ? '#2b2f63' : gloomy ? '#d5dde6' : '#e3f6ff');
    ctx.fillStyle = g; ctx.fillRect(0, 70, W, 320);
    if (night) { ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(780, 120, 22, 0, 7); ctx.fill(); }
    else if (!gloomy) { ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(780, 120, 26, 0, 7); ctx.fill(); }
    // 먼 산 (천천히)
    ctx.fillStyle = night ? '#1a2a3a' : '#9ccc9c';
    for (let i = -1; i < 6; i++) {
      const x = i * 260 - (s * 0.1) % 260;
      ctx.beginPath(); ctx.moveTo(x, 280); ctx.lineTo(x + 130, 170 + (i % 2) * 30); ctx.lineTo(x + 260, 280); ctx.fill();
    }
    // 건물 (중간)
    for (let i = -1; i < 9; i++) {
      const k = i + Math.floor(s * 0.4 / 130), x = k * 130 - s * 0.4, hh = 60 + ((k * 37) % 5) * 22;
      ctx.fillStyle = night ? '#25284a' : ['#f4c27a', '#a3d9a5', '#8fb3e0', '#f7a1c4', '#c3a6e8'][((k % 5) + 5) % 5];
      ctx.fillRect(x, 300 - hh, 100, hh);
      ctx.fillStyle = night ? '#ffe9a0' : '#e3f6ff';
      for (let r = 0; r < hh / 30 - 1; r++) { ctx.fillRect(x + 14, 310 - hh + r * 28, 22, 14); ctx.fillRect(x + 62, 310 - hh + r * 28, 22, 14); }
    }
    // 길
    ctx.fillStyle = '#555'; ctx.fillRect(0, 330, W, 70);
    ctx.fillStyle = '#9e978b'; ctx.fillRect(0, 300, W, 30);
    ctx.fillStyle = '#fff';
    for (let x = -(s % 140); x < W; x += 140) ctx.fillRect(x, 360, 70, 6);
    // 가까운 나무 + 표지판 (빠르게)
    for (let i = -1; i < 6; i++) {
      const k = i + Math.floor(s * 1.2 / 220), x = k * 220 - s * 1.2;
      if (k % 4 === 0 && this.dest) {
        const left = Math.max(0, Math.round((1 - this.t / TIME.drive) * 900 / 50) * 50);
        ctx.fillStyle = '#555'; ctx.fillRect(x + 60, 230, 6, 80);
        ctx.fillStyle = '#2e7d32'; rr(ctx, x - 10, 200, 150, 44, 6); ctx.fill();
        text(ctx, `${this.dest.name}까지 ${left}m`, x + 65, 222, 14, '#fff');
      } else {
        ctx.fillStyle = '#6d4c41'; ctx.fillRect(x + 56, 270, 10, 40);
        ctx.fillStyle = night ? '#1e3a1e' : (wx === 'snow' ? '#e8f0f0' : '#388e3c');
        ctx.beginPath(); ctx.arc(x + 61, 255, 30, 0, 7); ctx.fill();
      }
    }
    // 날씨 (창문 위 빗방울/눈)
    const t = this.t + this.scroll / 100;
    if (wx === 'rain') {
      ctx.strokeStyle = 'rgba(200,220,255,.8)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 90; i++) {
        const x = (i * 97 + t * 200) % W, y = 70 + (i * 53 + t * 500) % 320;
        ctx.moveTo(x, y); ctx.lineTo(x - 12, y + 10);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(220,235,255,.7)';
      for (let i = 0; i < 25; i++) { ctx.beginPath(); ctx.arc((i * 151) % 840 + 60, 80 + (i * 89) % 300, 3, 0, 7); ctx.fill(); }
    } else if (wx === 'snow') {
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 70; i++) {
        ctx.beginPath(); ctx.arc((i * 97 + t * 160) % W, 70 + (i * 61 + t * 60) % 320, 2 + (i % 3), 0, 7); ctx.fill();
      }
    }
    // 와이퍼 (비/눈 오는 날)
    if (wx === 'rain' || wx === 'snow') {
      const a = -0.3 - Math.abs(Math.sin(this.t * 3)) * 1.6;
      ctx.strokeStyle = '#222'; ctx.lineWidth = 5;
      for (const bx of [330, 640]) {
        ctx.beginPath(); ctx.moveTo(bx, 388); ctx.lineTo(bx + Math.cos(a) * 230, 388 + Math.sin(a) * 230); ctx.stroke();
      }
    }
    ctx.restore();
  },

  drawInterior(ctx) {
    // 창문 틀
    ctx.fillStyle = '#2b2b30';
    ctx.beginPath(); ctx.rect(0, 0, W, H);
    { const x = 60, y = 70, w = 840, hh = 320, r = 40;
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + hh, r); ctx.arcTo(x + w, y + hh, x, y + hh, r);
      ctx.arcTo(x, y + hh, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    ctx.fill('evenodd');
    ctx.fillStyle = '#3a3a42'; ctx.fillRect(0, 62, W, 8);
    // 백미러 (캐릭터 얼굴이 보여요)
    ctx.fillStyle = '#111'; ctx.fillRect(476, 62, 8, 22);
    ctx.fillStyle = '#222'; rr(ctx, 400, 80, 160, 52, 14); ctx.fill();
    ctx.fillStyle = '#9fb7c9'; rr(ctx, 406, 86, 148, 40, 10); ctx.fill();
    ctx.save(); rr(ctx, 406, 86, 148, 40, 10); ctx.clip();
    ctx.translate(480, 116); ctx.scale(0.75, 0.75);
    drawHead(ctx, currentLook().hair, { sad: this.phase === 'crash' });
    ctx.restore();
    // 계기판
    ctx.fillStyle = '#1e1e24';
    ctx.beginPath(); ctx.moveTo(0, 410); ctx.quadraticCurveTo(480, 360, W, 410); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.fillStyle = '#2c2c34'; rr(ctx, 540, 430, 260, 70, 12); ctx.fill();
    text(ctx, this.dest ? `🧭 ${this.dest.name}` : '🧭 목적지 입력 중', 670, 452, 15, '#8fe3a0');
    text(ctx, `🚖 요금 ${TAXI_FEE}코인`, 670, 480, 14, '#ffd54f');
    // 속도계
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(420, 470, 42, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(420, 470, 34, Math.PI * 0.8, Math.PI * 2.2); ctx.stroke();
    const sa = Math.PI * 0.8 + (this.speed / 420) * Math.PI * 1.4;
    ctx.strokeStyle = '#ff5252'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(420, 470); ctx.lineTo(420 + Math.cos(sa) * 30, 470 + Math.sin(sa) * 30); ctx.stroke();
    text(ctx, `${Math.round(this.speed / 7)}km`, 420, 494, 11, '#ddd');
    // 기사님 (뒷모습) + 핸들
    ctx.fillStyle = '#5d4037'; ctx.beginPath(); ctx.arc(200, 470, 54, 0, 7); ctx.fill();
    ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.arc(200, 450, 56, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillRect(140, 446, 120, 8);
    ctx.fillStyle = '#ffd400'; ctx.fillRect(176, 418, 48, 12);
    ctx.fillStyle = '#37474f'; rr(ctx, 120, 520, 160, 90, 40); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.ellipse(310, 540, 80, 40, -0.2, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    // 앞좌석 등받이 그림자
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 560, W, 40);
  },

  drawAmbulance(ctx) {
    const t = this.t;
    ctx.fillStyle = '#0b0f2a'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#4f4f57'; ctx.fillRect(0, 380, W, 220);
    ctx.fillStyle = '#f4f4f4';
    for (let x = -((t * 600) % 120); x < W; x += 120) ctx.fillRect(x, 470, 60, 6);
    // 구급차
    const x = -340 + t * 380, y = 430;
    const flash = Math.floor(t * 8) % 2;
    const rg = ctx.createRadialGradient(x + 150, y - 130, 5, x + 150, y - 130, 160);
    rg.addColorStop(0, flash ? 'rgba(255,40,40,.6)' : 'rgba(40,120,255,.6)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(x - 60, y - 300, 420, 340);
    ctx.fillStyle = '#fff'; rr(ctx, x, y - 120, 230, 110, 10); ctx.fill();
    rr(ctx, x + 220, y - 80, 80, 70, 12); ctx.fill();
    ctx.fillStyle = '#bfe6ff'; rr(ctx, x + 245, y - 72, 45, 30, 6); ctx.fill();
    ctx.fillStyle = '#e53935'; ctx.fillRect(x, y - 50, 300, 12);
    ctx.fillRect(x + 95, y - 105, 16, 46); ctx.fillRect(x + 80, y - 90, 46, 16);
    ctx.fillStyle = flash ? '#ff1744' : '#2979ff'; rr(ctx, x + 100, y - 136, 40, 16, 4); ctx.fill();
    ctx.fillStyle = flash ? '#2979ff' : '#ff1744'; rr(ctx, x + 145, y - 136, 40, 16, 4); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(x + 60, y, 24, 0, 7); ctx.arc(x + 240, y, 24, 0, 7); ctx.fill();
    ctx.fillStyle = '#aaa'; ctx.beginPath(); ctx.arc(x + 60, y, 9, 0, 7); ctx.arc(x + 240, y, 9, 0, 7); ctx.fill();
    text(ctx, '119', x + 170, y - 80, 22, '#e53935');
    text(ctx, '삐뽀삐뽀~ 🚨', 480 + Math.sin(t * 10) * 6, 120, 52, flash ? '#ff5252' : '#64b5f6');
    text(ctx, '구급차가 달려와요!', 480, 190, 26, '#fff');
    if (t > 2.6) { ctx.fillStyle = `rgba(0,0,0,${Math.min(1, (t - 2.6) / 0.8)})`; ctx.fillRect(0, 0, W, H); }
  },
};
