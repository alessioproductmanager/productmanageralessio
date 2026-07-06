window.App = window.App || {};

/**
 * Live World Cup fixtures via football-data.org (free tier covers the
 * FIFA World Cup under competition code "WC"). Falls back to a small
 * mocked fixture list when no token is configured or the request fails.
 * Every kickoff shown to the user is converted to the destination's own
 * IANA timezone via App.TZ — never the browser's.
 */
App.WorldCup = {
  lastError: null,

  async fetchUpcoming(dest) {
    const token = App.CONFIG.FOOTBALL_DATA_TOKEN;
    if (!token) { this.lastError = null; return this._mockFor(dest); }

    try {
      const from = new Date();
      const to = new Date(Date.now() + 10 * 24 * 3600 * 1000);
      const fmt = (d) => d.toISOString().slice(0, 10);
      const url = `https://api.football-data.org/v4/competitions/${App.CONFIG.TOURNAMENT_CODE}/matches?dateFrom=${fmt(from)}&dateTo=${fmt(to)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      let res;
      try {
        res = await fetch(url, { headers: { 'X-Auth-Token': token }, signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${res.statusText}${body ? ' — ' + body.slice(0, 200) : ''}`);
      }
      const data = await res.json();

      if (!data.matches || !data.matches.length) {
        this.lastError = null; // token works fine, there just are no matches in this window
        return this._mockFor(dest, true);
      }

      const matches = data.matches.map(m => ({
        home: m.homeTeam?.name || 'TBD',
        away: m.awayTeam?.name || 'TBD',
        kickoffUtc: new Date(m.utcDate),
        live: true,
      }));
      this.lastError = null;
      return this._pickRelevant(matches, dest);
    } catch (e) {
      // A generic "Failed to fetch" with no HTTP status usually means CORS blocked the
      // request — very common when opening this file directly (file:// → Origin: null).
      // Serving it (`npx serve`) instead of double-clicking it often fixes this.
      const reason = e.name === 'AbortError' ? 'Request timed out after 8s'
        : e.message === 'Failed to fetch' ? 'Network/CORS error — try serving via `npx serve` instead of opening the file directly'
        : e.message;
      this.lastError = reason;
      console.warn('World Cup fetch failed, using mock fixtures. Reason:', reason);
      return this._mockFor(dest);
    }
  },

  _mockFor(dest, tokenWorkedButNoMatches) {
    const today = new Date();
    const mock = [
      { home: 'France', away: 'Brazil', daysOut: 1, hour: 21, minute: 0 },
      { home: 'United States', away: 'Argentina', daysOut: 2, hour: 20, minute: 0 },
      { home: 'Japan', away: 'Germany', daysOut: 4, hour: 19, minute: 0 },
    ].map(m => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + m.daysOut);
      return {
        home: m.home, away: m.away, live: false,
        kickoffUtc: App.TZ.zonedTimeToUtc(d.getFullYear(), d.getMonth() + 1, d.getDate(), m.hour, m.minute, dest.timezone),
      };
    });
    const picked = this._pickRelevant(mock, dest);
    if (picked) picked.noRealMatchesInWindow = !!tokenWorkedButNoMatches;
    return picked;
  },

  _pickRelevant(matches, dest) {
    if (!matches.length) return null;
    const relevant = matches.find(m => m.home === dest.countryTeam || m.away === dest.countryTeam);
    const chosen = relevant || matches[0];
    return {
      home: chosen.home,
      away: chosen.away,
      kickoffUtc: chosen.kickoffUtc,
      relevant: !!relevant,
      live: chosen.live,
      kickoffLabel: App.TZ.formatInZone(chosen.kickoffUtc, dest.timezone),
      timezone: dest.timezone,
    };
  },
};
