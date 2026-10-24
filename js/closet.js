// 옷장: 상의/하의/신발/모자를 골라 갈아입기. 가게에서 산 옷도 여기 들어와요.

const CLOSET_TABS = [['top', '👕 상의'], ['bottom', '👖 하의'], ['shoes', '👟 신발'], ['hat', '🧢 모자']];

function openCloset(tab = 'top') {
  const d = State.data, closet = State.closet();
  const preview = h('canvas', { width: 220, height: 280 });
  const draw = () => {
    const c = preview.getContext('2d');
    c.clearRect(0, 0, 220, 280);
    c.fillStyle = '#fff3d6'; c.fillRect(0, 0, 220, 280);
    drawCharacter(c, currentLook(), 110, 262, 2);
  };
  const wear = (part, id) => {
    d.look = Object.assign({}, currentLook(), { [part]: id });
    State.save();
    draw();
    render();
  };
  const tabsEl = h('div', { class: 'row', style: 'margin:0 0 8px' });
  const grid = h('div', { class: 'list', style: 'max-height:250px' });
  const render = () => {
    tabsEl.innerHTML = '';
    CLOSET_TABS.forEach(([k, label]) => tabsEl.append(h('button', {
      class: 'btn small ' + (k === tab ? 'pink' : 'gray'), onclick: () => { tab = k; render(); },
    }, label)));
    grid.innerHTML = '';
    const look = currentLook();
    for (const id of closet[tab]) {
      const item = CLOTHES[tab][id];
      if (!item) continue;
      const on = look[tab] === id;
      grid.append(h('button', {
        class: 'opt', style: on ? 'box-shadow:0 0 0 4px #ff8a00' : '', onclick: () => wear(tab, id),
      }, h('span', { class: 'ic', style: 'font-size:40px' }, item.icon || '👕'),
      h('span', { style: item.color ? `color:${shade(item.color, -40)}` : '' }, item.name), on ? '✅ 입는 중' : ''));
    }
  };
  const o = modal(
    h('h2', {}, '👚 옷장'),
    h('div', { style: 'display:flex;gap:18px;align-items:flex-start' },
      preview,
      h('div', { style: 'width:470px' }, tabsEl, grid,
        h('p', { style: 'font-size:15px;color:#888' }, '옷가게·신발가게에서 옷을 사면 옷장에 들어와요. 비 오는 날엔 우비와 장화!'))),
    h('div', { class: 'row' },
      h('button', { class: 'btn gray', onclick: () => { d.look = null; State.save(); draw(); render(); } }, '처음 옷으로'),
      h('button', { class: 'btn', onclick: () => o.remove() }, '다 입었어요!')));
  draw();
  render();
}
