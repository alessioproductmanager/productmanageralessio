window.App = window.App || {};

/**
 * API Monitoring — simulated telemetry for the connection to the Disney
 * ticketing core. There is obviously no real Disney backend behind this
 * prototype, so every number here is generated client-side and labeled
 * "Simulated" in the UI rather than presented as a live integration.
 */
App.ApiHealth = {
  _timer: null,
  _events: [
    { text: 'Booking confirmed — DIS-PAR-01', level: 'ok' },
    { text: 'Booking confirmed — DIS-ORL-02', level: 'ok' },
    { text: 'Webhook retry — Viator timeout (attempt 2/3)', level: 'warn' },
    { text: 'Booking confirmed — DIS-TYO-01', level: 'ok' },
    { text: 'Rate limit warning — GetYourGuide feed', level: 'warn' },
    { text: 'Webhook failed — Klook endpoint unreachable', level: 'err' },
    { text: 'Booking confirmed — DIS-ANH-01', level: 'ok' },
    { text: 'Price sync completed — Hong Kong cluster', level: 'ok' },
  ],

  start() {
    this._tick();
    this._timer = setInterval(() => this._tick(), 2200);
  },

  stop() {
    if (this._timer) clearInterval(this._timer);
  },

  _tick() {
    const latency = 90 + Math.round(Math.random() * 160);
    const successRate = (98.4 + Math.random() * 1.5).toFixed(2);

    const latencyEl = document.getElementById('health-latency');
    const successEl = document.getElementById('health-success-rate');
    if (latencyEl) latencyEl.textContent = `${latency} ms`;
    if (successEl) successEl.textContent = `${successRate}%`;

    if (Math.random() < 0.6) {
      const ev = this._events[Math.floor(Math.random() * this._events.length)];
      this._logLine(ev.text, ev.level);
    }
  },

  _logLine(text, level) {
    const log = document.getElementById('health-log');
    if (!log) return;
    const time = App.UI.timeNow();
    const cls = level === 'ok' ? 'log-ok' : level === 'warn' ? 'log-warn' : 'log-err';
    const tag = level === 'ok' ? 'OK' : level === 'warn' ? 'WARN' : 'ERROR';
    log.insertAdjacentHTML('afterbegin', `<div class="log-line"><span class="log-time">${time}</span><span class="${cls}">[${tag}]</span><span>${text}</span></div>`);
    while (log.children.length > 24) log.removeChild(log.lastChild);
  },
};
