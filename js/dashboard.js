window.App = window.App || {};

App.Dashboard = {
  currentKey: 'paris',
  currentWeather: { tempC: 20, condition: 'Clear', isWet: false, live: false },
  currentEvents: [],

  init() {
    const db = App.DB.load();
    this._populateDestinationSelector(db);
    document.getElementById('pricing-citation').textContent = App.Pricing.citation;
    document.getElementById('destination-selector')
      .addEventListener('change', (e) => this.loadDestination(e.target.value));
    document.getElementById('booking-window')
      .addEventListener('change', () => this._refreshPricingCard());

    App.OTA.render();
    App.ApiHealth.start();

    const startKey = db.quiz.visitedVenueIds[0] || 'paris';
    document.getElementById('destination-selector').value = startKey;
    this.loadDestination(startKey);
  },

  _populateDestinationSelector(db) {
    const sel = document.getElementById('destination-selector');
    const visited = new Set(db.quiz.visitedVenueIds || []);
    sel.innerHTML = Object.entries(db.destinations).map(([key, d]) => {
      const tag = visited.has(key) ? ' ★ your venue' : '';
      return `<option value="${key}">${d.cityName}${tag}</option>`;
    }).join('');
  },

  getBookingWindow() {
    const el = document.getElementById('booking-window');
    return el ? el.value : 'medium';
  },

  async loadDestination(key) {
    this.currentKey = key;
    const db = App.DB.load();
    const dest = db.destinations[key];

    document.getElementById('ctx-city-name').textContent = dest.cityName;
    document.getElementById('pricing-signals').innerHTML = '<p class="text-muted text-sm">Reading live weather and nearby events…</p>';

    const [weather, events] = await Promise.all([
      App.Weather.fetch(dest.lat, dest.lon),
      App.Events.fetchNearby(key),
    ]);
    this.currentWeather = weather;
    this.currentEvents = events;

    this._refreshPricingCard();
    App.Editor.renderGrid(key);
  },

  _refreshPricingCard() {
    const weather = this.currentWeather;
    const lines = App.Pricing.explainSignals(weather, this.currentEvents, this.getBookingWindow());

    document.getElementById('live-temp').textContent = `${weather.tempC}°C`;
    document.getElementById('weather-source').textContent = weather.live ? 'Live · Open-Meteo' : 'Fallback · live fetch failed';

    document.getElementById('pricing-signals').innerHTML = lines.map(l =>
      `<div class="signal-row"><span>${l.icon}</span><span>${l.text}</span></div>`
    ).join('');
  },
};
