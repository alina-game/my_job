// 달력(일정표): 날짜마다 할 일을 적어 둬요. 오늘 일정을 안 지키면… 엄마가 와요!

const CAL_DAYS = 14;
const CAL_MAX = 4;

function openCalendar(sel) {
  const d = State.data;
  sel = sel || d.day;
  const grid = h('div', { style: 'display:grid;grid-template-columns:repeat(7,92px);gap:6px;margin:8px 0' });
  const detail = h('div', { style: 'min-height:150px' });
  const render = () => {
    grid.innerHTML = '';
    for (let day = d.day; day < d.day + CAL_DAYS; day++) {
      const tasks = d.schedule[day] || [];
      const today = day === d.day, picked = day === sel;
      const cell = h('div', {
        style: `height:78px;border-radius:12px;padding:4px;cursor:pointer;background:${today ? '#fff3cd' : '#fff'};` +
          `border:3px solid ${picked ? '#ff8a00' : '#eee'};font-size:13px;text-align:left;overflow:hidden`,
        onclick: () => { sel = day; render(); },
      },
      h('div', { style: 'display:flex;justify-content:space-between;font-weight:900' }, `${day}일째`, weatherFor(day)[0]),
      today ? h('div', { style: 'color:#e65100;font-size:11px' }, '오늘') : null,
      h('div', {}, tasks.map(t => (today && State.isDone(t) ? '✅' : TASKS[t].split(' ')[0])).join(' ')));
      grid.append(cell);
    }
    detail.innerHTML = '';
    const tasks = d.schedule[sel] || [];
    const isToday = sel === d.day;
    detail.append(h('p', { style: 'margin:4px 0;font-weight:bold' }, `📅 ${sel}일째${isToday ? ' (오늘)' : ''} 할 일 ${tasks.length}/${CAL_MAX}`));
    detail.append(h('div', { class: 'row', style: 'margin:4px 0' }, tasks.length ? tasks.map(t => {
      const done = isToday && State.isDone(t);
      return h('button', {
        class: 'btn small ' + (done ? 'green' : 'blue'),
        onclick: () => {
          if (done) return toast('✅ 이미 다 한 일이에요!');
          d.schedule[sel] = tasks.filter(x => x !== t);
          State.save(); render();
        },
      }, `${done ? '✅ ' : ''}${TASKS[t]}${done ? '' : ' ✖'}`);
    }) : h('span', { style: 'color:#999' }, '아직 할 일이 없어요. 아래에서 골라 적어요!')));
    detail.append(h('div', { class: 'row', style: 'margin:6px 0;gap:6px' }, Object.keys(TASKS).filter(t => !tasks.includes(t)).map(t =>
      h('button', {
        class: 'btn small gray', style: 'font-size:14px;padding:5px 10px',
        onclick: () => {
          if (tasks.length >= CAL_MAX) return toast(`하루에 ${CAL_MAX}개까지 적을 수 있어요`);
          d.schedule[sel] = [...tasks, t];
          State.save(); render();
        },
      }, '+ ' + TASKS[t]))));
  };
  const o = modal(
    h('h2', {}, '📅 나의 일정표'),
    h('p', { style: 'font-size:15px;color:#888;margin:0' }, '날짜를 누르고 할 일을 적어요. 오늘 일정을 안 지키고 밤에 집에 오면… 엄마가 들어와요! 😱'),
    grid, detail,
    h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { o.remove(); if (Game.sceneName === 'home') Game.scenes.home.buildUi(); } }, '닫기')));
  o.querySelector('.card').style.maxWidth = '720px';
  render();
}
