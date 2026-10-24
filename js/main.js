// 시작: 입력 연결 후 첫 화면으로

window.addEventListener('load', () => {
  Game.root = document.getElementById('game');
  Game.canvas = document.getElementById('canvas');
  Game.ctx = Game.canvas.getContext('2d');
  Game.ui = document.getElementById('ui');

  Game.fit();
  window.addEventListener('resize', () => Game.fit());

  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return; // 이름 입력할 때는 게임 조작 안 함
    if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault();
    Game.keys[e.key] = true;
    if (!e.repeat && Game.scene && Game.scene.onKey) Game.scene.onKey(e);
  });
  window.addEventListener('keyup', e => { delete Game.keys[e.key]; });
  window.addEventListener('blur', () => { Game.keys = {}; });

  // 버튼을 누른 뒤 스페이스바가 버튼을 다시 누르지 않도록
  document.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) b.blur();
  });

  const call = (name, e) => {
    const sc = Game.scene;
    if (sc && sc[name]) { const p = Game.toCanvas(e); sc[name](p.x, p.y); }
  };
  Game.canvas.addEventListener('pointerdown', e => {
    Game.canvas.setPointerCapture(e.pointerId);
    call('onPointerDown', e);
  });
  Game.canvas.addEventListener('pointermove', e => call('onPointerMove', e));
  Game.canvas.addEventListener('pointerup', e => call('onPointerUp', e));
  Game.canvas.addEventListener('pointercancel', e => call('onPointerUp', e));

  setupMobile();
  Sound.init();

  State.load();
  Game.go(State.data.character ? 'town' : 'select');
  Game.last = performance.now();
  requestAnimationFrame(t => Game.loop(t));
});

// 핸드폰: 전체 화면 버튼(주소 표시줄 숨기기 + 가로 고정), 홈 화면 앱 설치 준비
function setupMobile() {
  const btn = document.getElementById('fullscreen-btn');
  const installed = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
  const refresh = () => { btn.hidden = installed || !document.fullscreenEnabled || !!document.fullscreenElement; };
  btn.addEventListener('click', () => {
    document.documentElement.requestFullscreen({ navigationUI: 'hide' })
      .then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'))
      .catch(() => { /* 가로 고정이 안 되는 기기도 있어요 */ });
  });
  document.addEventListener('fullscreenchange', () => { refresh(); Game.fit(); });
  refresh();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* 없어도 게임은 돼요 */ });
  }
}
