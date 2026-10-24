// 편의점: 8개 코너, 모든 물건 20코인, 밤에도 영업

const STORE_PRICE = 20;
// cat: grab(입에 가져다 대면 먹음, 5입) / drink(3입) / ramen(젓가락) / snack(봉지에서 하나씩)
const CORNERS = [
  { name: '라면 코너', items: [['🍜', '매운 라면', 'ramen'], ['🍜', '짜장 라면', 'ramen'], ['🍜', '컵라면', 'ramen']] },
  { name: '삼각김밥 코너', items: [['🍙', '참치마요 삼각김밥', 'grab'], ['🍙', '불고기 삼각김밥', 'grab'], ['🍙', '김치 삼각김밥', 'grab']] },
  { name: '핫바 코너', items: [['🌭', '치즈 핫바', 'grab'], ['🌭', '매콤 핫바', 'grab']] },
  { name: '샌드위치 코너', items: [['🥪', '햄치즈 샌드위치', 'grab'], ['🥪', '에그 샌드위치', 'grab']] },
  { name: '과자 코너', items: [['🍪', '초코쿠키', 'snack', '🍪'], ['🥨', '프레첼', 'snack', '🥨'], ['🍬', '사탕', 'snack', '🍬']] },
  { name: '아이스크림 코너', items: [['🍦', '바닐라콘', 'grab'], ['🍨', '딸기 아이스크림', 'grab'], ['🍧', '빙수바', 'grab']] },
  { name: '음료수 코너', items: [['🧃', '사과주스', 'drink'], ['🧃', '오렌지주스', 'drink'], ['🥛', '바나나우유', 'drink']] },
  { name: '약 코너', items: [['💊', '감기약', 'medicine'], ['🌡️', '해열제', 'medicine']] },
  { name: '반려동물 코너', items: [['🐟', '고양이 사료', 'catfood'], ['🥫', '고양이 캔', 'catfood'], ['💊', '고양이 약', 'catmed']] },
  { name: '물 코너', items: [['💧', '생수', 'drink'], ['💧', '큰 생수', 'drink']] },
];
const NOT_FOOD = { medicine: '집 식탁에서 먹으면 자고 나서 나아요', catfood: '집에서 고양이에게 줄 수 있어요', catmed: '아픈 고양이에게 먹여요' };

Game.scenes.store = {
  enter() {
    this.corner = 0;
    this.render();
  },

  render() {
    const ui = Game.ui, c = CORNERS[this.corner];
    ui.innerHTML = '';
    ui.append(
      h('div', { class: 'topbar' },
        h('button', { class: 'btn small red', onclick: () => Game.go('town') }, '🚪 나가기'),
        h('span', {}, `🏪 편의점 · 모든 물건 ${STORE_PRICE}코인`),
        h('div', { class: 'spacer' }),
        h('div', { class: 'pill' }, `💰 ${State.data.coins}`)),
      h('div', { class: 'corner-title' }, c.name),
      h('div', { class: 'corner-items' }, c.items.map(([ic, name, cat, piece]) =>
        h('div', { class: 'good' },
          h('div', { class: 'ic' }, ic), name,
          h('span', { style: 'color:#b8860b' }, `💰 ${STORE_PRICE}`),
          h('button', { class: 'btn small blue', onclick: () => this.buy(ic, name, cat, piece) }, '사기')))),
      // 라면 코너(처음)에는 < 없음, 물 코너(마지막)에는 > 없음
      this.corner > 0 ? h('button', { class: 'arrow left', onclick: () => { this.corner--; this.render(); } }, '<') : null,
      this.corner < CORNERS.length - 1 ? h('button', { class: 'arrow right', onclick: () => { this.corner++; this.render(); } }, '>') : null,
      h('div', { class: 'dots' }, CORNERS.map((_, i) => h('span', { class: i === this.corner ? 'on' : '' }))),
      h('div', { class: 'help' }, '산 음식과 약은 집 식탁에서, 고양이 물건은 고양이를 눌러서 써요'),
    );
  },

  buy(icon, name, cat, piece) {
    const d = State.data;
    if (d.coins < STORE_PRICE) return toast('😢 코인이 부족해요! 아르바이트로 모아 봐요');
    d.coins -= STORE_PRICE;
    d.bag.push({ kind: NOT_FOOD[cat] ? cat : 'food', icon, name, cat, piece });
    State.save();
    toast(`${icon} ${josa(name, '을', '를')} 샀어요! ${NOT_FOOD[cat] || '집 식탁에서 먹어요'}`);
    this.render();
  },

  draw(ctx) {
    ctx.fillStyle = '#eaf6ee';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2e9e4f'; ctx.fillRect(0, 62, W, 70);
    ctx.fillStyle = '#ff9800'; ctx.fillRect(0, 132, W, 8);
    ctx.fillStyle = '#1e6fd9'; ctx.fillRect(0, 140, W, 8);
    // 선반
    ctx.fillStyle = '#cfd8dc';
    ctx.fillRect(90, 150, 780, 330);
    ctx.fillStyle = '#90a4ae';
    for (let r = 0; r < 4; r++) ctx.fillRect(90, 230 + r * 80, 780, 10);
    // 바닥
    for (let y = 480; y < H; y += 40) {
      for (let x = 0; x < W; x += 40) {
        ctx.fillStyle = ((x + y) / 40) % 2 ? '#fafafa' : '#e0e0e0';
        ctx.fillRect(x, y, 40, 40);
      }
    }
  },
};
