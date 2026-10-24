// 캐릭터(옷 갈아입기 가능) + 고양이 그리기
// 캐릭터는 발 위치가 x, y / 크기 s=1 이면 키 약 108px. 머리가 크고 몸은 작아서 귀여워요.
// 팔·다리는 관절(어깨-팔꿈치-손, 엉덩이-무릎-발목)로 이어진 둥근 선이라 자연스럽게 움직여요.

const CHARACTERS = [
  { id: 'boy_suit', label: '파란 넥타이 + 검은 정복\n남자아이' },
  { id: 'boy_overalls', label: '멜빵바지\n남자아이' },
  { id: 'girl_uniform', label: '교복\n여자아이' },
  { id: 'girl_tshirt', label: '티셔츠\n여자아이' },
];

// 처음 고른 캐릭터의 머리 모양 + 기본 옷
const CHAR_LOOKS = {
  boy_suit: { hair: 'boy_dark', top: 'suit', bottom: 'black_pants', shoes: 'black_shoes', hat: 'none' },
  boy_overalls: { hair: 'boy_brown', top: 'stripe', bottom: 'overalls', shoes: 'brown_shoes', hat: 'none' },
  girl_uniform: { hair: 'girl_long', top: 'uniform', bottom: 'plaid_skirt', shoes: 'loafers', hat: 'none' },
  girl_tshirt: { hair: 'girl_pony', top: 'pink_tee', bottom: 'jeans', shoes: 'pink_shoes', hat: 'none' },
};

// 옷 목록 (옷장에서 고를 수 있음)
const CLOTHES = {
  top: {
    suit: { name: '검은 정복', icon: '🤵', color: '#1f1f2e', long: true },
    stripe: { name: '줄무늬 티', icon: '👕', color: '#ff8a3d' },
    uniform: { name: '교복', icon: '🏫', color: '#24305e', long: true },
    pink_tee: { name: '분홍 티셔츠', icon: '💗', color: '#ff6fa8' },
    blue_tee: { name: '파란 티셔츠', icon: '👕', color: '#4a90e2' },
    hoodie: { name: '노란 후드티', icon: '🟡', color: '#ffc93c', long: true },
    raincoat: { name: '노란 우비', icon: '🧥', color: '#ffd400', long: true },
    dress: { name: '빨간 원피스', icon: '👗', color: '#e53950' },
    gown: { name: '환자복', icon: '🏥', color: '#9fd3ee', long: true, hidden: true },
    apron: { name: '앞치마', icon: '', color: '#f48fb1', long: true, hidden: true },
  },
  bottom: {
    black_pants: { name: '검은 바지', icon: '👖', color: '#1d1d27' },
    overalls: { name: '멜빵바지', icon: '👖', color: '#3b6fb6' },
    plaid_skirt: { name: '체크 치마', icon: '👗', color: '#6b6f80' },
    jeans: { name: '청바지', icon: '👖', color: '#4a6fa5' },
    shorts: { name: '반바지', icon: '🩳', color: '#2e7dd1' },
    long_skirt: { name: '긴 치마', icon: '', color: '#7e57c2', hidden: true },
  },
  shoes: {
    black_shoes: { name: '검은 구두', icon: '👞', color: '#2a1a10' },
    brown_shoes: { name: '갈색 신발', icon: '👞', color: '#6d4220' },
    loafers: { name: '교복 구두', icon: '👞', color: '#7a2e2e' },
    pink_shoes: { name: '분홍 신발', icon: '👟', color: '#ff5e8a' },
    sneakers: { name: '운동화', icon: '👟', color: '#ffffff' },
    rain_boots: { name: '장화', icon: '👢', color: '#ffd400' },
    slippers: { name: '슬리퍼', icon: '🥿', color: '#4fc3f7' },
  },
  hat: {
    none: { name: '안 쓰기', icon: '🚫' },
    cap: { name: '빨간 모자', icon: '🧢', color: '#e53935' },
    ribbon: { name: '리본 핀', icon: '🎀', color: '#ff7ab6' },
    beanie: { name: '털모자', icon: '🧶', color: '#43a047' },
  },
};

// 가게에서 산 물건 → 옷장 옷
const SHOP_CLOTHES = { 티셔츠: ['top', 'blue_tee'], 원피스: ['top', 'dress'], 모자: ['hat', 'cap'], 운동화: ['shoes', 'sneakers'], 장화: ['shoes', 'rain_boots'], 슬리퍼: ['shoes', 'slippers'], 구두: ['shoes', 'black_shoes'] };

const SKIN = '#ffd9b8';
const HEAD_Y = -80;   // 머리 중심 높이 (발 기준)
const HEAD_R = 25;
const MOM_LOOK = { hair: 'mom_bun', top: 'apron', bottom: 'long_skirt', shoes: 'slippers', hat: 'none' };

function currentLook() {
  const d = State.data;
  return d.look || CHAR_LOOKS[d.character] || CHAR_LOOKS.boy_suit;
}

// 두 마디로 된 팔/다리 그리기: 시작점에서 각도 a1로 길이 l1, 다시 각도 a2로 길이 l2 (각도는 아래 방향이 0)
function limb(ctx, x, y, a1, l1, a2, l2, w, c1, c2, split) {
  const kx = x + Math.sin(a1) * l1, ky = y + Math.cos(a1) * l1;
  const ex = kx + Math.sin(a2) * l2, ey = ky + Math.cos(a2) * l2;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = w;
  ctx.strokeStyle = c2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(kx, ky); ctx.lineTo(ex, ey); ctx.stroke();
  if (c1 && split > 0) {   // 옷 부분(소매/바짓단)
    ctx.strokeStyle = c1;
    ctx.beginPath(); ctx.moveTo(x, y);
    if (split <= 1) ctx.lineTo(x + (kx - x) * split, y + (ky - y) * split);
    else { ctx.lineTo(kx, ky); ctx.lineTo(kx + (ex - kx) * (split - 1), ky + (ey - ky) * (split - 1)); }
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  return { kx, ky, ex, ey };
}

// o: { walk, dir, rotate, mouthOpen, sad, faint, sick, armUp(0~1: 오른팔 들기), handprint }
function drawCharacter(ctx, look, x, y, s = 1, o = {}) {
  if (typeof look === 'string') look = CHAR_LOOKS[look] || CHAR_LOOKS.boy_suit;
  const top = CLOTHES.top[look.top] || CLOTHES.top.pink_tee;
  const bot = CLOTHES.bottom[look.bottom] || CLOTHES.bottom.jeans;
  const shoe = CLOTHES.shoes[look.shoes] || CLOTHES.shoes.sneakers;
  const sw = Math.sin(o.walk || 0);
  const adult = look.hair === 'mom_bun';
  ctx.save();
  ctx.translate(x, y);
  if (o.rotate) ctx.rotate(o.rotate);
  ctx.scale((o.dir < 0 ? -1 : 1) * s, s);

  if (!o.rotate) {
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.ellipse(0, 0, 20, 5, 0, 0, Math.PI * 2); ctx.fill();
  }

  const skirtTop = look.top === 'dress' || look.bottom === 'plaid_skirt' || look.bottom === 'long_skirt';
  // ---- 다리 (엉덩이 -36 → 무릎 → 발목) ----
  const legColor = skirtTop || look.bottom === 'shorts' ? SKIN : bot.color;
  const legSplit = look.bottom === 'shorts' ? 0.7 : look.bottom === 'long_skirt' ? 1.9 : 0;
  for (const [hx, ph] of [[-6, sw], [6, -sw]]) {
    const a1 = ph * 0.45, bend = Math.max(0, -ph) * 0.9;
    const j = limb(ctx, hx, -36, a1, 16, a1 - bend, 15, 10, bot.color, legColor, legSplit);
    if (look.bottom === 'plaid_skirt') {   // 흰 양말
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo((j.kx + j.ex) / 2, (j.ky + j.ey) / 2); ctx.lineTo(j.ex, j.ey); ctx.stroke();
      ctx.lineCap = 'butt';
    }
    // 신발
    ctx.fillStyle = shoe.color;
    if (look.shoes === 'rain_boots') {
      rr(ctx, j.ex - 6, j.ey - 9, 12, 13, 3); ctx.fill();
      ctx.beginPath(); ctx.ellipse(j.ex + 2, j.ey + 3, 8, 4, 0, 0, 7); ctx.fill();
    } else if (look.shoes === 'slippers') {
      ctx.beginPath(); ctx.ellipse(j.ex + 2, j.ey + 4, 8, 3, 0, 0, 7); ctx.fill();
      ctx.fillStyle = SKIN; ctx.beginPath(); ctx.ellipse(j.ex + 2, j.ey + 1, 5, 3, 0, 0, 7); ctx.fill();
      ctx.fillStyle = shoe.color; ctx.fillRect(j.ex - 2, j.ey - 1, 8, 3);
    } else {
      ctx.beginPath(); ctx.ellipse(j.ex + 2, j.ey + 2, 8, 5, 0, 0, 7); ctx.fill();
      if (look.shoes === 'sneakers') {
        ctx.strokeStyle = '#e53935'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(j.ex + 2, j.ey + 2, 8, 5, 0, 0, 7); ctx.stroke();
      }
    }
  }
  // 엉덩이(바지 윗부분)
  if (!skirtTop) { ctx.fillStyle = bot.color; rr(ctx, -12, -42, 24, 10, 4); ctx.fill(); }

  // ---- 팔 (몸 뒤에 살짝) ----
  const sleeve = top.color;
  const arms = [[-12, -sw, 0], [12, sw, o.armUp || 0]];
  const drawArm = ([sx, ph, up]) => {
    const side = sx < 0 ? -1 : 1;
    const a1 = side * 0.25 + ph * 0.45 + side * up * 2.6;
    const a2 = a1 - side * 0.25 + side * up * 0.3;
    const j = limb(ctx, sx, -53, a1, 11, a2, 11, 8, sleeve, SKIN, top.long ? 1.75 : 0.75);
    ctx.fillStyle = SKIN;
    ctx.beginPath(); ctx.arc(j.ex, j.ey, 4.6, 0, 7); ctx.fill();
  };

  // ---- 몸통 ----
  const torso = (bottomY = -36, flare = 0) => {
    ctx.beginPath();
    ctx.moveTo(-12 - flare, bottomY);
    ctx.lineTo(-13, -50); ctx.quadraticCurveTo(-14, -58, -6, -58);
    ctx.lineTo(6, -58); ctx.quadraticCurveTo(14, -58, 13, -50);
    ctx.lineTo(12 + flare, bottomY); ctx.closePath();
  };
  // 치마/원피스 아래 부분
  if (look.top === 'dress') {
    ctx.fillStyle = top.color;
    ctx.beginPath(); ctx.moveTo(-12, -42); ctx.lineTo(12, -42); ctx.lineTo(20, -22); ctx.lineTo(-20, -22); ctx.fill();
  } else if (look.bottom === 'plaid_skirt') {
    ctx.fillStyle = bot.color;
    ctx.beginPath(); ctx.moveTo(-12, -42); ctx.lineTo(12, -42); ctx.lineTo(19, -25); ctx.lineTo(-19, -25); ctx.fill();
    ctx.strokeStyle = '#4a4d5c'; ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = -12; i <= 12; i += 6) { ctx.moveTo(i, -42); ctx.lineTo(i * 1.55, -25); }
    ctx.moveTo(-16, -33); ctx.lineTo(16, -33); ctx.stroke();
  } else if (look.bottom === 'long_skirt') {
    ctx.fillStyle = bot.color;
    ctx.beginPath(); ctx.moveTo(-12, -42); ctx.lineTo(12, -42); ctx.lineTo(20, -6); ctx.lineTo(-20, -6); ctx.fill();
  }
  drawArm(arms[0]);
  if (look.top === 'raincoat') { ctx.fillStyle = top.color; torso(-24, 5); ctx.fill(); }
  else { ctx.fillStyle = top.color; torso(look.top === 'dress' ? -40 : -37); ctx.fill(); }
  ctx.save(); torso(-24, 5); ctx.clip();
  switch (look.top) {
    case 'suit':
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-6, -58); ctx.lineTo(6, -58); ctx.lineTo(0, -46); ctx.fill();
      ctx.fillStyle = '#2f6bff'; ctx.beginPath(); ctx.moveTo(0, -56); ctx.lineTo(-3, -52); ctx.lineTo(0, -40); ctx.lineTo(3, -52); ctx.fill();
      ctx.fillStyle = '#d4af37'; ctx.beginPath(); ctx.arc(-7, -42, 1.5, 0, 7); ctx.arc(7, -42, 1.5, 0, 7); ctx.fill();
      break;
    case 'stripe':
      ctx.fillStyle = '#ffd36b'; for (let yy = -54; yy < -36; yy += 7) ctx.fillRect(-15, yy, 30, 3);
      break;
    case 'uniform':
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-7, -58); ctx.lineTo(7, -58); ctx.lineTo(0, -48); ctx.fill();
      ctx.fillStyle = '#e8313a';
      ctx.beginPath(); ctx.moveTo(0, -53); ctx.lineTo(-7, -57); ctx.lineTo(-7, -49); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -53); ctx.lineTo(7, -57); ctx.lineTo(7, -49); ctx.fill();
      break;
    case 'pink_tee': text(ctx, '♥', 0, -46, 13, '#fff'); break;
    case 'blue_tee': text(ctx, '★', 0, -46, 13, '#fff'); break;
    case 'hoodie':
      ctx.fillStyle = 'rgba(0,0,0,.12)'; rr(ctx, -8, -45, 16, 7, 3); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-3, -57); ctx.lineTo(-3, -50); ctx.moveTo(3, -57); ctx.lineTo(3, -50); ctx.stroke();
      break;
    case 'raincoat':
      ctx.fillStyle = '#e6a800';
      for (const yy of [-52, -44, -36, -29]) { ctx.beginPath(); ctx.arc(0, yy, 1.6, 0, 7); ctx.fill(); }
      break;
    case 'dress':
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-7, -58); ctx.lineTo(7, -58); ctx.lineTo(0, -51); ctx.fill();
      break;
    case 'gown':
      ctx.fillStyle = '#7cbfe0'; for (let xx = -12; xx < 14; xx += 6) ctx.fillRect(xx, -60, 2, 30);
      break;
    case 'apron':
      ctx.fillStyle = '#fff'; rr(ctx, -9, -52, 18, 30, 4); ctx.fill();
      ctx.fillStyle = '#ffcdd2'; rr(ctx, -5, -42, 10, 6, 2); ctx.fill();
      break;
  }
  ctx.restore();
  if (look.bottom === 'overalls' && look.top !== 'dress' && look.top !== 'raincoat') {
    ctx.fillStyle = bot.color; rr(ctx, -9, -50, 18, 14, 3); ctx.fill();
    ctx.strokeStyle = bot.color; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(-7, -50); ctx.lineTo(-10, -58); ctx.moveTo(7, -50); ctx.lineTo(10, -58); ctx.stroke();
    ctx.fillStyle = '#ffe14d'; ctx.beginPath(); ctx.arc(-6, -48, 2, 0, 7); ctx.arc(6, -48, 2, 0, 7); ctx.fill();
  }
  if (o.handprint) {
    ctx.fillStyle = 'rgba(230,40,40,.75)';
    ctx.beginPath(); ctx.ellipse(-5, -47, 5, 6, 0.2, 0, 7); ctx.fill();
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(-9 + k * 3, -55, 1.4, 3.5, 0, 0, 7); ctx.fill(); }
  }
  drawArm(arms[1]);

  // ---- 머리 ----
  if (look.top === 'hoodie' || look.top === 'raincoat') {
    ctx.fillStyle = shade(top.color, -15);
    ctx.beginPath(); ctx.ellipse(0, -60, 16, 7, 0, 0, 7); ctx.fill();
  }
  ctx.translate(0, adult ? HEAD_Y - 2 : HEAD_Y);
  drawHead(ctx, look.hair, o);
  drawHat(ctx, look.hat);
  ctx.restore();
}

function drawHat(ctx, hat) {
  const R = HEAD_R;
  if (!hat || hat === 'none') return;
  const c = CLOTHES.hat[hat].color;
  ctx.fillStyle = c;
  if (hat === 'cap') {
    ctx.beginPath(); ctx.arc(0, -8, R + 1, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
    ctx.beginPath(); ctx.ellipse(12, -10, 16, 4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -R - 6, 3, 0, 7); ctx.fill();
  } else if (hat === 'ribbon') {
    ctx.beginPath(); ctx.moveTo(-12, -22); ctx.lineTo(-24, -30); ctx.lineTo(-22, -14); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-12, -22); ctx.lineTo(0, -32); ctx.lineTo(-2, -14); ctx.fill();
    ctx.fillStyle = '#e0447f'; ctx.beginPath(); ctx.arc(-12, -22, 3.5, 0, 7); ctx.fill();
  } else if (hat === 'beanie') {
    ctx.beginPath(); ctx.arc(0, -6, R + 2, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shade(c, -30); ctx.fillRect(-R - 2, -10, 2 * R + 4, 7);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -R - 8, 5, 0, 7); ctx.fill();
  }
}

const HAIR = {
  boy_dark: '#2b1d14', boy_brown: '#6b3e1f', girl_long: '#161212', girl_pony: '#8a4b23', mom_bun: '#5d3a1a',
  // 예전 저장/호출과 호환
  boy_suit: '#2b1d14', boy_overalls: '#6b3e1f', girl_uniform: '#161212', girl_tshirt: '#8a4b23',
};
const HAIR_ALIAS = { boy_suit: 'boy_dark', boy_overalls: 'boy_brown', girl_uniform: 'girl_long', girl_tshirt: 'girl_pony' };

// 머리를 (0,0) 중심으로 그림 (반지름 25)
function drawHead(ctx, hairId, o = {}) {
  hairId = HAIR_ALIAS[hairId] || hairId;
  const R = 21, hair = HAIR[hairId] || '#2b1d14';
  ctx.save();
  ctx.scale(HEAD_R / 21, HEAD_R / 21);
  ctx.fillStyle = hair;
  if (hairId === 'girl_long') { rr(ctx, -25, -18, 50, 50, 18); ctx.fill(); }
  if (hairId === 'girl_pony') {
    ctx.beginPath(); ctx.ellipse(-27, -2, 9, 16, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff5e8a';
    ctx.beginPath(); ctx.arc(-21, -10, 4, 0, 7); ctx.fill();
  }
  if (hairId === 'mom_bun') { ctx.beginPath(); ctx.arc(0, -24, 10, 0, 7); ctx.fill(); }
  // 귀 + 얼굴
  ctx.fillStyle = SKIN;
  ctx.beginPath(); ctx.ellipse(-R, 3, 4, 5.5, 0, 0, 7); ctx.ellipse(R, 3, 4, 5.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = o.sick ? '#ffe3d6' : SKIN;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
  // 머리카락 + 동글동글 앞머리
  ctx.fillStyle = hair;
  ctx.beginPath(); ctx.arc(0, -1, R + 2, Math.PI, Math.PI * 2); ctx.fill();
  if (hairId === 'mom_bun') {
    ctx.beginPath(); ctx.moveTo(-R - 2, -1); ctx.quadraticCurveTo(-4, -2, 2, -16); ctx.quadraticCurveTo(6, -4, R + 2, -1); ctx.fill();
  } else {
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * 8.5, -7, 6.5, 0, Math.PI); ctx.fill(); }
  }
  if (hairId.startsWith('girl') || hairId === 'mom_bun') { ctx.fillRect(-R - 2, -4, 7, 16); ctx.fillRect(R - 5, -4, 7, 16); }

  // 눈
  ctx.strokeStyle = ctx.fillStyle = '#2a1a10';
  if (o.faint) {
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const ex of [-7.5, 7.5]) { ctx.moveTo(ex - 3, -1); ctx.lineTo(ex + 3, 5); ctx.moveTo(ex + 3, -1); ctx.lineTo(ex - 3, 5); }
    ctx.stroke();
  } else if (o.sick || o.ouch) {
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (o.ouch) { ctx.moveTo(-11, 0); ctx.lineTo(-5, 3); ctx.lineTo(-11, 6); ctx.moveTo(11, 0); ctx.lineTo(5, 3); ctx.lineTo(11, 6); }
    else { ctx.arc(-7.5, 4, 3, Math.PI * 1.1, Math.PI * 1.9); ctx.moveTo(10, 2.5); ctx.arc(7.5, 4, 3, Math.PI * 1.9, Math.PI * 1.1, true); }
    ctx.stroke();
  } else if (o.angry) {
    ctx.beginPath(); ctx.ellipse(-7.5, 3, 3, 3.5, 0, 0, 7); ctx.ellipse(7.5, 3, 3, 3.5, 0, 0, 7); ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-12, -5); ctx.lineTo(-4, -1); ctx.moveTo(12, -5); ctx.lineTo(4, -1); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.ellipse(-7.5, 2, 3.3, 4.3, 0, 0, 7); ctx.ellipse(7.5, 2, 3.3, 4.3, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-8.7, 0.3, 1.5, 0, 7); ctx.arc(6.3, 0.3, 1.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(-6.6, 4, 0.7, 0, 7); ctx.arc(8.4, 4, 0.7, 0, 7); ctx.fill();
  }
  // 볼
  ctx.fillStyle = o.sick || o.ouch ? 'rgba(255,60,80,.7)' : 'rgba(255,110,130,.5)';
  ctx.beginPath(); ctx.ellipse(-12.5, 8, 4.2, 2.8, 0, 0, 7); ctx.ellipse(12.5, 8, 4.2, 2.8, 0, 0, 7); ctx.fill();
  // 입
  if (o.mouthOpen || o.ouch || o.angry) {
    ctx.fillStyle = '#8a1f2a';
    ctx.beginPath(); ctx.ellipse(0, 10, 5, o.angry ? 3 : 4.5, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.strokeStyle = '#8a1f2a'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    if (o.sick) { ctx.moveTo(-4, 12); ctx.quadraticCurveTo(-2, 10, 0, 12); ctx.quadraticCurveTo(2, 14, 4, 12); }
    else if (o.sad) ctx.arc(0, 14, 3.5, Math.PI * 1.15, Math.PI * 1.85);
    else ctx.arc(0, 8, 3.5, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }
  if (o.sick) {
    ctx.fillStyle = '#6ec6ff';
    ctx.beginPath(); ctx.moveTo(R - 1, -10); ctx.quadraticCurveTo(R + 4, -2, R - 1, -1); ctx.quadraticCurveTo(R - 6, -2, R - 1, -10); ctx.fill();
    ctx.fillStyle = 'rgba(200,235,255,.95)';
    rr(ctx, -11, -14, 22, 9, 4); ctx.fill();
  }
  if (o.bandage) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(-R, -10, 2 * R, 6);
  }
  ctx.restore();
}

// ---------- 고양이 ----------
const CAT_COLORS = {
  cheese: { name: '치즈냥이', base: '#f6a945', mark: '#d97b1f', belly: '#fff3dc', eye: '#2b2b2b' },
  gray: { name: '회색냥이', base: '#a7b0bd', mark: '#7c8696', belly: '#eef1f5', eye: '#2b2b2b' },
  black: { name: '까망냥이', base: '#3b3b44', mark: '#2a2a30', belly: '#55555f', eye: '#ffd54a' },
  white: { name: '하양냥이', base: '#fdfdfd', mark: '#fdfdfd', belly: '#ffffff', eye: '#4fa3ff' },
  calico: { name: '삼색냥이', base: '#fffaf2', mark: '#f0a04b', mark2: '#3b3b44', belly: '#ffffff', eye: '#2b2b2b' },
};

// 앉아 있는 고양이 (발 위치 x, y). o: { t: 꼬리 흔들기용 시간, dir, lying: 누워 있음, closed, happy, sick }
function drawCat(ctx, color, x, y, s = 1, o = {}) {
  const c = CAT_COLORS[color] || CAT_COLORS.cheese, t = o.t || 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale((o.dir < 0 ? -1 : 1) * s, s);
  ctx.fillStyle = 'rgba(0,0,0,.15)';
  ctx.beginPath(); ctx.ellipse(0, 0, 28, 6, 0, 0, 7); ctx.fill();

  if (o.lying) {
    ctx.strokeStyle = c.base; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(26, -8); ctx.quadraticCurveTo(40, 0, 20, 2); ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.fillStyle = c.base;
    ctx.beginPath(); ctx.ellipse(4, -13, 30, 14, 0, 0, 7); ctx.fill();
    if (c.mark2) { ctx.fillStyle = c.mark; ctx.beginPath(); ctx.ellipse(12, -18, 10, 7, 0, 0, 7); ctx.fill(); }
    drawCatHead(ctx, c, -22, -20, { closed: true, sick: o.sick });
  } else {
    // 꼬리 (살랑살랑)
    ctx.strokeStyle = c.base; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(14, -8);
    ctx.quadraticCurveTo(40, -14, 32 + Math.sin(t * 3) * 6, -46);
    ctx.stroke();
    ctx.lineCap = 'butt';
    // 몸
    ctx.fillStyle = c.base;
    ctx.beginPath(); ctx.ellipse(0, -22, 20, 22, 0, 0, 7); ctx.fill();
    if (c.mark2) {
      ctx.fillStyle = c.mark; ctx.beginPath(); ctx.ellipse(10, -26, 9, 11, 0.3, 0, 7); ctx.fill();
      ctx.fillStyle = c.mark2; ctx.beginPath(); ctx.ellipse(-12, -16, 6, 8, 0, 0, 7); ctx.fill();
    } else if (c.mark !== c.base) {
      ctx.strokeStyle = c.mark; ctx.lineWidth = 3;
      ctx.beginPath();
      for (const yy of [-34, -26, -18]) { ctx.moveTo(-19, yy); ctx.lineTo(-12, yy + 2); ctx.moveTo(19, yy); ctx.lineTo(12, yy + 2); }
      ctx.stroke();
    }
    ctx.fillStyle = c.belly;
    ctx.beginPath(); ctx.ellipse(0, -16, 10, 14, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-8, -2, 6, 4, 0, 0, 7); ctx.ellipse(8, -2, 6, 4, 0, 0, 7); ctx.fill();
    drawCatHead(ctx, c, 0, -52, { closed: o.closed, sick: o.sick, happy: o.happy });
  }
  ctx.restore();
}

function drawCatHead(ctx, c, x, y, o = {}) {
  // 귀
  for (const k of [-1, 1]) {
    ctx.fillStyle = c.mark2 ? (k > 0 ? c.mark2 : c.mark) : c.base;
    ctx.beginPath(); ctx.moveTo(x + k * 18, y - 4); ctx.lineTo(x + k * 15, y - 27); ctx.lineTo(x + k * 3, y - 14); ctx.fill();
    ctx.fillStyle = '#ffb3c6';
    ctx.beginPath(); ctx.moveTo(x + k * 14, y - 8); ctx.lineTo(x + k * 13.5, y - 21); ctx.lineTo(x + k * 6, y - 13); ctx.fill();
  }
  ctx.fillStyle = c.base;
  ctx.beginPath(); ctx.ellipse(x, y, 21, 17, 0, 0, 7); ctx.fill();
  if (c.mark2) {
    ctx.fillStyle = c.mark; ctx.beginPath(); ctx.ellipse(x - 9, y - 8, 9, 7, 0, 0, 7); ctx.fill();
  } else if (c.mark !== c.base) {
    ctx.strokeStyle = c.mark; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (const k of [-5, 0, 5]) { ctx.moveTo(x + k, y - 16); ctx.lineTo(x + k * 0.8, y - 9); }
    ctx.stroke();
  }
  // 눈
  if (o.closed || o.happy) {
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 2;
    ctx.beginPath();
    if (o.happy) {
      ctx.arc(x - 7, y + 3, 3.5, Math.PI * 1.1, Math.PI * 1.9);
      ctx.moveTo(x + 10.3, y + 1.8); ctx.arc(x + 7, y + 3, 3.5, Math.PI * 1.9, Math.PI * 1.1, true);
    } else {
      ctx.arc(x - 7, y, 3.5, 0.2, Math.PI - 0.2);
      ctx.moveTo(x + 10.4, y + 0.7); ctx.arc(x + 7, y, 3.5, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();
  } else {
    ctx.fillStyle = c.eye;
    ctx.beginPath(); ctx.ellipse(x - 7.5, y + 1, 4, 5, 0, 0, 7); ctx.ellipse(x + 7.5, y + 1, 4, 5, 0, 0, 7); ctx.fill();
    if (c.eye !== '#2b2b2b') {
      ctx.fillStyle = '#1e1e1e';
      ctx.beginPath(); ctx.ellipse(x - 7.5, y + 1, 1.5, 4, 0, 0, 7); ctx.ellipse(x + 7.5, y + 1, 1.5, 4, 0, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x - 8.9, y - 1.2, 1.7, 0, 7); ctx.arc(x + 6.1, y - 1.2, 1.7, 0, 7); ctx.fill();
  }
  // 코, 입, 수염, 볼
  ctx.fillStyle = '#ff8fab';
  ctx.beginPath(); ctx.moveTo(x - 2.5, y + 5); ctx.lineTo(x + 2.5, y + 5); ctx.lineTo(x, y + 7.5); ctx.fill();
  ctx.strokeStyle = '#5a3a3a'; ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x - 2.3, y + 8, 2.3, 0, Math.PI); ctx.moveTo(x + 4.6, y + 8); ctx.arc(x + 2.3, y + 8, 2.3, 0, Math.PI);
  ctx.stroke();
  ctx.strokeStyle = c.base === '#3b3b44' ? '#bbb' : '#8a7a7a'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (const k of [-1, 1]) { ctx.moveTo(x + k * 11, y + 6); ctx.lineTo(x + k * 25, y + 3); ctx.moveTo(x + k * 11, y + 8); ctx.lineTo(x + k * 25, y + 10); }
  ctx.stroke();
  ctx.fillStyle = o.sick ? 'rgba(255,60,80,.7)' : 'rgba(255,130,160,.55)';
  ctx.beginPath(); ctx.ellipse(x - 13, y + 6, 3.5, 2.2, 0, 0, 7); ctx.ellipse(x + 13, y + 6, 3.5, 2.2, 0, 0, 7); ctx.fill();
  if (o.sick) {
    ctx.fillStyle = '#6ec6ff';
    ctx.beginPath(); ctx.moveTo(x + 18, y - 10); ctx.quadraticCurveTo(x + 22, y - 3, x + 18, y - 2); ctx.quadraticCurveTo(x + 14, y - 3, x + 18, y - 10); ctx.fill();
  }
}
