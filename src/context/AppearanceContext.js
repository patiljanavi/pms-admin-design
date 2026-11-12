import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_FONT, fontById } from '../config';

/** Adds the Google Fonts stylesheet for a font once (no-op if already added). */
export function loadFont(font) {
  const id = `gf-${font.id}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${font.google}&display=swap`;
  document.head.appendChild(link);
}

/** Points the app's font variables (used by Tailwind's font-sans / font-mono) at a font. */
export function applyFont(font) {
  const root = document.documentElement.style;
  root.setProperty('--font-sans', font.sans);
  root.setProperty('--font-mono', font.monoStack);
}

const AppearanceContext = createContext(null);
const KEY = 'harbor.appearance';
const DEFAULTS = { v: 2, font: DEFAULT_FONT, tabular: true, theme: 'system', density: 'comfortable' };

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (saved.v !== DEFAULTS.v) delete saved.font; // v2 redesign: move everyone to the new default typeface once
    return { ...DEFAULTS, ...saved, v: DEFAULTS.v };
  }
  catch { return { ...DEFAULTS }; }
}

const systemDark = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

/**
 * Holds appearance preferences (font, number style, colour theme), applies them to the page
 * and saves them on this device. theme: 'light' | 'dark' | 'system'.
 */
export function AppearanceProvider({ children }) {
  const [prefs, setPrefs] = useState(read);
  const [osDark, setOsDark] = useState(systemDark);

  // Follow the OS setting while theme = 'system'
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!m) return undefined;
    const h = () => setOsDark(m.matches);
    m.addEventListener('change', h);
    return () => m.removeEventListener('change', h);
  }, []);

  const resolvedTheme = prefs.theme === 'system' ? (osDark ? 'dark' : 'light') : prefs.theme;

  useEffect(() => {
    const font = fontById(prefs.font);
    loadFont(font);
    applyFont(font);
    const root = document.documentElement;
    root.classList.toggle('tabular-on', !!prefs.tabular);
    root.dataset.density = prefs.density;
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {}
  }, [prefs]);

  useEffect(() => {
    const root = document.documentElement;
    // Avoid every element animating its colours while the theme flips
    root.classList.add('[&_*]:!transition-none');
    root.classList.toggle('dark', resolvedTheme === 'dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolvedTheme === 'dark' ? '#111318' : '#ffffff');
    const t = setTimeout(() => root.classList.remove('[&_*]:!transition-none'), 0);
    return () => clearTimeout(t);
  }, [resolvedTheme]);

  const value = useMemo(() => ({
    fontId: prefs.font,
    font: fontById(prefs.font),
    tabular: prefs.tabular,
    theme: prefs.theme,
    resolvedTheme,
    density: prefs.density,
    setFont: (id) => setPrefs((p) => ({ ...p, font: id })),
    setTabular: (on) => setPrefs((p) => ({ ...p, tabular: on })),
    setTheme: (theme) => setPrefs((p) => ({ ...p, theme })),
    toggleTheme: () => setPrefs((p) => ({ ...p, theme: resolvedTheme === 'dark' ? 'light' : 'dark' })),
    setDensity: (density) => setPrefs((p) => ({ ...p, density })),
    // Resets typography only; the colour theme has its own control.
    reset: () => setPrefs((p) => ({ ...p, font: DEFAULTS.font, tabular: DEFAULTS.tabular })),
  }), [prefs, resolvedTheme]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export const useAppearance = () => useContext(AppearanceContext);
