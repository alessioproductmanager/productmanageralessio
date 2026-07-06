window.App = window.App || {};

/**
 * Real, live weather data from Open-Meteo (open, keyless API).
 * This is the one external call in the app that is genuinely live —
 * everything else that looks like a third-party integration
 * (events, OTA logins, API health) is explicitly mocked and labeled as such.
 */
App.Weather = {
  async fetch(lat, lon) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
      const data = await res.json();
      const code = data.current.weather_code;
      return {
        tempC: Math.round(data.current.temperature_2m),
        condition: this._describe(code),
        isWet: code >= 51 && code <= 99,
        live: true,
      };
    } catch (e) {
      console.warn('Weather fetch failed or timed out, using fallback values.', e);
      return { tempC: 20, condition: 'Clear', isWet: false, live: false };
    } finally {
      clearTimeout(timeout);
    }
  },

  _describe(code) {
    if (code === 0) return 'Clear sky';
    if (code <= 3) return 'Partly cloudy';
    if (code <= 49) return 'Fog';
    if (code <= 67) return 'Rain';
    if (code <= 77) return 'Snow';
    if (code <= 99) return 'Thunderstorm';
    return 'Unknown';
  },
};
