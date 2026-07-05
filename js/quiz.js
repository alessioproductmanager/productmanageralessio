window.App = window.App || {};

/**
 * Onboarding quiz — three "boarding pass" steps:
 *  1) Which of these does NOT have a Disney park (knowledge check)
 *  2) Which of these DOES have a Disney park (knowledge check, inverted)
 *  3) "Lesson 1": which destinations has the manager already worked with
 *     (personalization — no right/wrong answer, feeds the dashboard)
 * Completing it (or skipping it) unlocks the main tool and is remembered
 * in the mock DB so returning visitors aren't forced through it again.
 */
App.Quiz = {
  step: 0,

  steps: [
    {
      type: 'single',
      code: 'TKT-001 · KNOWLEDGE CHECK',
      question: 'Which of these does NOT have a Disney park?',
      hint: 'One of these four is a distractor.',
      options: [
        { label: 'Paris', correct: false },
        { label: 'Orlando', correct: false },
        { label: 'Barcelona', correct: true },
        { label: 'Tokyo', correct: false },
      ],
    },
    {
      type: 'single',
      code: 'TKT-002 · KNOWLEDGE CHECK',
      question: 'Which of these DOES have a Disney park?',
      hint: 'Same game, the other way round.',
      options: [
        { label: 'Rome', correct: false },
        { label: 'Berlin', correct: false },
        { label: 'Hong Kong', correct: true },
        { label: 'Amsterdam', correct: false },
      ],
    },
    {
      type: 'multi',
      code: 'TKT-003 · LESSON 1',
      question: "Where have you already worked with?",
      hint: 'Pick any that apply — this personalizes your dashboard. No wrong answers here.',
      options: [
        { label: 'Disneyland Paris', key: 'paris' },
        { label: 'Walt Disney World Orlando', key: 'orlando' },
        { label: 'Tokyo Disney Resort', key: 'tokyo' },
        { label: 'Disneyland Anaheim', key: 'anaheim' },
        { label: 'Hong Kong Disneyland', key: 'hongkong' },
        { label: 'Shanghai Disney Resort', key: 'shanghai' },
      ],
    },
  ],

  init() {
    const db = App.DB.load();
    if (db.quiz.completed) {
      this._enterApp();
      return;
    }
    this.step = 0;
    this.score = 0;
    this._multiSelection = new Set();
    this._renderStep();
  },

  skip() {
    const db = App.DB.load();
    db.quiz.completed = true;
    App.DB.save();
    this._enterApp();
  },

  _renderStep() {
    const s = this.steps[this.step];
    const host = document.getElementById('boarding-pass-host');

    document.querySelectorAll('.stub-progress .stub').forEach((el, i) => {
      el.classList.toggle('done', i < this.step);
      el.classList.toggle('current', i === this.step);
    });

    const optionsHtml = s.options.map((opt, i) => {
      if (s.type === 'multi') {
        return `<button class="bp-option multi" data-i="${i}" onclick="App.Quiz._toggleMulti(${i})">${opt.label}<span class="check-icon"></span></button>`;
      }
      return `<button class="bp-option" data-i="${i}" onclick="App.Quiz._answerSingle(${i})">${opt.label}</button>`;
    }).join('');

    host.innerHTML = `
      <div class="boarding-pass">
        <div class="bp-main">
          <div class="bp-eyebrow">
            <span class="bp-code">${s.code}</span>
            <span class="bp-code">SEAT PM-${this.step + 1}</span>
          </div>
          <div class="bp-question">${s.question}<span class="hint">${s.hint}</span></div>
          <div class="bp-options">${optionsHtml}</div>
          ${s.type === 'multi' ? `
            <div class="bp-footer">
              <button class="btn btn-primary" onclick="App.Quiz._confirmMulti()">Continue</button>
            </div>` : ''}
        </div>
        <div class="bp-divider"></div>
        <div class="bp-stub">
          <span class="stub-label">TIQETS HUB</span>
          <div class="bp-barcode">${this._barcode()}</div>
        </div>
      </div>
    `;
  },

  _barcode() {
    return Array.from({ length: 14 }, () =>
      `<span style="height:${8 + Math.round(Math.random() * 26)}px"></span>`
    ).join('');
  },

  _answerSingle(i) {
    const s = this.steps[this.step];
    const buttons = document.querySelectorAll('#boarding-pass-host .bp-option');
    buttons.forEach(b => (b.disabled = true));

    const chosen = s.options[i];
    buttons[i].classList.add(chosen.correct ? 'correct' : 'incorrect');
    if (!chosen.correct) {
      const correctIdx = s.options.findIndex(o => o.correct);
      buttons[correctIdx].classList.add('correct');
    } else {
      this.score++;
    }

    const pass = document.querySelector('.boarding-pass');
    const stamp = document.createElement('div');
    stamp.className = `bp-stamp ${chosen.correct ? 'pass' : 'fail'}`;
    stamp.textContent = chosen.correct ? 'VALIDATED' : 'DECLINED';
    pass.appendChild(stamp);

    setTimeout(() => this._advance(), 1100);
  },

  _toggleMulti(i) {
    const btn = document.querySelector(`#boarding-pass-host .bp-option[data-i="${i}"]`);
    if (this._multiSelection.has(i)) {
      this._multiSelection.delete(i);
      btn.classList.remove('selected');
    } else {
      this._multiSelection.add(i);
      btn.classList.add('selected');
    }
  },

  _confirmMulti() {
    const s = this.steps[this.step];
    const visited = Array.from(this._multiSelection).map(i => s.options[i].key);
    const db = App.DB.load();
    db.quiz.visitedVenueIds = visited;
    App.DB.save();
    this._advance();
  },

  _advance() {
    this.step++;
    if (this.step >= this.steps.length) {
      const db = App.DB.load();
      db.quiz.completed = true;
      db.quiz.score = this.score;
      App.DB.save();
      this._enterApp();
      return;
    }
    this._renderStep();
  },

  _enterApp() {
    document.getElementById('onboarding-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    App.Dashboard.init();
  },
};
