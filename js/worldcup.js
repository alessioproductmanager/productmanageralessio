window.App = window.App || {};

/**
 * Live World Cup fixtures via football-data.org (free tier covers the
 * FIFA World Cup under competition code "WC"). Falls back to a small
 * mocked fixture list — same honesty pattern as weather.js — when no
 * token is configured or the request fails (network/CORS/rate limit).
 *
 * Why this matters for pricing: a big match kicking off during typical
 * visiting hours tends to pull demand the *other* way from a nearby
 * concert — people stay home or go to a bar to watch rather than visit
 * a park. That is the opposite signal from "event nearby", so it gets
 * its own line rather than being folded into App.Events.
 */
App.WorldCup = {
  _mock: [
    { home: 'France', away: 'Brazil', kickoff: daysFromNowAt(1, 21, 0) },
    { home: 'United States', away: 'Argentina', kickoff: daysFromNowAt(2, 20, 0) },
    { home: 'Japan', away: 'Germany', kickoff: daysFromNowAt(4, 19, 0) },
  ],

  async fetchUpcoming(dest) {
    const token = App.CONFIG.FOOTBALL_DATA_TOKEN;
    if (!token) return this._mockFor(dest);

    try {
      const from = new Date();
      const to = new Date(Date.now() + 10 * 24 * 3600 * 1000);
      const fmt = (d) => d.toISOString().slice(0, 10);
      const url = `https://api.football-data.org/v4/competitions/${App.CONFIG.TOURNAMENT_CODE}/matches?dateFrom=${fmt(from)}&dateTo=${fmt(to)}`;
      const res = await fetch(url, { headers: { 'X-Auth-Token': token } });
      if (!res.ok) throw new Error(`football-data.org responded ${res.status}`);
      const data = await res.json();

      const matches = (data.matches || []).map(m => ({
        home: m.homeTeam?.name || 'TBD',
        away: m.awayTeam?.name || 'TBD',
        kickoff: new Date(m.utcDate),
        live: true,
      }));
      return this._pickRelevant(matches, dest, true);
    } catch (e) {
      console.warn('World Cup fetch failed, using mock fixtures.', e);
      return this._mockFor(dest);
    }
  },

  _mockFor(dest) {
    const list = this._mock.map(m => ({ ...m, live: false }));
    return this._pickRelevant(list, dest, false);
  },

  _pickRelevant(matches, dest, live) {
    if (!matches.length) return null;
    const relevant = matches.find(m => m.home === dest.countryTeam || m.away === dest.countryTeam);
    const chosen = relevant || matches[0];
    return {
      home: chosen.home, away: chosen.away, kickoff: chosen.kickoff,
      relevant: !!relevant, live,
    };
  },
};

function daysFromNowAt(days, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}
