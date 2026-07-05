window.App = window.App || {};

App.UI = {
  switchTab(tabId, btnEl) {
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const view = document.getElementById(tabId);
    if (view) view.classList.add('active');
    if (btnEl) btnEl.classList.add('active');
  },

  toast(message, tone = 'info') {
    let host = document.getElementById('toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toast-host';
      host.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2000;display:flex;flex-direction:column;gap:8px;';
      document.body.appendChild(host);
    }
    const colors = {
      info: { bg: '#0f172a', border: '#0ea5e9' },
      success: { bg: '#065f46', border: '#10b981' },
      error: { bg: '#7f1d1d', border: '#dc2626' },
    };
    const c = colors[tone] || colors.info;
    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = `background:${c.bg};color:#fff;border-left:3px solid ${c.border};padding:11px 16px;border-radius:8px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.25);animation:slideUpFade 0.25s ease;max-width:320px;`;
    host.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 0.25s ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 250);
    }, 3200);
  },

  timeNow() {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  },
};
