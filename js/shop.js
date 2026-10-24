// 가게: 잠금 해제 규칙, 가게 안 메뉴(아르바이트/쇼핑/나가기)

function shopKey(n, i) { return n + '-' + i; }
function getEarned(n, i) { return State.data.earned[shopKey(n, i)] || 0; }
function addEarned(n, i, c) { const k = shopKey(n, i); State.data.earned[k] = (State.data.earned[k] || 0) + c; }
function isShopOpen(n, i) { return i < (State.data.unlocked[n] || 0); }

// 가장 마지막에 열린 가게에서 목표 코인을 다 벌면 옆 가게가 열림.
// 동네 가게를 다 열면 옆 동네가 열림. 새로 열린 것들을 알림 문장으로 돌려줌.
function checkUnlocks(n) {
  const d = State.data, town = getTown(n), msgs = [];
  let u = d.unlocked[n] || 0;
  while (u > 0 && u < town.count) {
    const last = town.shops[u - 1];
    const done = last.kind === 'art' || getEarned(n, u - 1) >= last.target;
    if (!done) break;
    u++;
    msgs.push(`🎉 옆에 ${josa(town.shops[u - 1].name, '이', '가')} 열렸어요!`);
  }
  d.unlocked[n] = u;
  const lastShop = town.shops[town.count - 1];
  const allDone = u >= town.count && (lastShop.kind === 'art' || getEarned(n, town.count - 1) >= lastShop.target);
  if (allDone && d.maxTown <= n) {
    d.maxTown = n + 1;
    d.unlocked[n + 1] = Math.max(d.unlocked[n + 1] || 0, 1);
    msgs.push(`🗺️ 동네${n}의 가게를 모두 열었어요! 동네${n + 1}이(가) 열렸어요!`);
    if (n % 10 === 0) msgs.push('🌲 동네' + (n + 1) + '에 새로운 야외 장소가 열렸어요!');
  }
  State.save();
  return msgs;
}

function drawShopInterior(ctx, b) {
  ctx.fillStyle = b.color;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = shade(b.color, 25);
  for (let x = 0; x < W; x += 60) ctx.fillRect(x, 0, 30, 420);
  // 바닥
  for (let y = 420; y < H; y += 45) {
    for (let x = 0; x < W; x += 45) {
      ctx.fillStyle = ((x + y) / 45) % 2 ? '#efe4d2' : '#d9c8ad';
      ctx.fillRect(x, y, 45, 45);
    }
  }
  // 선반
  for (const sx of [40, 720]) {
    ctx.fillStyle = '#8d5a2b';
    ctx.fillRect(sx, 110, 200, 300);
    for (let r = 0; r < 3; r++) {
      ctx.fillStyle = '#c58b4e';
      ctx.fillRect(sx + 8, 120 + r * 95, 184, 80);
      (b.goods || []).forEach((g, i) => { if (i < 3) emoji(ctx, g[0], sx + 40 + i * 60, 160 + r * 95, 36); });
      if (!b.goods) emoji(ctx, b.icon, sx + 100, 160 + r * 95, 40);
    }
  }
  // 계산대
  ctx.fillStyle = '#7b4a24';
  ctx.fillRect(300, 470, 360, 130);
  ctx.fillStyle = '#a0683a';
  ctx.fillRect(290, 460, 380, 18);
}

Game.scenes.shop = {
  enter(p) {
    this.n = p.townN;
    this.i = p.index;
    this.b = getTown(this.n).shops[this.i];
    this.view = 'menu';
    this.render();
    (p.msgs || []).forEach((m, k) => setTimeout(() => toast(m, 3000), k * 400));
  },

  render() {
    const b = this.b, d = State.data, ui = Game.ui;
    ui.innerHTML = '';
    ui.append(h('div', { class: 'topbar' },
      h('span', {}, `${b.icon} ${b.name}`),
      h('div', { class: 'spacer' }),
      h('div', { class: 'pill' }, `💰 ${d.coins}`)));

    if (this.view === 'menu') {
      const e = getEarned(this.n, this.i), ratio = Math.min(1, e / b.target);
      const isLast = this.i === getTown(this.n).count - 1;
      ui.append(h('div', { class: 'card shop-card' },
        h('div', { class: 'shop-icon' }, b.icon),
        h('h2', {}, `${b.name}에 어서 오세요!`),
        h('p', {}, ratio >= 1
          ? (isLast ? '✅ 목표 달성! 이 동네의 마지막 가게예요' : '✅ 목표 달성! 옆 가게가 열렸어요')
          : `이 가게에서 ${b.target}코인을 벌면 ${isLast ? '옆 동네가' : '옆 가게가'} 열려요`),
        h('div', { class: 'progress' }, h('div', { style: `width:${ratio * 100}%` })),
        h('p', { style: 'font-size:17px;color:#777' }, `번 코인 ${Math.min(e, b.target)} / ${b.target} · 오늘 아르바이트 ${d.jobsToday}/${JOBS_PER_DAY}`),
        h('div', { class: 'menu-col' },
          h('button', { class: 'btn green', onclick: () => this.startJob() }, '💼 아르바이트'),
          h('button', { class: 'btn pink', onclick: () => { this.view = 'shop'; this.render(); } }, '🛍️ 쇼핑'),
          h('button', { class: 'btn gray', onclick: () => Game.go('town') }, '🚪 나가기'))));
    } else {
      ui.append(h('div', { class: 'card shop-card', style: 'width:720px' },
        h('h2', {}, `🛍️ ${b.name} 쇼핑`),
        h('div', { class: 'goods' }, b.goods.map(([ic, name, price]) =>
          h('div', { class: 'good' },
            h('div', { class: 'ic' }, ic), name, h('span', { style: 'color:#b8860b' }, `💰 ${price}`),
            h('button', { class: 'btn small blue', onclick: () => this.buy(ic, name, price) }, '사기')))),
        h('div', { class: 'row' }, h('button', { class: 'btn gray', onclick: () => { this.view = 'menu'; this.render(); } }, '⬅ 돌아가기'))));
    }
  },

  startJob() {
    if (State.isNight()) return toast('🌙 오늘 아르바이트를 다 했어요. 집에 가서 쉬어요!');
    if (State.data.sick) return toast('🤒 아파서 아르바이트를 못 해요. 병원에 가거나 약을 먹고 푹 자요');
    Game.go('job', { n: this.n, i: this.i });
  },

  buy(icon, name, price) {
    const d = State.data;
    if (d.coins < price) return toast('😢 코인이 부족해요! 아르바이트로 모아 봐요');
    d.coins -= price;
    d.bag.push({ kind: 'goods', icon, name });
    const cl = SHOP_CLOTHES[name];
    if (cl) {
      const closet = State.closet();
      if (!closet[cl[0]].includes(cl[1])) { closet[cl[0]].push(cl[1]); setTimeout(() => toast('👚 집 옷장에 들어갔어요! 갈아입어 봐요'), 600); }
    }
    State.save();
    toast(`${icon} ${josa(name, '을', '를')} 샀어요! 가방에 넣었어요`);
    this.render();
  },

  draw(ctx) { drawShopInterior(ctx, this.b); },
};
