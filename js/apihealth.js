window.App = window.App || {};

/**
 * Per-product API health, split into the four call types a real
 * ticketing integration actually makes: Availability (can we still sell
 * this?), Reservation (hold a slot), Booking (confirm + issue barcode),
 * Cancellation (refund/void). All numbers are simulated client-side and
 * labeled "demo only" — there is no real Disney backend behind this.
 */
App.ApiHealth = {
  categories: ['Availability', 'Reservation', 'Booking', 'Cancellation'],
  baseLatency: { Availability: 90, Reservation: 160, Booking: 220, Cancellation: 170 },
  _timer: null,
  _destKey: null,

  renderForDestination(destKey) {
    this._destKey = destKey;
    this._tick();
    if (!this._timer) this._timer = setInterval(() => this._tick(), 2200);
  },

  _tick() {
    const db = App.DB.load();
    const dest = db.destinations[this._destKey];
    if (!dest) return;

    const rows = dest.products.map(p => {
      const cells = this.categories.map(cat => this._simulateCell(p, cat));
      return { product: p, cells };
    });

    this._renderTable(rows);
    this._renderAggregate(rows);
    if (Math.random() < 0.5) this._maybeLog(rows);
  },

  _simulateCell(product, category) {
    const base = this.baseLatency[category];
    const latency = base + Math.round(Math.random() * base * 0.6);
    const roll = Math.random();
    // Booking and Cancellation are write operations — slightly more failure-prone in this simulation.
    const failThreshold = (category === 'Booking' || category === 'Cancellation') ? 0.06 : 0.03;
    const warnThreshold = failThreshold + 0.08;
    const status = roll < failThreshold ? 'down' : roll < warnThreshold ? 'warn' : 'ok';
    return { category, latency, status };
  },

  _renderTable(rows) {
    const host = document.getElementById('health-grid');
    if (!host) return;
    host.innerHTML = `
      <table class="data-table health-table">
        <thead>
          <tr>
            <th>Product</th>
            ${this.categories.map(c => `<th>${c}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td><span class="mono text-sm text-muted">${r.product.id}</span><br><strong class="text-sm">${r.product.name}</strong></td>
              ${r.cells.map(c => `
                <td>
                  <span class="dot dot-${c.status}"></span>
                  <span class="text-sm">${c.latency}ms</span>
                </td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  _renderAggregate(rows) {
    const allCells = rows.flatMap(r => r.cells);
    if (!allCells.length) return;
    const avgLatency = Math.round(allCells.reduce((s, c) => s + c.latency, 0) / allCells.length);
    const okCount = allCells.filter(c => c.status === 'ok').length;
    const successRate = ((okCount / allCells.length) * 100).toFixed(1);

    const latencyEl = document.getElementById('health-latency');
    const successEl = document.getElementById('health-success-rate');
    if (latencyEl) latencyEl.textContent = `${avgLatency} ms`;
    if (successEl) successEl.textContent = `${successRate}%`;
  },

  _maybeLog(rows) {
    const troubled = rows.flatMap(r => r.cells.filter(c => c.status !== 'ok').map(c => ({ ...c, product: r.product })));
    if (!troubled.length) return;
    const pick = troubled[Math.floor(Math.random() * troubled.length)];
    const level = pick.status === 'down' ? 'err' : 'warn';
    const verb = pick.status === 'down' ? 'failed' : 'degraded';
    this._logLine(`${pick.product.id} · ${pick.category} — ${verb} (${pick.latency}ms)`, level);
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
