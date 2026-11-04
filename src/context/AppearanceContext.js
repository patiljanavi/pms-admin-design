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

function read() {
  try { return { font: DEFAULT_FONT, tabular: true, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { font: DEFAULT_FONT, tabular: true }; }
}

/** Holds the chosen font and number style, applies them to the page and saves them on this device. */
export function AppearanceProvider({ children }) {
  const [prefs, setPrefs] = useState(read);

  useEffect(() => {
    const font = fontById(prefs.font);
    loadFont(font);
    applyFont(font);
    document.documentElement.classList.toggle('tabular-on', !!prefs.tabular);
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {}
  }, [prefs]);

  const value = useMemo(() => ({
    fontId: prefs.font,
    font: fontById(prefs.font),
    tabular: prefs.tabular,
    setFont: (id) => setPrefs((p) => ({ ...p, font: id })),
    setTabular: (on) => setPrefs((p) => ({ ...p, tabular: on })),
    reset: () => setPrefs({ font: DEFAULT_FONT, tabular: true }),
  }), [prefs]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export const useAppearance = () => useContext(AppearanceContext);
