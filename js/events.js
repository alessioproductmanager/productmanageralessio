window.App = window.App || {};

/**
 * Mocked "nearby events" feed. A real build would call PredictHQ or
 * Ticketmaster's Discovery API; this returns a small fixed dataset per
 * destination so the pricing engine has something realistic to react to.
 * Clearly labeled as demo data in the UI — never presented as live.
 */
App.Events = {
  _data: {
    paris:    [{ name: 'Formula 1 Paris Weekend', distanceKm: 8,  impact: 'high' }],
    orlando:  [{ name: 'Pro Golf Championship — Lake Nona', distanceKm: 14, impact: 'medium' }],
    tokyo:    [{ name: 'Tokyo Game Show', distanceKm: 6, impact: 'high' }],
    anaheim:  [],
    hongkong: [{ name: 'Hong Kong Sevens Rugby', distanceKm: 11, impact: 'medium' }],
    shanghai: [],
  },

  async fetchNearby(destinationKey) {
    // Simulated network latency so the loading state is honest, not instant.
    await new Promise(r => setTimeout(r, 350));
    return this._data[destinationKey] || [];
  },
};
