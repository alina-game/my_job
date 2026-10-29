// 동네: 가게 배치, 거리 그리기, 캐릭터 이동

// goods: [아이콘, 이름, 쇼핑 가격, 만드는 순서(레시피)]
const SHOP_TYPES = [
  { name: '빵집', icon: '🍞', color: '#f4c27a', goods: [
    ['🥐', '크루아상', 30, ['🌾 밀가루', '🧈 버터', '👐 반죽하기', '🔥 굽기']],
    ['🍰', '케이크', 60, ['🌾 밀가루', '🥚 달걀', '🔥 굽기', '🍓 딸기 올리기']],
    ['🥯', '베이글', 25, ['🌾 밀가루', '👐 반죽하기', '🔥 굽기']],
    ['🍩', '도넛', 20, ['🌾 밀가루', '👐 반죽하기', '🔥 굽기', '🍫 초콜릿 바르기']]] },
  { name: '꽃집', icon: '💐', color: '#f7a1c4', goods: [
    ['🌹', '장미 꽃다발', 40, ['🌹 장미', '🌿 잎 다듬기', '📜 포장지', '🎀 리본']],
    ['🌻', '해바라기 꽃다발', 30, ['🌻 해바라기', '✂️ 줄기 자르기', '📜 포장지']],
    ['🌷', '튤립 꽃다발', 35, ['🌷 튤립', '✂️ 줄기 자르기', '🎀 리본']],
    ['🌸', '벚꽃 화분', 50, ['🏺 화분', '🟫 흙 담기', '🌸 벚꽃 심기', '💧 물 주기']]] },
  { name: '카페', icon: '🍹', color: '#c99a78', goods: [
    ['🍹', '과일 에이드', 40, ['🍓 과일', '🧊 얼음', '💧 물', '🌀 섞기']],
    ['🍵', '녹차', 30, ['🍃 찻잎', '💧 물', '🌀 섞기']],
    ['🥤', '스무디', 35, ['🍓 과일', '🥛 우유', '🧊 얼음', '🌀 섞기']],
    ['🍪', '쿠키', 15, ['👐 반죽', '🍫 초코칩', '🔥 굽기']]] },
  { name: '서점', icon: '📚', color: '#8fb3e0', goods: [
    ['📕', '동화책', 50, ['📄 종이', '✏️ 글쓰기', '🧵 꿰매기', '📕 빨간 표지']],
    ['📗', '그림책', 45, ['📄 종이', '🎨 그림 그리기', '🧵 꿰매기', '📗 초록 표지']],
    ['📘', '만화책', 40, ['📄 종이', '🎨 그림 그리기', '✏️ 글쓰기', '📘 파란 표지']],
    ['📒', '공책', 15, ['📄 종이', '🧵 꿰매기', '📒 노란 표지']]] },
  { name: '장난감 가게', icon: '🧸', color: '#f6d55c', goods: [
    ['🧸', '곰인형', 80, ['🧶 천', '✂️ 자르기', '☁️ 솜 넣기', '🧵 꿰매기']],
    ['🪀', '요요', 25, ['⚪ 둥근 판', '🧵 실 감기', '🎨 색칠하기']],
    ['🚗', '장난감 자동차', 60, ['📦 차체', '⚫ 바퀴 달기', '🔩 나사 조이기', '🎨 색칠하기']],
    ['🎈', '풍선', 10, ['🔴 고무풍선', '💨 바람 넣기', '🧵 실 감기']]] },
  { name: '옷가게', icon: '👕', color: '#a3d9a5', goods: [
    ['👕', '티셔츠', 60, ['🟦 파란 천', '✂️ 재단하기', '🧵 바느질']],
    ['👗', '원피스', 90, ['🟥 빨간 천', '✂️ 재단하기', '🧵 바느질', '🎀 리본 달기']],
    ['🧢', '모자', 40, ['🟦 파란 천', '✂️ 재단하기', '🧵 바느질', '🔘 단추 달기']],
    ['🧦', '양말', 15, ['🧶 털실', '🥢 뜨개질', '🧵 바느질']]] },
  { name: '과일가게', icon: '🍎', color: '#f58b74', goods: [
    ['🍎', '사과 바구니', 15, ['🍎 사과', '🚿 씻기', '🧺 바구니에 담기', '🏷️ 가격표']],
    ['🍌', '바나나 상자', 15, ['🍌 바나나', '📦 상자 포장', '🏷️ 가격표']],
    ['🍇', '포도 상자', 25, ['🍇 포도', '🚿 씻기', '📦 상자 포장']],
    ['🍓', '딸기 바구니', 30, ['🍓 딸기', '🚿 씻기', '🧺 바구니에 담기']]] },
  { name: '문구점', icon: '✏️', color: '#c3a6e8', goods: [
    ['✏️', '연필', 10, ['🌲 나무 막대', '⬛ 연필심 넣기', '🔪 깎기']],
    ['🖍️', '크레파스', 30, ['🖍️ 색 왁스', '❄️ 굳히기', '📄 종이 포장']],
    ['📏', '자', 10, ['🔲 플라스틱 판', '🔪 깎기', '📏 눈금 그리기']],
    ['✂️', '가위', 20, ['🔪 칼날', '🔲 플라스틱 판', '🔩 나사 조이기']]] },
  { name: '피자가게', icon: '🍕', color: '#f2a65a', goods: [
    ['🍕', '피자', 70, ['👐 반죽', '🍅 토마토 소스', '🧀 치즈', '🔥 굽기']],
    ['🍝', '스파게티', 60, ['🍝 면', '♨️ 삶기', '🍅 토마토 소스']],
    ['🥗', '샐러드', 40, ['🥬 채소', '🧀 치즈', '🥄 버무리기']],
    ['🥤', '콜라', 15, ['🥤 컵', '🧊 얼음', '💦 탄산수']]] },
  { name: '신발가게', icon: '👟', color: '#9ad0d6', goods: [
    ['👟', '운동화', 90, ['🟦 천', '✂️ 재단하기', '👣 밑창 붙이기', '🎀 끈 묶기']],
    ['👢', '장화', 70, ['🟩 고무', '✂️ 재단하기', '👣 밑창 붙이기', '✨ 광내기']],
    ['🥿', '슬리퍼', 30, ['🟩 고무', '✂️ 재단하기', '👣 밑창 붙이기']],
    ['👞', '구두', 100, ['🟫 가죽', '✂️ 재단하기', '🧵 바느질', '✨ 광내기']]] },
  { name: '반려동물 가게', icon: '🐶', color: '#d8c3a5', goods: [
    ['🦴', '강아지 간식', 20, ['🍖 고기', '🦴 뼈 모양 틀', '🔥 굽기']],
    ['🐟', '물고기 밥', 15, ['🐟 생선', '🌀 갈기', '📦 통에 담기']],
    ['🧶', '고양이 장난감', 25, ['🧶 털실', '🔔 방울', '➰ 묶기']],
    ['🎀', '리본 목걸이', 30, ['🎀 리본', '🔔 방울', '➰ 묶기']]] },
  { name: '아이스크림 가게', icon: '🍨', color: '#ffc6e2', goods: [
    ['🍦', '소프트콘', 30, ['🥛 우유', '🍬 설탕', '❄️ 얼리기', '🍦 콘 과자']],
    ['🍧', '빙수', 50, ['🧊 얼음 갈기', '🍓 딸기 시럽', '🥛 우유']],
    ['🍨', '컵 아이스크림', 35, ['🥛 우유', '🌀 섞기', '❄️ 얼리기', '🥤 컵에 담기']],
    ['🍫', '초코바', 20, ['🍫 초콜릿', '🥛 우유', '❄️ 얼리기']]] },
];

// 레시피 단계 '🌾 밀가루' -> { icon: '🌾', name: '밀가루' }, 가게마다 쓰는 재료/도구 목록
for (const t of SHOP_TYPES) {
  const all = new Map();
  for (const g of t.goods) {
    g[3] = g[3].map(st => {
      const k = st.indexOf(' ');
      const step = { icon: st.slice(0, k), name: st.slice(k + 1) };
      if (!all.has(step.name)) all.set(step.name, step);
      return step;
    });
  }
  t.steps = [...all.values()];
}

const OUTDOOR_PLACES = [
  { name: '숲속 산책길', icon: '🌲', color: '#2e7d32' },
  { name: '높은 산', icon: '⛰️', color: '#5d6d7e' },
  { name: '바닷가', icon: '🏖️', color: '#1e88e5' },
  { name: '호숫가', icon: '🏞️', color: '#00897b' },
  { name: '깊은 동굴', icon: '🦇', color: '#6d4c41' },
];

const GROUND_Y = 440;
const townCache = {};

function getTown(n) {
  if (townCache[n]) return townCache[n];
  const r = seeded(n * 9973 + 17);
  const count = 5 + Math.floor(r() * 11);        // 한 동네에 가게 5~15개 (동네2 다섯 번째는 미술 체험관)
  const buildings = [], shops = [];
  let x = 150;
  buildings.push({ kind: 'store', name: '편의점', icon: '🏪', color: '#f4fbff', x, w: 210, h: 200 });
  x += 290;
  buildings.push({ kind: 'school', name: '학교', icon: '🏫', color: '#f7d9a8', x, w: 280, h: 240 });
  x += 340;
  buildings.push({ kind: 'hospital', name: '병원', icon: '🏥', color: '#ffffff', x, w: 190, h: 215 });
  x += 240;
  buildings.push({ kind: 'vet', name: '동물병원', icon: '🐾', color: '#d5f5ec', x, w: 190, h: 200 });
  x += 250;
  buildings.push({ kind: 'academy', name: '학원', icon: '📚', color: '#e1bee7', x, w: 250, h: 230 });
  x += 300;
  buildings.push({ kind: 'taxi', name: '택시 타는 곳', icon: '🚖', color: '#fff59d', x, w: 200, h: 150 });
  x += 280;
  for (let i = 0; i < count; i++) {
    let b;
    if (n === 2 && i === 4) {
      b = { kind: 'art', name: '미술 체험관', icon: '🎨', color: '#fff3b0', h: 250 };
    } else {
      const t = SHOP_TYPES[Math.floor(r() * SHOP_TYPES.length)];
      b = Object.assign({ kind: 'shop', h: 215 + Math.floor(r() * 3) * 15, target: 1 + Math.floor(r() * 130) }, t);
    }
    Object.assign(b, { index: i, x, w: 190 });
    buildings.push(b);
    shops.push(b);
    x += 240;
  }
  let outdoor = null;
  if ((n - 1) % 10 === 0) {   // 동네1, 11, 21 ... 마다 야외 장소
    const level = (n - 1) / 10;
    outdoor = Object.assign({ kind: 'outdoor', x: x + 30, w: 320, h: 240, level }, OUTDOOR_PLACES[level % OUTDOOR_PLACES.length]);
    buildings.push(outdoor);
    x += 420;
  }
  const town = { n, count, buildings, shops, outdoor, width: x + 220 };
  townCache[n] = town;
  return town;
}

const STARS = Array.from({ length: 70 }, (_, i) => {
  const r = seeded(i * 31 + 7);
  return { x: r() * W, y: r() * 380, s: 1 + r() * 2, p: r() * 6 };
});

Game.scenes.town = {
  enter(p) {
    const d = State.data;
    this.n = d.town;
    this.town = getTown(this.n);
    this.px = clamp(p.x != null ? p.x : d.x, 30, this.town.width - 30);
    this.py = 485;
    this.dir = 1;
    this.walk = 0;
    this.target = null;
    this.near = null;
    this.t = 0;
    this.cam = clamp(this.px - W / 2, 0, Math.max(0, this.town.width - W));
    this.stray = null;
    if (!State.isNight() && d.cats.length < MAX_CATS && Math.random() < 0.4) {
      this.stray = { x: 400 + Math.random() * (this.town.width - 800), y: 500, color: pick(Object.keys(CAT_COLORS)), dir: pick([-1, 1]) };
    }
    this.buildHud();
    const wx = todayWeather();
    if ((wx === 'rain' || wx === 'snow') && d.weatherToastDay !== d.day) {
      d.weatherToastDay = d.day;
      const look = currentLook();
      if (look.top === 'raincoat' || look.shoes === 'rain_boots') toast(wx === 'rain' ? '☔ 우비와 장화 덕분에 보송보송해요!' : '❄️ 따뜻하게 입어서 눈이 와도 괜찮아요!', 3000);
      else toast(wx === 'rain' ? '🌧️ 비가 와요! 집 옷장에서 우비를 입으면 좋아요' : '❄️ 눈이 와요! 눈사람 만들고 싶다~', 3000);
    }
    if (State.isNight() && !d.nightNotice) {
      d.nightNotice = true;
      State.save();
      this.nightBanner();
    }
  },

  exit() {
    State.data.x = this.px;
    State.save();
  },

  buildHud() {
    const d = State.data, night = State.isNight();
    Game.ui.append(
      h('div', { class: 'hud' },
        h('div', { class: 'pill' }, `📍 동네${this.n}`),
        h('div', { class: 'pill' }, `${night ? '🌙 밤' : '☀️ 낮'} · ${d.day}일째 · ${weatherFor(d.day)[0]} ${weatherFor(d.day)[1]}`),
        h('div', { class: 'pill' }, `💰 ${d.coins}`),
        h('div', { class: 'pill' }, `💼 아르바이트 ${Math.min(d.jobsToday, JOBS_PER_DAY)}/${JOBS_PER_DAY}`),
        healthPill(),
        h('button', { class: 'btn small', onclick: openBag }, '🎒 가방'),
        FAST ? h('div', { class: 'pill' }, '⚡ 빠른 모드') : null),
      h('button', { class: 'btn home-btn corner-tr' + (night ? ' blink' : ''), onclick: () => Game.go('home') }, '🏠 집으로'),
      h('div', { class: 'help' }, '방향키로 움직여요 · 건물 앞에서 스페이스바(또는 클릭)로 들어가요 · 길고양이를 만나면 데려갈 수 있어요'),
    );
  },

  nightBanner() {
    const o = modal(
      h('h2', {}, '🌙 밤이 되었어요!'),
      h('p', {}, `오늘 아르바이트 ${JOBS_PER_DAY}개를 모두 끝냈어요.`),
      h('p', {}, '이제 편의점 빼고 모든 가게가 문을 닫았어요.'),
      h('p', {}, '오른쪽 위에 반짝이는 🏠 집으로 버튼을 눌러 집에 가요!'),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => o.remove() }, '알겠어요')),
    );
  },

  enterBuilding(b) {
    const night = State.isNight();
    if (b.kind === 'store') return Game.go('store');
    if (b.kind === 'hospital') return Game.go('clinic');
    if (b.kind === 'taxi') return Game.go('taxi');
    if (b.kind === 'academy') {
      if (night) return toast('🌙 밤에는 학원이 문을 닫아요');
      if (State.data.sick) return toast('🤒 아파서 학원에 갈 수 없어요. 병원에 가거나 약을 먹고 쉬어요');
      return Game.go('academy');
    }
    if (b.kind === 'vet') return openVet();
    if (b.kind === 'school') {
      const d = State.data;
      if (night) return toast('🌙 밤에는 학교가 문을 닫아요');
      if (d.sick) return toast('🤒 아파서 학교에 갈 수 없어요. 병원에 가거나 약을 먹고 쉬어요');
      if (d.schoolDay === d.day) return toast('🏫 오늘은 벌써 학교에 다녀왔어요. 내일 또 와요!');
      return Game.go('school');
    }
    if (b.kind === 'outdoor') {
      if (night) return toast('🌙 밤에는 야외에 갈 수 없어요. 집으로 가요!');
      return Game.go('outdoor', { place: b });
    }
    if (!isShopOpen(this.n, b.index)) return toast('🔒 아직 잠겨 있어요! 옆 가게에서 코인을 모아 주세요');
    if (night) return toast('🌙 밤이라 문을 닫았어요. 편의점만 열려 있어요');
    if (b.kind === 'art') return Game.go('art');
    Game.go('shop', { townN: this.n, index: b.index });
  },

  changeTown(n, fromLeft) {
    State.data.town = n;
    const t = getTown(n);
    const x = fromLeft ? 40 : t.width - 40;
    this.px = x;
    Game.go('town', { x });
  },

  update(dt) {
    this.t += dt;
    if (Game.hasOverlay()) return;
    const k = Game.keys;
    let vx = 0, vy = 0;
    if (k.ArrowLeft) vx -= 1;
    if (k.ArrowRight) vx += 1;
    if (k.ArrowUp) vy -= 1;
    if (k.ArrowDown) vy += 1;
    // 아플 때: 가끔 증상 말풍선, "화장실 급해요!"면 잠깐 멈춤
    this.symT = (this.symT ?? 3) - dt;
    this.symShow = Math.max(0, (this.symShow || 0) - dt);
    this.freeze = Math.max(0, (this.freeze || 0) - dt);
    if (this.symT <= 0) {
      this.symT = 5 + Math.random() * 4;
      const line = Illness.symptomLine();
      if (line) { this.symText = line.text; this.symShow = 2.4; if (line.stop) this.freeze = 1.6; }
    }
    if (this.freeze > 0) { vx = 0; vy = 0; }
    if (vx || vy) this.target = null;
    if (this.target && !this.freeze) {
      const dx = this.target.tx - this.px;
      if (Math.abs(dx) < 8) {
        const { b, cat } = this.target;
        this.target = null;
        if (cat) return this.adoptStray();
        if (b) return this.enterBuilding(b);
      } else vx = Math.sign(dx);
    }
    this.px += vx * 270 * Illness.speed() * dt;
    this.py = clamp(this.py + vy * 150 * dt, 455, 515);
    if (vx) this.dir = vx;
    this.walk = (vx || vy) ? this.walk + dt * 12 : 0;

    const tw = this.town.width;
    if (this.px < 20) {
      if (this.n > 1 && vx < 0) return this.changeTown(this.n - 1, false);
      this.px = 20;
    }
    if (this.px > tw - 20) {
      if (State.data.maxTown > this.n && vx > 0) return this.changeTown(this.n + 1, true);
      this.px = tw - 20;
      this.target = null;
      if (!this.lockToast) { toast(`🔒 동네${this.n}의 가게를 모두 열어야 옆 동네로 갈 수 있어요`); this.lockToast = true; }
    }
    if (this.px < tw - 80) this.lockToast = false;

    this.near = this.town.buildings.find(b => Math.abs(b.x + b.w / 2 - this.px) < b.w / 2) || null;
    this.nearCat = !!(this.stray && Math.abs(this.stray.x - this.px) < 70);
    this.cam = clamp(this.px - W / 2, 0, Math.max(0, tw - W));
  },

  onKey(e) {
    if ((e.key !== ' ' && e.key !== 'Enter') || Game.hasOverlay()) return;
    if (this.nearCat) this.adoptStray();
    else if (this.near) this.enterBuilding(this.near);
  },

  onPointerDown(x, y) {
    if (Game.hasOverlay()) return;
    const wx = x + this.cam;
    if (this.stray && Math.abs(wx - this.stray.x) < 40 && y > this.stray.y - 80 && y < this.stray.y + 10) {
      this.target = { tx: this.stray.x - 45, cat: true };
      return;
    }
    const b = this.town.buildings.find(b => wx >= b.x && wx <= b.x + b.w && y >= GROUND_Y - b.h && y <= GROUND_Y + 10);
    if (b) this.target = { tx: b.x + b.w / 2, b };
    else if (wx > this.town.width - 160) this.target = { tx: this.town.width + 100 };
    else if (wx < 120 && this.n > 1) this.target = { tx: -100 };
    else if (y > GROUND_Y - 20) { this.target = { tx: wx }; this.py = clamp(y, 455, 515); }
  },

  // ---------- 그리기 ----------
  draw(ctx) {
    const night = State.isNight(), cam = this.cam;

    // 하늘
    const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    const wx = todayWeather(), gloomy = wx === 'rain' || wx === 'cloud' || wx === 'snow';
    g.addColorStop(0, night ? '#070b2a' : gloomy ? '#8a9bb0' : '#6ec6ff');
    g.addColorStop(1, night ? '#2b2f63' : gloomy ? '#d5dde6' : '#e3f6ff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, GROUND_Y);
    if (night) {
      for (const s of STARS) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.t * 2 + s.p);
        ctx.fillStyle = '#fff';
        ctx.fillRect(s.x, s.y, s.s, s.s);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff6c8';
      ctx.beginPath(); ctx.arc(820, 90, 32, 0, 7); ctx.fill();
      ctx.fillStyle = '#0d1236';
      ctx.beginPath(); ctx.arc(806, 80, 30, 0, 7); ctx.fill();
    } else {
      if (!gloomy) {
        ctx.fillStyle = '#ffe066';
        ctx.beginPath(); ctx.arc(840, 90, 36, 0, 7); ctx.fill();
      }
      if (wx === 'rainbow') {
        ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'].forEach((c, k) => {
          ctx.strokeStyle = c; ctx.globalAlpha = 0.55; ctx.lineWidth = 12;
          ctx.beginPath(); ctx.arc(420, 420, 330 - k * 12, Math.PI, Math.PI * 2); ctx.stroke();
        });
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = gloomy ? 'rgba(160,170,185,.95)' : 'rgba(255,255,255,.9)';
      for (let i = 0; i < 5; i++) {
        const cx = ((i * 260 + this.t * 12 - cam * 0.1) % 1300 + 1300) % 1300 - 170, cy = 70 + (i % 3) * 40;
        ctx.beginPath(); ctx.arc(cx, cy, 24, 0, 7); ctx.arc(cx + 28, cy - 10, 30, 0, 7); ctx.arc(cx + 58, cy, 22, 0, 7); ctx.fill();
      }
    }

    // 먼 빌딩 (천천히 움직임)
    ctx.fillStyle = night ? '#1a1f45' : '#b5d6ea';
    const off = cam * 0.3, first = Math.floor(off / 110);
    for (let i = first; i < first + 11; i++) {
      const hh = 70 + ((i * 37) % 5) * 28;
      ctx.fillRect(i * 110 - off, GROUND_Y - hh, 90, hh);
    }

    // 인도 + 도로
    ctx.fillStyle = '#d9d4cc'; ctx.fillRect(0, GROUND_Y, W, 85);
    ctx.fillStyle = '#bdb6aa';
    for (let x = -(cam % 60); x < W; x += 60) ctx.fillRect(x, GROUND_Y, 2, 85);
    ctx.fillStyle = '#9e978b'; ctx.fillRect(0, 523, W, 6);
    ctx.fillStyle = '#4f4f57'; ctx.fillRect(0, 529, W, 71);
    ctx.fillStyle = '#f4f4f4';
    for (let x = -(cam % 120); x < W; x += 120) ctx.fillRect(x, 562, 60, 6);

    // 건물 (편의점은 밤에도 불이 켜져 있으니 나중에)
    for (const b of this.town.buildings) {
      if (b.kind === 'store' || b.kind === 'hospital' || b.kind === 'vet') continue;
      const sx = b.x - cam;
      if (sx > W || sx + b.w < 0) continue;
      this.drawBuilding(ctx, b, sx, night);
    }

    // 가로등 기둥
    const lamps = [];
    for (let lx = 100; lx < this.town.width; lx += 480) lamps.push(lx - cam);
    ctx.fillStyle = '#3d3d46';
    for (const lx of lamps) {
      if (lx < -20 || lx > W + 20) continue;
      ctx.fillRect(lx - 3, GROUND_Y - 150, 6, 160);
      ctx.fillRect(lx - 3, GROUND_Y - 150, 26, 5);
      ctx.fillStyle = night ? '#fff1a8' : '#ddd';
      ctx.beginPath(); ctx.arc(lx + 22, GROUND_Y - 142, 7, 0, 7); ctx.fill();
      ctx.fillStyle = '#3d3d46';
    }

    this.drawEdges(ctx);

    if (night) {
      ctx.fillStyle = 'rgba(5,10,40,.5)';
      ctx.fillRect(0, 0, W, H);
      for (const lx of lamps) {
        const rg = ctx.createRadialGradient(lx + 22, GROUND_Y - 142, 5, lx + 22, GROUND_Y - 60, 170);
        rg.addColorStop(0, 'rgba(255,240,160,.55)');
        rg.addColorStop(1, 'rgba(255,240,160,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(lx - 160, GROUND_Y - 160, 360, 260);
      }
    }

    // 편의점 (항상 영업)
    const store = this.town.buildings[0];
    this.drawStore(ctx, store, store.x - cam, night);
    for (const b of this.town.buildings) {
      if (b.kind === 'hospital' || b.kind === 'vet') this.drawFacility(ctx, b, b.x - cam, night);
    }
    if (this.stray) {
      drawCat(ctx, this.stray.color, this.stray.x - cam, this.stray.y, 0.75, { t: this.t, dir: this.stray.dir });
      if (!this.nearCat) emoji(ctx, '❓', this.stray.x - cam, this.stray.y - 80, 20);
    }

    // 캐릭터
    drawCharacter(ctx, currentLook(), this.px - cam, this.py, 1, Object.assign({ walk: this.walk, dir: this.dir }, Illness.look()));
    this.drawHealth(ctx, this.px - cam, this.py);
    this.drawWeather(ctx);
    if (this.nearCat && !Game.hasOverlay()) {
      bubble(ctx, '스페이스바: 길고양이 데려가기 🐱', this.px - cam, this.py - 122, 16);
    } else if (this.near && !Game.hasOverlay()) {
      bubble(ctx, `스페이스바: ${this.near.name} 들어가기`, this.px - cam, this.py - 118, 16);
    }
  },

  // 증상 말풍선, 비 맞은 정도
  drawHealth(ctx, x, y) {
    const d = State.data;
    if (this.symShow > 0 && this.symText) bubble(ctx, this.symText, x, y - 150, 16);
    if (d.wet > 1) {
      const pct = Math.min(200, Math.round(d.wet));
      ctx.fillStyle = 'rgba(0,0,0,.45)'; rr(ctx, x - 46, y + 8, 92, 18, 9); ctx.fill();
      ctx.fillStyle = pct >= 100 ? '#ff7043' : '#4fc3f7';
      rr(ctx, x - 44, y + 10, 88 * Math.min(1, pct / 200), 14, 7); ctx.fill();
      text(ctx, `💧 젖음 ${pct}%`, x, y + 17, 11, '#fff');
      if (pct > 30) for (let k = 0; k < 3; k++) {
        const t = (this.t * 2 + k / 3) % 1;
        ctx.fillStyle = 'rgba(120,190,255,.8)';
        ctx.beginPath(); ctx.arc(x - 14 + k * 14, y - 60 + t * 50, 2.5, 0, 7); ctx.fill();
      }
    }
  },

  drawWeather(ctx) {
    const wx = todayWeather(), t = this.t;
    if (wx === 'rain') {
      ctx.strokeStyle = 'rgba(190,210,255,.75)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 140; i++) {
        const x = ((i * 73 + t * 120) % (W + 40)) - 20, y = (i * 131 + t * 620) % H;
        ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 14);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(120,150,200,.35)';
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(((i * 260 - this.cam) % 1300 + 1300) % 1300 - 100, 505 + (i % 2) * 10, 45, 7, 0, 0, 7); ctx.fill(); }
    } else if (wx === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(0, GROUND_Y, W, 10);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 90; i++) {
        const x = ((i * 97 + Math.sin(t + i) * 20) % W + W) % W, y = (i * 61 + t * 60) % H;
        ctx.beginPath(); ctx.arc(x, y, 2 + (i % 3), 0, 7); ctx.fill();
      }
    }
  },

  drawBuilding(ctx, b, sx, night) {
    if (b.kind === 'outdoor') return this.drawOutdoor(ctx, b, sx, night);
    if (b.kind === 'school' || b.kind === 'academy' || b.kind === 'taxi') return this.drawFacility(ctx, b, sx, night);
    const top = GROUND_Y - b.h, w = b.w;
    const open = isShopOpen(this.n, b.index);
    const dark = shade(b.color, -45);

    ctx.fillStyle = b.color;
    ctx.fillRect(sx, top, w, b.h);
    ctx.fillStyle = dark;
    ctx.fillRect(sx - 6, top - 8, w + 12, 10);

    // 간판
    ctx.fillStyle = '#fff';
    rr(ctx, sx + 12, top + 10, w - 24, 38, 10); ctx.fill();
    text(ctx, b.name, sx + w / 2, top + 30, b.name.length > 5 ? 17 : 21, '#3a2a1a');

    // 차양
    const aw = top + 58, stripes = 8;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 ? '#fff' : (b.kind === 'art' ? ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'][i % 5] : dark);
      ctx.beginPath();
      ctx.moveTo(sx + i * w / stripes, aw); ctx.lineTo(sx + (i + 1) * w / stripes, aw);
      ctx.lineTo(sx + (i + 1) * w / stripes, aw + 22); ctx.arc(sx + (i + 0.5) * w / stripes, aw + 22, w / stripes / 2, 0, Math.PI);
      ctx.fill();
    }

    // 창문 + 문
    const lit = !night && open;
    ctx.fillStyle = lit ? '#bfe6ff' : '#2a3140';
    rr(ctx, sx + 14, GROUND_Y - 110, 48, 60, 6); ctx.fill();
    rr(ctx, sx + w - 62, GROUND_Y - 110, 48, 60, 6); ctx.fill();
    ctx.fillStyle = '#7b4a24';
    rr(ctx, sx + w / 2 - 25, GROUND_Y - 84, 50, 84, 6); ctx.fill();
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath(); ctx.arc(sx + w / 2 + 15, GROUND_Y - 42, 3.5, 0, 7); ctx.fill();
    emoji(ctx, b.icon, sx + w / 2, aw + 52, 40);

    if (!open) {
      ctx.fillStyle = 'rgba(70,70,80,.7)';
      ctx.fillRect(sx - 6, top - 8, w + 12, b.h + 8);
      emoji(ctx, '🔒', sx + w / 2, top + b.h / 2 - 10, 54);
      text(ctx, '잠겨 있어요', sx + w / 2, top + b.h / 2 + 36, 18, '#fff');
      return;
    }
    if (night) {
      ctx.fillStyle = '#fff3e0';
      rr(ctx, sx + w / 2 - 34, GROUND_Y - 70, 68, 28, 6); ctx.fill();
      text(ctx, '문 닫음', sx + w / 2, GROUND_Y - 56, 15, '#d32f2f');
    }
    // 목표 코인 진행도
    if (b.kind === 'shop') {
      const e = getEarned(this.n, b.index), ratio = Math.min(1, e / b.target);
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      rr(ctx, sx + 10, top - 36, w - 20, 22, 11); ctx.fill();
      ctx.fillStyle = ratio >= 1 ? '#ffd23f' : '#6fdc8c';
      rr(ctx, sx + 12, top - 34, (w - 24) * ratio + 1, 18, 9); ctx.fill();
      text(ctx, ratio >= 1 ? '✓ 목표 달성!' : `💰 ${Math.min(e, b.target)} / ${b.target}`, sx + w / 2, top - 25, 13, '#fff');
    }
  },

  // 학교, 병원, 동물병원
  drawFacility(ctx, b, sx, night) {
    if (sx > W || sx + b.w < 0) return;
    const top = GROUND_Y - b.h, w = b.w, school = b.kind === 'school';
    if (b.kind === 'taxi') {
      ctx.fillStyle = '#607d8b'; ctx.fillRect(sx + 10, top + 20, 8, b.h - 20); ctx.fillRect(sx + w - 18, top + 20, 8, b.h - 20);
      ctx.fillStyle = '#ffeb3b'; rr(ctx, sx, top, w, 26, 6); ctx.fill();
      text(ctx, '🚖 택시 타는 곳', sx + w / 2, top + 13, 16, '#333');
      ctx.fillStyle = 'rgba(200,230,255,.5)'; ctx.fillRect(sx + 18, top + 26, w - 36, 60);
      // 서 있는 택시
      const cx = sx + w / 2, cy = GROUND_Y + 30;
      ctx.fillStyle = '#ffc107'; rr(ctx, cx - 70, cy - 40, 140, 34, 10); ctx.fill();
      rr(ctx, cx - 42, cy - 64, 84, 28, 10); ctx.fill();
      ctx.fillStyle = '#bfe6ff'; ctx.fillRect(cx - 36, cy - 59, 32, 20); ctx.fillRect(cx + 4, cy - 59, 32, 20);
      ctx.fillStyle = '#333'; rr(ctx, cx - 16, cy - 76, 32, 12, 3); ctx.fill();
      text(ctx, 'TAXI', cx, cy - 70, 9, '#ffeb3b');
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx - 40, cy - 6, 13, 0, 7); ctx.arc(cx + 40, cy - 6, 13, 0, 7); ctx.fill();
      ctx.fillStyle = '#aaa'; ctx.beginPath(); ctx.arc(cx - 40, cy - 6, 5, 0, 7); ctx.arc(cx + 40, cy - 6, 5, 0, 7); ctx.fill();
      return;
    }
    if (b.kind === 'academy') {
      const lit = !night;
      ctx.fillStyle = b.color; ctx.fillRect(sx, top, w, b.h);
      ctx.fillStyle = '#8e24aa'; ctx.fillRect(sx - 6, top - 10, w + 12, 12);
      ctx.fillStyle = '#fff'; rr(ctx, sx + 20, top + 10, w - 40, 36, 10); ctx.fill();
      text(ctx, '📚 학원', sx + w / 2, top + 28, 20, '#6a1b9a');
      ['➗', '🎹', '🔤', '⚽', '🏀', '🩰', '✂️', '🎨'].forEach((ic, k) => {
        const wx2 = sx + 18 + (k % 4) * 56, wy = top + 58 + Math.floor(k / 4) * 58;
        ctx.fillStyle = lit ? '#e3f2fd' : '#2a3140'; rr(ctx, wx2, wy, 46, 46, 6); ctx.fill();
        if (lit) emoji(ctx, ic, wx2 + 23, wy + 23, 26);
      });
      ctx.fillStyle = '#6d4220'; rr(ctx, sx + w / 2 - 28, GROUND_Y - 62, 56, 62, 5); ctx.fill();
      if (night) {
        ctx.fillStyle = '#fff3e0'; rr(ctx, sx + w / 2 - 34, GROUND_Y - 50, 68, 26, 6); ctx.fill();
        text(ctx, '문 닫음', sx + w / 2, GROUND_Y - 37, 15, '#d32f2f');
      }
      return;
    }
    const lit = school ? !night : true;
    if (!school && night) {
      const rg = ctx.createRadialGradient(sx + w / 2, GROUND_Y - 60, 20, sx + w / 2, GROUND_Y - 60, 200);
      rg.addColorStop(0, 'rgba(255,255,230,.4)');
      rg.addColorStop(1, 'rgba(255,255,230,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(sx - 120, top - 40, w + 240, b.h + 140);
    }
    ctx.fillStyle = b.color;
    ctx.fillRect(sx, top, w, b.h);
    if (school) {
      ctx.fillStyle = '#c0392b';
      ctx.beginPath(); ctx.moveTo(sx - 12, top); ctx.lineTo(sx + w / 2, top - 48); ctx.lineTo(sx + w + 12, top); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(sx + w / 2, top - 16, 15, 0, 7); ctx.fill();
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(sx + w / 2, top - 16); ctx.lineTo(sx + w / 2, top - 26); ctx.moveTo(sx + w / 2, top - 16); ctx.lineTo(sx + w / 2 + 7, top - 16); ctx.stroke();
      ctx.fillStyle = '#555'; ctx.fillRect(sx + w - 24, top - 100, 4, 52);
      ctx.fillStyle = '#ff5e5e'; ctx.fillRect(sx + w - 20, top - 100, 26, 16);
      ctx.fillStyle = '#fff';
      rr(ctx, sx + w / 2 - 70, top + 10, 140, 34, 10); ctx.fill();
      text(ctx, '🏫 우리 학교', sx + w / 2, top + 28, 18, '#7a3b10');
      for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
        if (r === 1 && (c === 1 || c === 2)) continue;
        ctx.fillStyle = lit ? '#bfe6ff' : '#2a3140';
        rr(ctx, sx + 20 + c * 63, top + 60 + r * 70, 46, 44, 5); ctx.fill();
      }
      ctx.fillStyle = '#7b4a24';
      rr(ctx, sx + w / 2 - 36, GROUND_Y - 80, 72, 80, 6); ctx.fill();
      ctx.fillStyle = '#5a3418'; ctx.fillRect(sx + w / 2 - 1, GROUND_Y - 80, 2, 80);
      if (night) {
        ctx.fillStyle = '#fff3e0';
        rr(ctx, sx + w / 2 - 34, GROUND_Y - 62, 68, 28, 6); ctx.fill();
        text(ctx, '문 닫음', sx + w / 2, GROUND_Y - 48, 15, '#d32f2f');
      }
      return;
    }
    const hosp = b.kind === 'hospital';
    ctx.fillStyle = hosp ? '#e53935' : '#26a69a';
    ctx.fillRect(sx, top, w, 12);
    ctx.fillStyle = '#fff';
    rr(ctx, sx + 12, top + 20, w - 24, 36, 10); ctx.fill();
    text(ctx, hosp ? '병원 24시' : '동물병원 24시', sx + w / 2, top + 39, 18, hosp ? '#c62828' : '#00796b');
    if (hosp) {
      ctx.fillStyle = '#e53935';
      ctx.fillRect(sx + w / 2 - 8, top + 66, 16, 46); ctx.fillRect(sx + w / 2 - 23, top + 81, 46, 16);
    } else emoji(ctx, '🐾', sx + w / 2, top + 90, 40);
    ctx.fillStyle = night ? '#fffbe0' : '#bfe6ff';
    rr(ctx, sx + 14, GROUND_Y - 110, 44, 56, 6); ctx.fill();
    rr(ctx, sx + w - 58, GROUND_Y - 110, 44, 56, 6); ctx.fill();
    ctx.fillStyle = 'rgba(180,220,255,.8)';
    ctx.fillRect(sx + w / 2 - 28, GROUND_Y - 80, 56, 80);
    ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 3;
    ctx.strokeRect(sx + w / 2 - 28, GROUND_Y - 80, 56, 80);
  },

  adoptStray() {
    const s = this.stray, d = State.data;
    if (!s || Game.hasOverlay()) return;
    if (d.cats.length >= MAX_CATS) return toast(`🐱 고양이는 ${MAX_CATS}마리까지 키울 수 있어요`);
    const cv = h('canvas', { width: 160, height: 130 });
    drawCat(cv.getContext('2d'), s.color, 80, 120, 1.3, { t: 1 });
    const input = h('input', { class: 'name-input', maxlength: 8, value: pick(['나비', '콩이', '보리', '모모', '두부', '호두', '구름', '망고', '쿠키', '별이']) });
    const o = modal(
      h('h2', {}, '🐾 길고양이를 만났어요!'),
      cv,
      h('p', {}, '야옹~ 집에 데려가서 키울까요?'),
      h('p', {}, '이름을 지어 주세요: ', input),
      h('div', { class: 'row' },
        h('button', {
          class: 'btn green', onclick: () => {
            const name = input.value.trim() || '나비';
            d.cats.push({ name, color: s.color, hunger: 60, happy: 50, sick: false, medicine: false });
            State.save();
            this.stray = null;
            o.remove();
            toast(`🏠 ${josa(name, '이', '가')} 우리 가족이 됐어요! 집에서 만날 수 있어요`, 3500);
          },
        }, '데려가기'),
        h('button', { class: 'btn gray', onclick: () => o.remove() }, '그냥 두기')));
    setTimeout(() => input.select(), 50);
  },

  drawStore(ctx, b, sx, night) {
    if (sx > W || sx + b.w < 0) return;
    const top = GROUND_Y - b.h, w = b.w;
    if (night) {
      const rg = ctx.createRadialGradient(sx + w / 2, GROUND_Y - 60, 20, sx + w / 2, GROUND_Y - 60, 230);
      rg.addColorStop(0, 'rgba(255,255,220,.5)');
      rg.addColorStop(1, 'rgba(255,255,220,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(sx - 140, top - 60, w + 280, b.h + 160);
    }
    ctx.fillStyle = b.color;
    ctx.fillRect(sx, top, w, b.h);
    const band = ['#2e9e4f', '#ff9800', '#1e6fd9'];
    band.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(sx, top + 50 + i * 8, w, 8); });
    ctx.fillStyle = '#1e6fd9';
    rr(ctx, sx + 14, top + 8, w - 28, 36, 10); ctx.fill();
    text(ctx, '🏪 편의점 24시', sx + w / 2, top + 26, 19, '#fff');
    // 유리창 + 진열대
    ctx.fillStyle = night ? '#fffbe0' : '#d6f0ff';
    ctx.fillRect(sx + 12, top + 86, w - 24, b.h - 86);
    const colors = ['#ff6b6b', '#ffd23f', '#6fdc8c', '#5ab4ff', '#ff9ccf'];
    for (let r = 0; r < 3; r++) {
      ctx.fillStyle = '#9aa5b1';
      ctx.fillRect(sx + 18, top + 110 + r * 30, w - 36, 3);
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = colors[(i + r * 2) % colors.length];
        ctx.fillRect(sx + 22 + i * 19, top + 96 + r * 30, 12, 14);
      }
    }
    ctx.fillStyle = 'rgba(180,220,255,.6)';
    ctx.fillRect(sx + w / 2 - 30, GROUND_Y - 82, 60, 82);
    ctx.strokeStyle = '#7d8a96'; ctx.lineWidth = 3;
    ctx.strokeRect(sx + w / 2 - 30, GROUND_Y - 82, 60, 82);
    ctx.beginPath(); ctx.moveTo(sx + w / 2, GROUND_Y - 82); ctx.lineTo(sx + w / 2, GROUND_Y); ctx.stroke();
    if (night) {
      ctx.fillStyle = '#2e9e4f';
      rr(ctx, sx + w / 2 - 44, top - 34, 88, 26, 8); ctx.fill();
      text(ctx, '영업 중', sx + w / 2, top - 21, 15, '#fff');
    }
  },

  drawOutdoor(ctx, b, sx, night) {
    const c = b.color;
    // 산/숲 배경
    ctx.fillStyle = shade(c, -20);
    ctx.beginPath();
    ctx.moveTo(sx - 20, GROUND_Y);
    ctx.lineTo(sx + 90, GROUND_Y - 200); ctx.lineTo(sx + 170, GROUND_Y - 120);
    ctx.lineTo(sx + 250, GROUND_Y - 230); ctx.lineTo(sx + b.w + 30, GROUND_Y);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      const tx = sx + 10 + i * 58, th = 80 + (i % 3) * 25;
      ctx.fillStyle = '#6d4c41'; ctx.fillRect(tx + 18, GROUND_Y - 24, 8, 24);
      ctx.fillStyle = shade('#2e7d32', (i % 2) * 25);
      ctx.beginPath(); ctx.moveTo(tx, GROUND_Y - 20); ctx.lineTo(tx + 22, GROUND_Y - 20 - th); ctx.lineTo(tx + 44, GROUND_Y - 20); ctx.fill();
    }
    // 입구 표지판
    ctx.fillStyle = '#8d5a2b';
    ctx.fillRect(sx + b.w / 2 - 70, GROUND_Y - 120, 8, 120);
    ctx.fillRect(sx + b.w / 2 + 62, GROUND_Y - 120, 8, 120);
    ctx.fillStyle = '#c58b4e';
    rr(ctx, sx + b.w / 2 - 100, GROUND_Y - 170, 200, 56, 10); ctx.fill();
    text(ctx, `${b.icon} ${b.name}`, sx + b.w / 2, GROUND_Y - 150, 19, '#3a2208');
    text(ctx, night ? '밤에는 못 가요' : '야외 탐험 · 길을 잃을 수도 있어요!', sx + b.w / 2, GROUND_Y - 127, 12, '#3a2208');
  },

  drawEdges(ctx) {
    const tw = this.town.width, cam = this.cam;
    const sign = (x, lines, color) => {
      ctx.fillStyle = '#555'; ctx.fillRect(x - 3, GROUND_Y - 110, 6, 110);
      ctx.fillStyle = color;
      rr(ctx, x - 80, GROUND_Y - 170, 160, 64, 10); ctx.fill();
      lines.forEach((l, i) => text(ctx, l, x, GROUND_Y - 150 + i * 24, i ? 13 : 19, '#fff'));
    };
    const rx = tw - 100 - cam;
    if (rx > -100 && rx < W + 100) {
      if (State.data.maxTown > this.n) sign(rx, [`동네${this.n + 1} →`, '오른쪽으로 가요'], '#2e7d32');
      else sign(rx, [`🔒 동네${this.n + 1}`, '가게를 모두 열면 갈 수 있어요'], '#777');
    }
    if (this.n > 1) {
      const lx = 70 - cam;
      if (lx > -100) sign(lx, [`← 동네${this.n - 1}`, '왼쪽으로 가요'], '#2e7d32');
    }
  },
};

// 지금 아픈 병 / 깁스 표시
function healthPill() {
  const d = State.data, def = Illness.def();
  if (def) return h('div', { class: 'pill', style: 'background:#ffd6d6' }, `${def.icon} ${def.name}`);
  if (d.cast) return h('div', { class: 'pill', style: 'background:#eceff1' }, `🦴 ${d.cast.limb === 'arm' ? '팔' : '다리'} 깁스`);
  if (d.dirtyHands) return h('div', { class: 'pill', style: 'background:#fff3cd' }, '🖐️ 손 씻어야 해요');
  return null;
}

// 동물병원: 아픈 고양이를 치료해요
function openVet() {
  const d = State.data;
  const o = modal(h('h2', {}, '🐾 동물병원'), h('div', { style: 'font-size:64px' }, '👨‍⚕️'));
  const card = o.querySelector('.card');
  if (!d.cats.length) card.append(h('p', {}, '고양이를 키우게 되면 데려와요!'));
  else {
    card.append(h('p', {}, `아픈 고양이는 진료비 💰 ${DOCTOR_FEE}코인이면 바로 나아요`));
    card.append(h('div', { class: 'list' }, d.cats.map(c => {
      const cv = h('canvas', { width: 110, height: 90 });
      drawCat(cv.getContext('2d'), c.color, 55, 84, 0.9, { lying: c.sick, sick: c.sick, t: 1 });
      return h('div', { class: 'good', style: 'width:170px' }, cv, c.name,
        c.sick
          ? h('button', {
            class: 'btn small green', onclick: () => {
              if (d.coins < DOCTOR_FEE) return toast('😢 코인이 부족해요. 편의점에서 고양이 약을 살 수도 있어요');
              d.coins -= DOCTOR_FEE;
              c.sick = false;
              c.medicine = false;
              State.save();
              o.remove();
              toast(`💉 ${josa(c.name, '이', '가')} 다 나았어요! 야옹~`, 3000);
              Game.go('town');
            },
          }, '치료하기')
          : h('span', { style: 'color:#2e7d32' }, '건강해요 😊'));
    })));
  }
  card.append(h('div', { class: 'row' }, h('button', { class: 'btn gray', onclick: () => o.remove() }, '나가기')));
}

// 가방 보기
function openBag() {
  const bag = State.data.bag;
  const foods = bag.filter(i => i.kind === 'food'), goods = bag.filter(i => i.kind !== 'food');
  const chip = i => h('div', { class: 'good', style: 'width:120px' }, h('div', { class: 'ic' }, i.icon), i.name);
  const o = modal(
    h('h2', {}, '🎒 가방'),
    h('p', {}, `💰 코인 ${State.data.coins}개 · ⭐ 칭찬 스티커 ${State.data.stickers}개 · 🐱 고양이 ${State.data.cats.length}마리`),
    (() => {
      const fr = Object.entries(State.data.friends || {}).filter(([, v]) => v >= 100).map(([k]) => k);
      return fr.length ? h('p', {}, `🤝 병원 친구: ${fr.join(', ')}`) : null;
    })(),
    h('p', {}, `🍙 음식 (${foods.length})`),
    foods.length ? h('div', { class: 'list' }, foods.map(chip)) : h('p', { style: 'color:#888' }, '편의점에서 음식을 살 수 있어요'),
    h('p', {}, `🎁 물건 (${goods.length})`),
    goods.length ? h('div', { class: 'list' }, goods.map(chip)) : h('p', { style: 'color:#888' }, '가게에서 쇼핑해 보세요'),
    h('div', { class: 'row' },
      h('button', { class: 'btn', onclick: () => o.remove() }, '닫기'),
      h('button', {
        class: 'btn small gray', onclick: () => {
          if (confirm('정말 처음부터 다시 할까요? 모든 기록이 지워져요.')) { State.reset(); Game.go('select'); }
        },
      }, '처음부터 다시 하기')),
  );
}
