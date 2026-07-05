window.App = window.App || {};

/**
 * Opening hours are representative baselines (see README) — real Disney
 * parks adjust hours by season and event days, but a fixed daily window
 * is enough to answer the question that actually matters for pricing:
 * "does this signal even land while the gates are open?" A rainy
 * afternoon or a match kickoff outside opening hours has much less
 * pricing relevance than one during the visit window.
 */
App.Hours = {
  _toMinutes(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  },

  isOpenAtMinutes(dest, minutesSinceMidnight) {
    if (!dest?.openingHours) return true; // unknown hours — don't block pricing logic on it
    const open = this._toMinutes(dest.openingHours.open);
    const close = this._toMinutes(dest.openingHours.close);
    return minutesSinceMidnight >= open && minutesSinceMidnight <= close;
  },

  isOpenNow(dest) {
    if (!dest?.timezone) return true;
    const now = App.TZ.nowInZone(dest.timezone);
    return this.isOpenAtMinutes(dest, now.hour * 60 + now.minute);
  },

  /** Is the park open at the moment a given absolute instant (e.g. a match kickoff) occurs, in the destination's own timezone? */
  isOpenAt(dest, date) {
    if (!dest?.timezone) return true;
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: dest.timezone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit',
    }).formatToParts(date).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
    return this.isOpenAtMinutes(dest, Number(parts.hour) * 60 + Number(parts.minute));
  },

  statusLabel(dest) {
    if (!dest?.openingHours) return 'Hours unknown';
    return this.isOpenNow(dest) ? 'Open now' : 'Closed now';
  },
};
