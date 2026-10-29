// 병원(24시): 의사 선생님 진찰 → 주사/약으로 치료. 골절은 엑스레이 찍고 깁스, 3일 뒤 깁스 풀기.

const DOCTOR_LOOK = { hair: 'mom_bun', top: 'doctor_coat', bottom: 'black_pants', shoes: 'slippers', hat: 'none' };
const LIMB_BOX = { x: 180, y: 250, w: 600, h: 110 };   // 깁스 감을 때 크게 보이는 팔/다리

Game.scenes.clinic = {
  enter() {
    this.t = 0;
    this.phase = 'desk';
    this.prog = 0;
    this.flash = 0;
    this.rub = null;
    this.desk();
  },

  bar(title, canLeave = true) {
    return h('div', { class: 'topbar' },
      canLeave ? h('button', { class: 'btn small gray', onclick: () => Game.go('town') }, '🚪 나가기') : null,
      h('span', {}, title),
      h('div', { class: 'spacer' }),
      h('div', { class: 'pill' }, `💰 ${State.data.coins}`));
  },

  // ---------- 접수 · 진찰 ----------
  desk() {
    const d = State.data, def = Illness.def();
    this.phase = 'desk';
    Game.ui.innerHTML = '';
    Game.ui.append(this.bar('🏥 병원 24시 · 진료실'));
    const card = (...kids) => Game.ui.append(h('div', { class: 'card', style: 'position:absolute;right:30px;top:90px;width:470px' }, ...kids));
    if (def && def.fracture) {
      card(h('h2', {}, `${def.icon} ${def.name}`),
        h('p', {}, `👩‍⚕️ "${def.doctor}"`),
        h('p', { style: 'color:#d32f2f' }, `증상: ${def.symptom}`),
        h('p', {}, `엑스레이 + 깁스 치료비 💰 ${FRACTURE_FEE}코인`),
        h('div', { class: 'row' }, h('button', { class: 'btn green', onclick: () => this.pay(FRACTURE_FEE, () => this.startXray()) }, '📸 엑스레이 찍기')));
    } else if (def) {
      card(h('h2', {}, `${def.icon} ${def.name}`),
        h('p', {}, `👩‍⚕️ "${def.doctor}"`),
        h('p', { style: 'color:#d32f2f' }, `증상: ${def.symptom}`),
        h('p', {}, `주사 맞고 약 먹으면 바로 나아요. 진료비 💰 ${DOCTOR_FEE}코인`),
        h('div', { class: 'row' }, h('button', { class: 'btn green', onclick: () => this.pay(DOCTOR_FEE, () => this.startShot()) }, '💉 치료받기')));
    } else if (d.cast) {
      const left = d.cast.until - d.day;
      card(h('h2', {}, '🦴 깁스 검사'),
        left <= 0
          ? [h('p', {}, '👩‍⚕️ "뼈가 다 붙었어요! 이제 깁스를 풀어요."'),
            h('div', { class: 'row' }, h('button', { class: 'btn green', onclick: () => this.startSaw() }, '✂️ 깁스 풀기'))]
          : h('p', {}, `👩‍⚕️ "아직 뼈가 붙는 중이에요. ${left}일 뒤에 오면 깁스를 풀어 줄게요."`));
    } else {
      card(h('h2', {}, '👩‍⚕️ 튼튼하네요!'),
        h('p', {}, '어디 아픈 곳이 없어요. 아프면 언제든 오세요 😊'),
        h('p', { style: 'font-size:16px;color:#888' }, '손 잘 씻기, 상한 음식 안 먹기, 비 오는 날엔 우비 입기!'));
    }
  },

  pay(fee, next) {
    const d = State.data;
    if (d.coins < fee) return toast(`😢 코인이 부족해요 (💰 ${fee}코인 필요). 아르바이트로 모아 와요`);
    d.coins -= fee;
    State.save();
    next();
  },

  // ---------- 일반 병: 주사 ----------
  startShot() {
    this.phase = 'shot';
    this.t = 0;
    Game.ui.innerHTML = '';
    Game.ui.append(this.bar('💉 주사 맞는 중… 꾹 참아요!', false));
  },

  // ---------- 골절: 엑스레이 ----------
  startXray() {
    this.phase = 'xray';
    this.limb = Illness.def().fracture;
    Game.ui.innerHTML = '';
    Game.ui.append(this.bar('📸 엑스레이실 · 움직이지 말고 가만히!', false),
      h('div', { class: 'items-bar' }, h('button', { class: 'btn', onclick: () => this.snap() }, '📸 찰칵! 찍기')));
  },

  snap() {
    if (this.phase !== 'xray') return;
    Sound.play('camera', 1);
    this.flash = 1;
    this.phase = 'film';
    this.t = 0;
    Game.ui.innerHTML = '';
    Game.ui.append(this.bar('📸 엑스레이 사진', false),
      h('div', { class: 'items-bar' }, h('button', { class: 'btn green', onclick: () => this.startCast() }, '🩹 깁스하러 가기')));
  },

  // ---------- 골절: 깁스 감기 ----------
  startCast() {
    this.flash = 0;
    this.phase = 'cast';
    this.prog = 0;
    Game.ui.innerHTML = '';
    Game.ui.append(this.bar(`🩹 깁스실 · ${this.limb === 'arm' ? '팔' : '다리'} 위를 쓱쓱 문질러서 붕대를 감아요`, false));
  },

  finishCast() {
    const d = State.data, limb = this.limb;
    this.phase = 'done';
    d.cast = { limb, until: d.day + CAST_DAYS };
    Illness.cure();
    Sound.play('done', 0.9);
    modal(
      h('h2', {}, '🦴 깁스 완성!'),
      h('p', {}, `${limb === 'arm' ? '팔' : '다리'}에 하얀 깁스를 했어요. 이제 많이 안 아파요!`),
      limb === 'leg' ? h('p', {}, '🦯 목발도 받았어요. 천천히 걸어요') : h('p', {}, '삼각건으로 팔을 걸었어요'),
      h('p', { style: 'color:#d32f2f' }, `${CAST_DAYS}일 동안 축구·농구·발레 학원과 학교 놀이는 못 해요`),
      h('p', { style: 'font-size:16px;color:#888' }, `${CAST_DAYS}일 뒤 병원에 오면 깁스를 풀어 줘요`),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => Game.go('town') }, '병원에서 나가기')));
  },

  // ---------- 깁스 풀기 ----------
  startSaw() {
    this.phase = 'saw';
    this.limb = State.data.cast.limb;
    this.prog = 0;
    Game.ui.innerHTML = '';
    Game.ui.append(this.bar('✂️ 깁스 자르기 · 깁스 위를 쓱쓱 문질러요 (아프지 않아요!)', false));
  },

  finishSaw() {
    this.phase = 'done';
    State.data.cast = null;
    State.save();
    Sound.play('unlock', 0.9);
    modal(
      h('h2', {}, '🎉 깁스를 풀었어요!'),
      h('p', {}, '뼈가 튼튼하게 붙었어요. 이제 마음껏 운동해도 돼요!'),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => Game.go('town') }, '병원에서 나가기')));
  },

  // ---------- 문지르기 (깁스 감기 / 자르기) ----------
  onPointerDown(x, y) { if (this.phase === 'cast' || this.phase === 'saw') this.rub = { x, y }; },
  onPointerUp() { this.rub = null; },
  onPointerMove(x, y) {
    this.hand = { x, y };
    const r = this.rub;
    if (!r) return;
    const b = LIMB_BOX;
    if (x > b.x - 20 && x < b.x + b.w + 20 && y > b.y - 60 && y < b.y + b.h + 60) {
      this.prog = Math.min(1, this.prog + Math.hypot(x - r.x, y - r.y) / (FAST ? 500 : 1800));
      if (Math.random() < 0.06) Sound.play(this.phase === 'saw' ? 'cut' : 'cloth', 0.5);
      if (this.prog >= 1) {
        this.rub = null;
        if (this.phase === 'cast') { this.phase = 'setting'; this.t = 0; }
        else this.finishSaw();
      }
    }
    r.x = x; r.y = y;
  },

  update(dt) {
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt * 2);
    if (this.phase === 'shot' && this.t > 2.2) {
      this.phase = 'done';
      const def = Illness.def();
      Illness.cure();
      Sound.play('done', 0.9);
      modal(
        h('h2', {}, '💪 다 나았어요!'),
        h('p', {}, `주사 맞고 약 먹었더니 ${josa(def ? def.name : '병', '이', '가')} 싹 나았어요!`),
        h('p', { style: 'font-size:16px;color:#888' }, '👩‍⚕️ "손 잘 씻고, 푹 자고, 골고루 먹어요!"'),
        h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => Game.go('town') }, '병원에서 나가기')));
    }
    if (this.phase === 'setting' && this.t > (FAST ? 1 : 2.5)) this.finishCast();
  },

  // ---------- 그리기 ----------
  draw(ctx) {
    // 병원 벽 + 바닥
    ctx.fillStyle = '#e8f6f3'; ctx.fillRect(0, 0, W, 430);
    ctx.fillStyle = '#d0ebe5'; ctx.fillRect(0, 300, W, 8);
    ctx.fillStyle = '#cfd8dc'; ctx.fillRect(0, 430, W, 170);
    ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 2;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 430); ctx.lineTo(x, H); ctx.stroke(); }
    ctx.fillStyle = '#e53935'; ctx.fillRect(60, 90, 14, 46); ctx.fillRect(44, 106, 46, 14);
    const look = currentLook(), ho = Illness.look();
    const p = this.phase;

    if (p === 'desk' || p === 'shot' || p === 'done') {
      // 진료 책상, 의사 선생님, 환자(나)
      ctx.fillStyle = '#8d6e63'; rr(ctx, 120, 360, 300, 24, 6); ctx.fill();
      ctx.fillRect(140, 384, 14, 80); ctx.fillRect(386, 384, 14, 80);
      ctx.fillStyle = '#90a4ae'; rr(ctx, 300, 320, 60, 40, 4); ctx.fill();
      drawCharacter(ctx, DOCTOR_LOOK, 210, 470, 1.7, {});
      drawCharacter(ctx, look, 400, 500, 1.4, ho);
      if (p === 'shot') {
        const k = Math.min(1, this.t / 1);
        emoji(ctx, '💉', 460 - 40 * k, 380, 46);
        if (this.t > 1) { text(ctx, '따끔!', 470, 320, 34, '#e53935'); bubble(ctx, '조금만 참아요~', 210, 270, 18); }
      } else bubble(ctx, '어디가 아파서 왔어요?', 210, 270, 18);
      return;
    }

    if (p === 'xray') {
      // 촬영대에 누워 있기 + 기계
      ctx.fillStyle = '#b0bec5'; rr(ctx, 180, 400, 560, 30, 8); ctx.fill();
      ctx.fillRect(220, 430, 20, 60); ctx.fillRect(680, 430, 20, 60);
      drawCharacter(ctx, { ...look, top: 'gown' }, 270, 395, 1.5, { ...ho, rotate: -Math.PI / 2 });
      ctx.fillStyle = '#78909c'; ctx.fillRect(560, 90, 24, 170);
      ctx.fillStyle = '#546e7a'; rr(ctx, 470, 240, 200, 50, 10); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,150,.25)';
      ctx.beginPath(); ctx.moveTo(500, 290); ctx.lineTo(640, 290); ctx.lineTo(690, 400); ctx.lineTo(450, 400); ctx.fill();
      text(ctx, '☢ X-RAY', 570, 265, 18, '#fff');
    }

    if (p === 'film') this.drawFilm(ctx);
    if (p === 'cast' || p === 'setting' || p === 'saw') this.drawLimb(ctx);

    if (this.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${this.flash})`; ctx.fillRect(0, 0, W, H); }
  },

  // 엑스레이 사진: 뼈 + 금 간 곳이 빨갛게 반짝
  drawFilm(ctx) {
    const x = 200, y = 90, w = 560, hh = 380;
    ctx.fillStyle = '#eceff1'; rr(ctx, x - 14, y - 14, w + 28, hh + 28, 12); ctx.fill();
    ctx.fillStyle = '#0d1b2a'; ctx.fillRect(x, y, w, hh);
    ctx.strokeStyle = 'rgba(220,235,255,.9)'; ctx.lineCap = 'round';
    const bone = (x1, y1, x2, y2, wdt) => {
      ctx.lineWidth = wdt; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillStyle = 'rgba(220,235,255,.9)';
      for (const [cx, cy] of [[x1, y1], [x2, y2]]) { ctx.beginPath(); ctx.arc(cx, cy, wdt * 0.8, 0, 7); ctx.fill(); }
    };
    let crack;
    if (this.limb === 'arm') {
      bone(x + 60, y + 190, x + 260, y + 190, 22);            // 위팔뼈
      bone(x + 280, y + 175, x + 480, y + 165, 14);           // 아래팔뼈 2개
      bone(x + 280, y + 205, x + 480, y + 205, 12);
      for (let k = 0; k < 5; k++) bone(x + 495, y + 150 + k * 14, x + 530, y + 145 + k * 16, 6); // 손가락
      crack = [x + 380, y + 168];
    } else {
      bone(x + 50, y + 190, x + 270, y + 190, 26);            // 넓적다리뼈
      ctx.fillStyle = 'rgba(220,235,255,.9)'; ctx.beginPath(); ctx.arc(x + 285, y + 190, 16, 0, 7); ctx.fill(); // 무릎
      bone(x + 300, y + 182, x + 500, y + 182, 18);           // 정강이뼈
      bone(x + 300, y + 210, x + 500, y + 212, 9);
      crack = [x + 400, y + 182];
    }
    ctx.lineCap = 'butt';
    const on = Math.sin(this.t * 8) > 0;
    ctx.strokeStyle = on ? '#ff1744' : '#ff8a80'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(crack[0] - 6, crack[1] - 16); ctx.lineTo(crack[0] + 4, crack[1] - 5); ctx.lineTo(crack[0] - 4, crack[1] + 4); ctx.lineTo(crack[0] + 6, crack[1] + 16); ctx.stroke();
    ctx.strokeStyle = on ? 'rgba(255,23,68,.8)' : 'rgba(255,23,68,.3)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(crack[0], crack[1], 34, 0, 7); ctx.stroke();
    text(ctx, this.limb === 'arm' ? '팔뼈' : '다리뼈', x + 50, y + 30, 18, '#90caf9', 'left');
    bubble(ctx, '여기 뼈에 금이 갔네요! 깁스를 해요', crack[0], y + hh - 40, 18);
  },

  // 크게 보이는 팔/다리: 붕대 감기 → 굳히기 → (나중에) 자르기
  drawLimb(ctx) {
    const b = LIMB_BOX, p = this.phase;
    ctx.fillStyle = '#b0bec5'; rr(ctx, b.x - 40, b.y + b.h + 10, b.w + 80, 26, 8); ctx.fill();
    // 팔/다리
    ctx.fillStyle = SKIN; rr(ctx, b.x, b.y, b.w, b.h, 50); ctx.fill();
    if (this.limb === 'arm') {
      ctx.beginPath(); ctx.ellipse(b.x + b.w + 30, b.y + b.h / 2, 48, 40, 0, 0, 7); ctx.fill(); // 손
      for (let k = 0; k < 4; k++) { rr(ctx, b.x + b.w + 60, b.y + 18 + k * 20, 40, 15, 7); ctx.fill(); }
    } else {
      rr(ctx, b.x + b.w - 30, b.y - 70, 90, b.h + 70, 30); ctx.fill();                          // 발
    }
    if (p === 'cast' || p === 'setting') {
      const wraps = p === 'setting' ? 16 : Math.floor(this.prog * 16);
      ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 2;
      for (let k = 0; k < wraps; k++) {
        const x = b.x + 40 + k * ((b.w - 80) / 16);
        ctx.beginPath(); ctx.moveTo(x, b.y - 6); ctx.lineTo(x + 50, b.y - 6); ctx.lineTo(x + 30, b.y + b.h + 6); ctx.lineTo(x - 20, b.y + b.h + 6); ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
      if (p === 'cast') {
        const hp = this.hand || { x: b.x + 60, y: b.y + b.h / 2 };
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(hp.x, hp.y, 26, 34, 0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(hp.x, hp.y, 8, 12, 0, 0, 7); ctx.stroke();
        text(ctx, `붕대 ${Math.round(this.prog * 100)}%`, 480, 160, 26, '#37474f');
      } else {
        text(ctx, '깁스가 단단하게 굳는 중…', 480, 160, 26, '#37474f');
        ctx.fillStyle = '#cfd8dc'; rr(ctx, 330, 190, 300, 18, 9); ctx.fill();
        ctx.fillStyle = '#4caf50'; rr(ctx, 330, 190, 300 * Math.min(1, this.t / (FAST ? 1 : 2.5)), 18, 9); ctx.fill();
      }
    } else if (p === 'saw') {
      // 하얀 깁스를 잘라 내요
      ctx.fillStyle = '#fafafa'; rr(ctx, b.x + 30, b.y - 8, b.w - 60, b.h + 16, 30); ctx.fill();
      ctx.strokeStyle = '#ef5350'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(b.x + 40, b.y + b.h / 2); ctx.lineTo(b.x + 40 + (b.w - 80) * this.prog, b.y + b.h / 2); ctx.stroke();
      ctx.setLineDash([]);
      const hp = this.hand || { x: b.x + 60, y: b.y + b.h / 2 };
      emoji(ctx, '✂️', hp.x, hp.y - 10, 52);
      text(ctx, `깁스 자르기 ${Math.round(this.prog * 100)}%`, 480, 160, 26, '#37474f');
    }
  },
};
