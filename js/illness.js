// 병과 다치기: 원인에 따라 다른 병에 걸리고, 진짜처럼 증상이 보이고, 그냥 두면 점점 심해져요.
// 한 번에 병 하나만. 더 심한 병이 생기면 그 병으로 바뀌어요.

const INJURY_CHANCE = 0.1;   // 운동하다 다칠 확률
const CAST_DAYS = 3;         // 깁스하는 날 수
const FRACTURE_FEE = 50;

const ILLNESS = {
  cold: {
    name: '감기', icon: '🤧', rank: 1, meds: ['감기약', '해열제'], nights: 1, speed: 0.75, worsen: { after: 2, to: 'flu' },
    symptom: '기침이 나고 콧물이 흘러요', doctor: '목이 빨갛고 콧물이 나네요. 감기예요!',
    lines: ['콜록콜록', '에취!', '훌쩍…', '목이 따가워요'],
  },
  flu: {
    name: '독감', icon: '🤒', rank: 2, meds: ['해열제'], nights: 2, speed: 0.5, hospitalize: 3,
    symptom: '열이 펄펄 나고 몸이 덜덜 떨려요', doctor: '열이 39도나 돼요! 독감이네요.',
    lines: ['으슬으슬 추워요…', '머리가 뜨거워요', '덜덜덜…', '콜록! 콜록!'], stop: true,
  },
  stomach: {
    name: '배탈', icon: '😣', rank: 1, meds: ['소화제'], nights: 1, speed: 0.7, worsen: { after: 2, to: 'enteritis' },
    symptom: '배가 살살 아파요', doctor: '배에서 꾸르륵 소리가 나네요. 배탈이에요.',
    lines: ['꾸르륵~', '배가 아파요…', '화장실 급해요!'], stop: true,
  },
  enteritis: {
    name: '장염', icon: '🤢', rank: 2, meds: ['지사제'], nights: 2, speed: 0.55, hospitalize: 3, noFood: true,
    symptom: '배가 많이 아프고 화장실에 자꾸 가요', doctor: '장에 나쁜 균이 들어갔어요. 장염이에요.',
    lines: ['꾸르륵 꾸르륵!', '화장실 급해요!', '속이 메스꺼워요…'], stop: true,
  },
  foodpoison: {
    name: '식중독', icon: '🤮', rank: 3, meds: [], nights: 99, speed: 0.45, hospitalize: 3, noFood: true,
    symptom: '속이 울렁울렁하고 어지러워요', doctor: '상한 음식을 먹었군요. 식중독이에요!',
    lines: ['우웩…', '어지러워요…', '빙글빙글 돌아요'], stop: true,
  },
  fracture_arm: {
    name: '팔 골절', icon: '🦴', rank: 4, meds: [], speed: 0.85, fracture: 'arm',
    symptom: '팔이 퉁퉁 붓고 너무 아파요', doctor: '팔이 퉁퉁 부었네요. 엑스레이를 찍어 봐요.',
    lines: ['아야야…', '팔이 너무 아파요 😭', '움직일 수가 없어요'],
  },
  fracture_leg: {
    name: '다리 골절', icon: '🦴', rank: 4, meds: [], speed: 0.3, fracture: 'leg',
    symptom: '다리가 퉁퉁 붓고 걸을 때마다 아파요', doctor: '다리가 퉁퉁 부었네요. 엑스레이를 찍어 봐요.',
    lines: ['아야야…', '다리가 너무 아파요 😭', '절뚝… 절뚝…'],
  },
};
const FOOD_SPOIL_DAYS = 3;
const NO_SPOIL = ['생수', '큰 생수'];

const Illness = {
  get() { return State.data.illness; },
  def() { const i = State.data.illness; return i ? ILLNESS[i.type] : null; },

  // 예전 저장 이어 쓰기
  migrate() {
    const d = State.data;
    if (d.sick && !d.illness) d.illness = { type: 'cold', day: d.day, medDays: 0 };
    if (!d.sick && d.illness) d.illness = null;
    if (d.wet == null) d.wet = 0;
    for (const it of d.bag) if (it.kind === 'food' && it.boughtDay == null) it.boughtDay = d.day;
    if (d.cast && d.day > d.cast.until) d.cast = null;
    State.save();
  },

  // 병에 걸려요. reason: 왜 걸렸는지, after: 팝업을 닫은 뒤 할 일
  catch(type, reason, after) {
    const d = State.data, cur = this.def(), def = ILLNESS[type];
    if (cur && cur.rank >= def.rank && d.illness.type !== type) { if (after) after(); return false; }
    if (d.illness && d.illness.type === type) { if (after) after(); return false; }
    d.illness = { type, day: d.day, medDays: 0, medToday: false };
    d.sick = true;
    State.save();
    if (typeof Sound !== 'undefined') Sound.play('alert', 0.8);
    const cure = def.fracture ? '🏥 병원에 가서 엑스레이를 찍고 깁스를 해야 해요!'
      : def.meds.length ? `💊 편의점 약(${def.meds.join(', ')})을 먹고 푹 자거나, 🏥 병원에 가요`
        : '🏥 병원에 꼭 가야 해요! 약으로는 안 나아요';
    modal(
      h('h2', {}, `${def.icon} ${def.name}${def.fracture ? '이에요!' : '에 걸렸어요!'}`),
      reason ? h('p', {}, reason) : null,
      h('p', { style: 'color:#d32f2f' }, `증상: ${def.symptom}`),
      h('p', {}, cure),
      def.worsen || def.hospitalize ? h('p', { style: 'font-size:16px;color:#888' }, '그냥 두면 점점 더 심해져요!') : null,
      h('div', { class: 'row' }, h('button', {
        class: 'btn', onclick: e => { e.currentTarget.closest('.overlay').remove(); if (after) after(); },
      }, '알겠어요')));
    return true;
  },

  cure() {
    const d = State.data;
    d.illness = null;
    d.sick = false;
    State.save();
  },

  // 걷는 빠르기 (1 = 보통)
  speed() {
    const def = this.def(), d = State.data;
    let s = def ? def.speed : 1;
    if (d.cast && d.cast.limb === 'leg') s = Math.min(s, 0.55); // 목발
    return s;
  },

  // 캐릭터 그릴 때 쓰는 옵션
  look() {
    const d = State.data, i = d.illness;
    return { illness: i ? i.type : null, cast: d.cast ? d.cast.limb : null, sick: !!i && i.type === 'flu' };
  },

  // 운동하다 다칠지 미리 정해요 (다친다면 몇 초 뒤에)
  rollInjury(duration) {
    return Math.random() < INJURY_CHANCE ? duration * (0.25 + Math.random() * 0.5) : null;
  },

  injure(activity, after) {
    const limb = Math.random() < 0.5 ? 'arm' : 'leg';
    if (typeof Sound !== 'undefined') Sound.play('smash', 0.9);
    this.catch('fracture_' + limb, `${activity}하다가 꽈당! 넘어져서 ${limb === 'arm' ? '팔' : '다리'}이 부러졌어요 😭`, after);
  },

  // 깁스 중에는 운동 못 함
  canExercise() {
    const d = State.data;
    if (d.cast) return `🦴 ${d.cast.limb === 'arm' ? '팔' : '다리'}에 깁스를 해서 운동은 못 해요 (${Math.max(1, d.cast.until - d.day + 1)}일 남음)`;
    return null;
  },

  // ---------- 음식 ----------
  isSpoiled(item) {
    return item.kind === 'food' && !NO_SPOIL.includes(item.name) && State.data.day - (item.boughtDay ?? State.data.day) >= FOOD_SPOIL_DAYS;
  },

  canEat(item) {
    const def = this.def();
    if (def && def.noFood && item.cat !== 'drink') return `${def.icon} ${def.name}이라 지금은 음식을 못 먹어요. 물이나 음료만 마셔요`;
    return null;
  },

  afterEating(item, after) {
    const d = State.data;
    if (this.isSpoiled(item)) return this.catch('foodpoison', `산 지 ${d.day - item.boughtDay}일이나 지난 ${josa(item.name, '을', '를')} 먹었어요… 상했었나 봐요!`, after);
    if (d.dirtyHands && item.cat !== 'drink') {
      const type = Math.random() < 0.7 ? 'stomach' : 'enteritis';
      return this.catch(type, '화장실에 다녀와서 손을 안 씻고 먹었어요! 손에 있던 균이 배 속으로 들어갔어요', after);
    }
    if (after) after();
  },

  // ---------- 비 맞기 ----------
  rainRate() {
    const look = currentLook();
    let r = 100 / 60;                                   // 우비 없으면 1분이면 흠뻑
    if (look.top === 'raincoat') r *= 0.1;
    if (look.shoes === 'rain_boots') r *= 0.7;
    if (look.hat !== 'none') r *= 0.85;
    return r;
  },

  // 게임 루프에서 매번: 비 맞으면 젖고, 실내에서는 마름
  tick(dt) {
    const d = State.data;
    if (!d || !d.character) return;
    const inTownRain = Game.sceneName === 'town' && todayWeather() === 'rain';
    if (inTownRain && Game.hasOverlay()) return;   // 팝업 보는 동안은 그대로 (젖지도 마르지도 않음)
    if (inTownRain) {
      d.wet = (d.wet || 0) + this.rainRate() * dt;
      if (d.wet >= 200 && !this.wetFlu) { this.wetFlu = true; this.catch('flu', '비를 너무 오래 맞아서 몸이 꽁꽁 얼었어요 🌧️'); }
      else if (d.wet >= 100 && !this.wetCold) { this.wetCold = true; this.catch('cold', '비를 흠뻑 맞아서 감기에 걸렸어요 🌧️ (우비를 입으면 안 젖어요)'); }
    } else if (d.wet > 0) {
      d.wet = Math.max(0, d.wet - 8 * dt);
      if (d.wet < 100) this.wetCold = false;
      if (d.wet < 200) this.wetFlu = false;
    }
  },

  // ---------- 자고 일어날 때 ----------
  // news에 아침 소식을 넣고, 구급차가 와야 하면 true
  night(news) {
    const d = State.data;
    d.wet = 0;
    let ambulance = false;
    const i = d.illness;
    if (i) {
      const def = ILLNESS[i.type], days = d.day - i.day;
      if (def.fracture) {
        news.push(`🦴 ${def.name}… 아직도 너무 아파요. 병원에 가서 깁스를 해야 해요!`);
      } else if (i.medDays >= def.nights) {
        this.cure();
        news.push(`💊 약 먹고 푹 잤더니 ${josa(def.name, '이', '가')} 다 나았어요!`);
      } else if (i.medToday) {
        news.push(`💊 약이 듣고 있어요. 하룻밤만 더 약 먹고 자면 ${josa(def.name, '이', '가')} 나아요`);
      } else if (def.worsen && days >= def.worsen.after) {
        const to = ILLNESS[def.worsen.to];
        d.illness = { type: def.worsen.to, day: d.day, medDays: 0, medToday: false };
        news.push(`😱 ${josa(def.name, '을', '를')} 그냥 뒀더니 ${to.icon} ${to.name}으로 심해졌어요! 증상: ${to.symptom}`);
      } else if (def.hospitalize && days >= def.hospitalize) {
        ambulance = true;
        news.push(`🚑 ${josa(def.name, '이', '가')} 너무 심해져서 구급차가 왔어요!`);
      } else {
        news.push(`${def.icon} 아직 ${josa(def.name, '이', '가')} 안 나았어요. 증상: ${def.symptom}`);
      }
      if (d.illness) d.illness.medToday = false;
    } else if (Math.random() < (d.washed ? 0.05 : 0.1)) {
      d.illness = { type: 'cold', day: d.day, medDays: 0, medToday: false };
      news.push('🤧 으슬으슬… 자는 동안 감기에 걸렸어요! 감기약을 먹고 자거나 병원에 가요' + (d.washed ? '' : ' (잘 씻으면 병에 덜 걸려요)'));
    }
    d.sick = !!d.illness;
    if (d.cast && d.day > d.cast.until) {
      news.push('🎉 뼈가 다 붙어서 깁스를 풀었어요! 이제 운동도 할 수 있어요');
      d.cast = null;
    } else if (d.cast) news.push(`🦴 깁스 ${d.cast.until - d.day + 1}일 남았어요 (병원에 가면 깁스 풀 날짜를 알려 줘요)`);
    return ambulance;
  },

  // 약 먹기 (집 식탁)
  takeMedicine(item) {
    const d = State.data, i = d.illness, def = this.def();
    if (!i) return '😊 아프지 않을 때는 약을 안 먹어도 돼요';
    if (!def.meds.length) return `🏥 ${josa(def.name, '은', '는')} 약으로는 안 나아요. 병원에 가야 해요!`;
    if (!def.meds.includes(item.name)) return `💊 ${josa(item.name, '은', '는')} ${def.name}에는 안 들어요. ${def.meds.join(' 또는 ')}이 필요해요`;
    if (i.medToday) return '💊 오늘은 벌써 약을 먹었어요. 푹 자요';
    i.medToday = true;
    i.medDays++;
    State.save();
    return null;
  },

  // 동네에서 가끔 나오는 증상 말 (말, 멈춰야 하는지)
  symptomLine() {
    const def = this.def(), d = State.data;
    if (def) return { text: pick(def.lines), stop: def.stop && Math.random() < 0.5 };
    if (d.cast) return { text: pick(['깁스가 간질간질해요', '조심조심…']), stop: false };
    return null;
  },
};
