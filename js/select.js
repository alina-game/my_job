// 캐릭터 고르기 (처음 시작할 때)

Game.scenes.select = {
  enter() {
    this.choice = null;
    const done = h('button', { class: 'btn green', style: 'font-size:28px;padding:14px 48px', disabled: true, onclick: () => this.finish() }, '완료하기');
    const cards = CHARACTERS.map(c => {
      const cv = h('canvas', { width: 180, height: 220 });
      drawCharacter(cv.getContext('2d'), c.id, 90, 205, 1.8);
      const card = h('div', { class: 'char-card' }, cv, h('div', {}, c.label));
      card.addEventListener('click', () => {
        this.choice = c.id;
        cards.forEach(k => k.classList.remove('selected'));
        card.classList.add('selected');
        done.disabled = false;
      });
      return card;
    });
    Game.ui.append(h('div', { class: 'select-wrap' },
      h('div', { class: 'select-title' }, '💼 나의 직업'),
      h('div', { style: 'font-size:22px;font-weight:bold;color:#444' }, '캐릭터를 골라 주세요!'),
      h('div', { class: 'select-cards' }, cards),
      done));
  },

  finish() {
    if (!this.choice) return;
    State.data.character = this.choice;
    State.save();
    Game.go('town');
    toast('🏪 먼저 첫 번째 가게에서 아르바이트를 해 봐요!', 3500);
  },

  draw(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ffe5f1');
    g.addColorStop(1, '#d6ecff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  },
};
