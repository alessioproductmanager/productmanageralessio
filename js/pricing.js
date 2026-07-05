window.App = window.App || {};

/**
 * Rule-based pricing suggestions — not a real ML model. Grounded in a few
 * well-documented real-world practices (see README): museums and theme
 * parks already vary price by date, weather and nearby events; venues
 * tend to frame these moves as off-peak savings rather than surcharges,
 * because that framing is what visitors accept; and advance purchase is
 * usually rewarded rather than penalized.
 */
App.Pricing = {
  citation: 'Similar in spirit to how Disney already varies its own ticket prices by calendar date, and how venues like the Empire State Building adjust prices live using demand, weather and nearby events.',

  isIndoorLike(product) {
    return /dining|cirque|show|theatre|theater/i.test(`${product.name} ${product.tagline || ''}`);
  },

  explainSignals(weather, events, bookingWindow) {
    const lines = [];

    if (weather.isWet) {
      lines.push({ icon: '🌧️', text: 'Rain forecast. Outdoor tickets typically see softer demand in this window — indoor experiences (dining, shows) usually hold or gain.' });
    } else {
      lines.push({ icon: '☀️', text: 'Weather is favorable — no weather-driven adjustment needed.' });
    }

    const highImpact = events.find(e => e.impact === 'high');
    if (highImpact) {
      lines.push({ icon: '🎫', text: `${highImpact.name} nearby (${highImpact.distanceKm} km) — expect a visitor spike, the kind of window venues usually reserve for premium-only availability.` });
    } else if (events.length) {
      lines.push({ icon: '📍', text: `${events[0].name} nearby (${events[0].distanceKm} km) — a moderate uplift is plausible, worth monitoring rather than acting on yet.` });
    }

    if (bookingWindow === 'far') {
      lines.push({ icon: '🗓️', text: 'Booked a month or more out — this is where a modest early-bird saving locks in demand without giving up much margin.' });
    } else if (bookingWindow === 'soon') {
      lines.push({ icon: '⏱️', text: 'Booked within days — this close to the date, most venues hold price steady or firm it up rather than discount further.' });
    }

    return lines;
  },

  /** Computes one concrete suggested price for the product currently open in the editor. */
  computeSuggestion(product, weather, events, bookingWindow) {
    let deltaPct = 0;
    const reasons = [];
    const indoor = this.isIndoorLike(product);

    if (weather.isWet) {
      if (indoor) { deltaPct += 12; reasons.push('rain lifting indoor demand'); }
      else { deltaPct -= 8; reasons.push('rain softening outdoor demand'); }
    }

    const highImpact = events.find(e => e.impact === 'high');
    if (highImpact) { deltaPct += 15; reasons.push(`${highImpact.name} nearby`); }

    if (bookingWindow === 'far') { deltaPct -= 5; reasons.push('early-bird window'); }
    if (bookingWindow === 'soon' && !highImpact) { deltaPct += 0; } // hold steady, no reason needed

    deltaPct = Math.max(-20, Math.min(25, deltaPct));
    const newPrice = Math.round(product.price * (1 + deltaPct / 100));

    return {
      deltaPct,
      newPrice,
      headline: reasons.length
        ? `${deltaPct >= 0 ? '+' : ''}${deltaPct}% — ${reasons.join(', ')}`
        : 'No change suggested — current price already fits the context',
    };
  },
};
