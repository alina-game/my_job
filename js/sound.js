// 소리: 배경음악(장소마다 다름) + 효과음. 파일은 모두 CC0 (audio/LICENSES.txt 참고).
// 핸드폰과 브라우저는 사람이 화면을 처음 누르기 전에는 소리를 못 내서, 첫 터치 때 소리를 켜요.

const SFX_NAMES = ['click', 'good', 'wrong', 'ding', 'drop', 'camera', 'coin', 'pay', 'door_open', 'door_close', 'cut', 'chop',
  'cloth', 'page', 'step1', 'step2', 'step_snow', 'step_wood', 'smash', 'crash', 'glass', 'kick', 'done', 'unlock', 'morning',
  'fail', 'alert', 'meow', 'meow_food', 'purr', 'siren', 'eat1', 'eat2', 'bubble', 'splash', 'pour'];

// 화면마다 나오는 배경음악
const SCENE_BGM = {
  select: 'select', shop: 'shop', job: 'shop', store: 'shop', home: 'home', bath: 'home', eat: 'home',
  tv: 'tv', school: 'school', academy: 'school', ward: 'hospital', clinic: 'hospital', taxi: 'drive', art: 'art', outdoor: 'outdoor',
};
const INDOOR = ['shop', 'job', 'store', 'home', 'school', 'academy', 'art', 'clinic'];
const SOUND_KEY = 'myjob_sound';

const Sound = {
  muted: false,
  unlocked: false,
  ctx: null,
  buffers: {},
  bgmEl: null,
  bgmName: '',
  ambEl: null,
  ambName: '',
  wantBgm: '',
  wantAmb: '',
  lastCoins: null,
  stepT: 0,
  lastPlay: {},
  BGM_VOL: 0.35,
  AMB_VOL: 0.3,

  init() {
    try { this.muted = localStorage.getItem(SOUND_KEY) === 'off'; } catch (e) { /* 저장 못 해도 괜찮아요 */ }
    this.btn = document.getElementById('sound-btn');
    this.btn.addEventListener('click', e => { e.stopPropagation(); this.setMuted(!this.muted); });
    this.refreshBtn();
    const unlock = () => this.unlock();
    window.addEventListener('pointerdown', unlock, { once: true, capture: true });
    window.addEventListener('keydown', unlock, { once: true, capture: true });
    // 버튼을 누르면 "톡"
    document.addEventListener('click', e => { if (e.target.closest('button') && e.target.id !== 'sound-btn') this.play('click', 0.5); });
    // 다른 앱으로 가면 음악 멈춤
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (this.bgmEl) this.bgmEl.pause(); if (this.ambEl) this.ambEl.pause(); }
      else this.resumeLoops();
    });
  },

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.ctx.resume();
    } catch (e) { this.ctx = null; }
    for (const n of SFX_NAMES) this.load(n);
    this.applyLoops();
  },

  // 효과음 불러오기: Web Audio로 (빠름). 안 되면(파일로 열었을 때 등) <audio>로.
  load(name) {
    const url = `audio/sfx/${name}.ogg`;
    if (this.ctx && location.protocol.startsWith('http')) {
      fetch(url).then(r => r.arrayBuffer())
        .then(b => new Promise((ok, bad) => this.ctx.decodeAudioData(b, ok, bad)))
        .then(buf => { this.buffers[name] = buf; })
        .catch(() => { this.buffers[name] = url; });
    } else this.buffers[name] = url;
  },

  play(name, vol = 1) {
    if (this.muted || !this.unlocked) return;
    const now = performance.now();
    if (now - (this.lastPlay[name] || 0) < 60) return; // 같은 소리가 겹쳐서 너무 커지지 않게
    this.lastPlay[name] = now;
    const b = this.buffers[name];
    if (!b) return;
    try {
      if (typeof b === 'string') {
        const a = new Audio(b);
        a.volume = Math.min(1, vol * 0.8);
        a.play().catch(() => {});
      } else {
        const src = this.ctx.createBufferSource(), g = this.ctx.createGain();
        src.buffer = b;
        g.gain.value = vol * 0.8;
        src.connect(g).connect(this.ctx.destination);
        src.start();
      }
    } catch (e) { /* 소리가 안 나도 게임은 계속 */ }
  },

  // ---------- 배경음악 / 빗소리 ----------
  setBgm(name) { this.wantBgm = name || ''; this.applyLoops(); },
  setAmbient(name) { this.wantAmb = name || ''; this.applyLoops(); },

  applyLoops() {
    if (!this.unlocked) return;
    this.bgmEl = this.swapLoop(this.bgmEl, this.bgmName, this.wantBgm, this.BGM_VOL);
    this.bgmName = this.wantBgm;
    this.ambEl = this.swapLoop(this.ambEl, this.ambName, this.wantAmb, this.AMB_VOL);
    this.ambName = this.wantAmb;
  },

  swapLoop(el, cur, want, vol) {
    if (cur === want && el) {
      if (!this.muted && el.paused) el.play().catch(() => {});
      return el;
    }
    if (el) this.fadeOut(el);
    if (!want) return null;
    const a = new Audio(`audio/bgm/${want}.ogg`);
    a.loop = true;
    a.volume = 0;
    if (!this.muted) a.play().catch(() => {});
    this.fadeIn(a, vol);
    return a;
  },

  fadeIn(a, vol) {
    let v = 0;
    const step = () => { v = Math.min(vol, v + vol / 15); a.volume = v; if (v < vol) setTimeout(step, 60); };
    step();
  },

  fadeOut(a) {
    const step = () => {
      a.volume = Math.max(0, a.volume - 0.04);
      if (a.volume > 0) setTimeout(step, 50); else { a.pause(); a.src = ''; }
    };
    step();
  },

  resumeLoops() {
    if (this.muted || !this.unlocked) return;
    for (const a of [this.bgmEl, this.ambEl]) if (a && a.paused) a.play().catch(() => {});
  },

  setMuted(m) {
    this.muted = m;
    try { localStorage.setItem(SOUND_KEY, m ? 'off' : 'on'); } catch (e) { /* 무시 */ }
    if (!this.unlocked) this.unlock();
    if (m) { for (const a of [this.bgmEl, this.ambEl]) if (a) a.pause(); }
    else this.resumeLoops();
    this.refreshBtn();
  },

  refreshBtn() {
    this.btn.textContent = this.muted ? '🔇 소리 꺼짐' : '🔊 소리';
  },

  // ---------- 화면이 바뀔 때 ----------
  onScene(from, to) {
    if (from === 'town' && INDOOR.includes(to)) this.play('door_open', 0.7);
    if (INDOOR.includes(from) && to === 'town') this.play('door_close', 0.6);
    this.pickMusic();
  },

  pickMusic() {
    const name = Game.sceneName, sc = Game.scene;
    let bgm = SCENE_BGM[name] || '';
    if (name === 'town') bgm = State.isNight() ? 'night' : 'town';
    if (name === 'outdoor' && sc && ['lost', 'choose', 'survive', 'faint'].includes(sc.phase)) bgm = 'lost';
    if (name === 'taxi' && sc && (sc.phase === 'crash' || sc.phase === 'ambulance')) bgm = '';
    this.setBgm(bgm);
    this.setAmbient(name === 'town' && State.data && todayWeather() === 'rain' ? 'rain' : '');
  },

  // 게임 루프에서 매번 불러요: 코인 소리, 발소리, 장면 안에서 바뀌는 음악
  tick(dt) {
    const d = State.data;
    if (!d) return;
    if (this.lastCoins !== null && d.coins !== this.lastCoins) this.play(d.coins > this.lastCoins ? 'coin' : 'pay', 0.7);
    this.lastCoins = d.coins;
    const sc = Game.scene;
    if (sc && (Game.sceneName === 'town' || Game.sceneName === 'ward') && sc.walk && sc.walk !== this.lastWalk) {
      this.stepT -= dt;
      if (this.stepT <= 0) {
        this.stepT = 0.32;
        const snow = Game.sceneName === 'town' && todayWeather() === 'snow';
        this.play(Game.sceneName === 'ward' ? 'step_wood' : snow ? 'step_snow' : (this.stepAlt = !this.stepAlt) ? 'step1' : 'step2', 0.35);
      }
    }
    this.lastWalk = sc && sc.walk;
    if (Game.sceneName === 'outdoor' || Game.sceneName === 'taxi') this.pickMusic();
  },
};

// Game.go를 감싸서 화면이 바뀔 때 음악과 문소리
(function () {
  const go = Game.go;
  Game.go = function (name, params) {
    const from = this.sceneName;
    go.call(this, name, params);
    Sound.onScene(from, name);
  };
  // 알림/팝업 내용에 맞는 소리
  const origToast = toast;
  toast = function (msg, ms) {
    if (/🎉|열렸어요|친구가 됐어요/.test(msg)) Sound.play('unlock', 0.8);
    else if (/😢|🔒|부족해요/.test(msg)) Sound.play('wrong', 0.6);
    else if (/😺|야옹|냠냠/.test(msg)) Sound.play('meow_food', 0.8);
    return origToast(msg, ms);
  };
  const origModal = modal;
  modal = function (...children) {
    const o = origModal(...children);
    const t = (o.querySelector('h2') || {}).textContent || '';
    if (/게임 오버|쓰러졌어요/.test(o.textContent)) Sound.play('fail', 0.8);
    else if (/아침이에요/.test(t)) Sound.play('morning', 0.7);
    else if (/길고양이/.test(t)) Sound.play('meow', 0.9);
    else if (/🎉|구조되었어요|퇴원|끝!|친구가 됐어요/.test(t)) Sound.play('done', 0.8);
    return o;
  };
})();
