// 게임 상태 + 저장/불러오기

const FAST = /fast/.test(location.search); // index.html?fast : 테스트용으로 시간을 짧게

const TIME = {
  job: FAST ? 20 : 3 * 60,         // 아르바이트 시간
  art: FAST ? 30 : 30 * 60,        // 미술 체험관 최대 시간
  survive: FAST ? 60 : 3 * 60,     // 길을 잃었을 때 버텨야 하는 시간
  ask: FAST ? 5 : 30,              // "목이 말라요/배가 고파요" 말하는 간격
  faint: FAST ? 15 : 60,           // 무시하면 쓰러지는 시간
  lostText: 5,                     // "길을 잃었어요!" 뒤 물건 고르기까지
  ward: FAST ? 40 : 3 * 60,        // 사고 후 입원 시간
  drive: FAST ? 4 : 8,             // 택시 타고 가는 시간
  academy: FAST ? 15 : 60,         // 학원 수업 시간
  momWait: 5,                      // 집에 오고 엄마가 들어올 때까지
};

const TAXI_FEE = 10;
const ACCIDENT_CHANCE = 0.25; // 택시 사고 확률 (4번 중 1번쯤)

// 달력에 적을 수 있는 할 일
const TASKS = {
  school: '🏫 학교 가기',
  homework: '📝 숙제하기',
  jobs: '💼 아르바이트 5개',
  catfeed: '🐱 고양이 밥 주기',
  wash: '🧼 씻기',
  academy_math: '➗ 수학 학원',
  academy_piano: '🎹 피아노 학원',
  academy_english: '🔤 영어 학원',
  academy_soccer: '⚽ 축구 학원',
  academy_basketball: '🏀 농구 학원',
  academy_ballet: '🩰 발레 학원',
  academy_craft: '✂️ 만들기 학원',
  academy_art: '🎨 미술 학원',
};

// 날씨 (날마다 바뀜, TV 예보와 같음)
const WEATHER = [['☀️', '맑음', 24, 'sun'], ['⛅', '구름 많음', 21, 'cloud'], ['🌧️', '비', 17, 'rain'], ['🌈', '비 온 뒤 무지개', 20, 'rainbow'], ['❄️', '눈', -1, 'snow']];
function weatherFor(day) {
  const r = seeded(day * 7919 + 104729);
  r(); r(); // 처음 값들은 작게 나와서 버림
  return WEATHER[Math.floor(r() * WEATHER.length)];
}
function todayWeather() { return weatherFor(State.data.day)[3]; }

const CALL_CUT = 30;       // 엄마랑 통화하면 줄어드는 조난 시간(초)
const CALL_COOLDOWN = 30;  // 다시 통화할 수 있을 때까지(초)

const JOBS_PER_DAY = 5;
const MAX_CATS = 3;
const DOCTOR_FEE = 30;
const SALARY = 50;
const SALARY_DAYS = 3;
const SAVE_KEY = 'myjob_save_v1';

const State = {
  data: null,

  fresh() {
    return {
      character: null,
      coins: 0,
      day: 1,
      jobsToday: 0,
      nightNotice: false,
      town: 1,          // 지금 있는 동네
      maxTown: 1,       // 열린 동네 중 가장 큰 번호
      unlocked: { 1: 1 }, // 동네별 열린 가게 수
      earned: {},       // 가게별 번 코인 ("동네-번호")
      bag: [],          // 가방 속 물건
      x: 60,            // 동네에서 캐릭터 위치
      sick: false,      // 캐릭터가 아픈지
      washed: false,    // 오늘 씻었는지 (병에 덜 걸림)
      stickers: 0,      // 학교 칭찬 스티커
      schoolDay: 0,     // 마지막으로 학교 간 날
      cats: [],         // 키우는 고양이 (최대 3마리)
      look: null,       // 지금 입은 옷 (null이면 처음 고른 캐릭터 옷)
      closet: null,     // 가진 옷 { top: [...], bottom: [...], shoes: [...], hat: [...] }
      schedule: {},     // 달력 일정 { 날짜: [할 일...] }
      doneDay: 0,       // done 목록이 어느 날 것인지
      done: [],         // 오늘 한 일
      momDay: 0,        // 엄마가 마지막으로 확인한 날
      homework: [],     // 받은 숙제 (학원 과목)
      friends: {},      // 병원에서 만난 환자들 친한 마음 { 이름: 0~100 }
      illness: null,    // 지금 걸린 병 { type, day, medDays, medToday }
      cast: null,       // 깁스 { limb: 'arm'|'leg', until: 풀 수 있는 날 }
      wet: 0,           // 비 맞은 정도 (100 감기, 200 독감)
      dirtyHands: false, // 화장실 다녀와서 손 안 씻음
    };
  },

  load() {
    try {
      const s = localStorage.getItem(SAVE_KEY);
      this.data = s ? Object.assign(this.fresh(), JSON.parse(s)) : this.fresh();
    } catch (e) {
      this.data = this.fresh();
    }
  },

  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { /* 저장 불가 */ }
  },

  reset() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 무시 */ }
    this.data = this.fresh();
  },

  // 오늘 한 일 기록 (달력 일정 확인용)
  markDone(task) {
    const d = this.data;
    if (d.doneDay !== d.day) { d.doneDay = d.day; d.done = []; }
    if (!d.done.includes(task)) d.done.push(task);
    this.save();
  },
  isDone(task) {
    const d = this.data;
    return d.doneDay === d.day && d.done.includes(task);
  },
  unfinishedToday() {
    const d = this.data;
    return (d.schedule[d.day] || []).filter(t => !this.isDone(t));
  },

  closet() {
    const d = this.data;
    if (!d.closet) {
      const base = CHAR_LOOKS[d.character] || CHAR_LOOKS.boy_suit;
      d.closet = { top: [base.top, 'blue_tee', 'raincoat'], bottom: [base.bottom, 'shorts'], shoes: [base.shoes], hat: ['none'] };
      for (const k of ['top', 'bottom']) d.closet[k] = [...new Set(d.closet[k])];
    }
    return d.closet;
  },

  isNight() {
    return this.data.jobsToday >= JOBS_PER_DAY;
  },
};
