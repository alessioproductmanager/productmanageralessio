window.App = window.App || {};

/**
 * Channel connections (mock OAuth) and per-product push. Pushing now
 * happens from inside the product editor — "push what I just changed"
 * — rather than a separate blind "sync everything" button. This module
 * still owns the connection state and the shared activity feed shown on
 * the Channel Sync tab.
 */
App.OTA = {
  render() {
    const db = App.DB.load();
    const grid = document.getElementById('ota-grid');
    grid.innerHTML = db.otaChannels.map(ch => `
      <div class="ota-card">
        <div class="ota-name">${ch.name}</div>
        <div class="ota-status ${ch.connected ? 'connected' : 'disconnected'}">
          ${ch.connected ? '● Connected' : '○ Not connected'}
        </div>
        ${ch.isHome
          ? `<span class="text-sm text-muted">Home platform</span>`
          : `<button class="btn ${ch.connected ? 'btn-outline' : 'btn-secondary'} btn-sm"
                     data-ota-id="${ch.id}" onclick="App.OTA.toggleConnect('${ch.id}')">
               ${ch.connected ? 'Disconnect' : 'Connect (mock OAuth)'}
             </button>`
        }
      </div>
    `).join('');
    this.renderActivity();
  },

  async toggleConnect(id) {
    const db = App.DB.load();
    const channel = db.otaChannels.find(c => c.id === id);
    if (!channel) return;
    const btn = document.querySelector(`[data-ota-id="${id}"]`);

    if (channel.connected) {
      channel.connected = false;
      App.DB.save();
      this.render();
      App.UI.toast(`Disconnected from ${channel.name}.`, 'info');
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Connecting…'; }
    await new Promise(r => setTimeout(r, 1000)); // mock OAuth round trip
    channel.connected = true;
    App.DB.save();
    this.render();
    App.UI.toast(`Connected to ${channel.name} (mock OAuth).`, 'success');
  },

  connectedChannels() {
    return App.DB.load().otaChannels.filter(c => c.connected);
  },

  /** Pushes a single product's current state to every connected channel. */
  async pushProduct(destKey, product, onStep) {
    const channels = this.connectedChannels();
    if (!channels.length) {
      App.UI.toast('Connect at least one channel first.', 'error');
      return false;
    }
    for (const ch of channels) {
      await new Promise(r => setTimeout(r, 400));
      if (onStep) onStep(ch);
    }
    const db = App.DB.load();
    App.DB.logActivity({
      user: db.currentUser,
      action: 'pushed',
      productName: product.name,
      destKey,
      channels: channels.map(c => c.name),
    });
    this.renderActivity();
    return true;
  },

  renderActivity() {
    const feed = document.getElementById('activity-feed');
    if (!feed) return;
    const db = App.DB.load();
    if (!db.activityLog.length) {
      feed.innerHTML = '<p class="text-sm text-muted">No activity yet — edits and pushes made from the Product Hub will show up here.</p>';
      return;
    }
    feed.innerHTML = db.activityLog.map(entry => `
      <div class="activity-row">
        <span class="activity-avatar">${entry.user ? entry.user.avatar : '👤'}</span>
        <div>
          <div class="text-sm"><strong>${entry.user ? entry.user.name : 'Someone'}</strong> ${entry.action} <strong>${entry.productName}</strong></div>
          <div class="text-sm text-muted">${entry.channels && entry.channels.length ? `→ ${entry.channels.join(', ')} · ` : ''}${entry.time}</div>
        </div>
      </div>
    `).join('');
  },
};
