// Global theme initializer: dark-mode toggle + accent color picker
(function () {
  const root = document.documentElement; // we'll set data-theme on <html>

  function setTheme(theme) {
    const t = theme === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-theme', t);
    // For CSS vars override we rely on body[data-theme], mirror for robustness
    document.body.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch {}
  }

  function shadeHex(hex, percent) {
    // percent: -30 (darker) to +30 (lighter)
    try {
      const h = hex.replace('#','');
      const num = parseInt(h, 16);
      let r = (num >> 16) & 0xFF;
      let g = (num >> 8) & 0xFF;
      let b = num & 0xFF;
      const p = Math.max(-100, Math.min(100, percent)) / 100;
      r = Math.round(r + (p * (p < 0 ? r : (255 - r))));
      g = Math.round(g + (p * (p < 0 ? g : (255 - g))));
      b = Math.round(b + (p * (p < 0 ? b : (255 - b))));
      const toHex = (v) => v.toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch { return hex; }
  }

  function applyAccent(hex) {
    try {
      const accent = shadeHex(hex, -0.2 * 100); // ~20% darker
      root.style.setProperty('--primary', hex);
      root.style.setProperty('--accent', accent);
      localStorage.setItem('accent', hex);
    } catch {}
  }

  function initThemeControls() {
    try {
      // Load persisted theme
      const savedTheme = localStorage.getItem('theme') || 'light';
      setTheme(savedTheme);

      // Load persisted accent
      const savedAccent = localStorage.getItem('accent');
      if (savedAccent) applyAccent(savedAccent);

      // Wire up dark mode toggle if present
      const toggle = document.getElementById('darkModeToggle');
      if (toggle) {
        toggle.checked = (savedTheme === 'dark');
        toggle.addEventListener('change', () => setTheme(toggle.checked ? 'dark' : 'light'));
      }

      // Wire up accent swatches
      const swatches = document.querySelectorAll('.accent-swatch');
      swatches.forEach((btn) => {
        const color = btn.dataset.color;
        if (savedAccent && color.toLowerCase() === savedAccent.toLowerCase()) {
          btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
          swatches.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          applyAccent(color);
        });
      });
    } catch (e) {
      console.warn('Theme controls init failed:', e);
    }
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeControls);
  } else {
    initThemeControls();
  }

  // Expose for other modules if needed
  window.BBTheme = { setTheme, applyAccent };
})();