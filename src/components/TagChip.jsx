import { cx } from './ui';

/** Palette offered in the tag drawer. Every colour has at least 4.5:1 contrast with white text. */
export const TAG_PALETTE = [
  { name: 'Blue', hex: '#1D4ED8' }, { name: 'Indigo', hex: '#4338CA' }, { name: 'Violet', hex: '#5B3CC4' },
  { name: 'Pink', hex: '#BE185D' }, { name: 'Red', hex: '#A3261B' }, { name: 'Orange', hex: '#C2410C' },
  { name: 'Amber', hex: '#A16207' }, { name: 'Olive', hex: '#4D5B1F' }, { name: 'Green', hex: '#17633A' },
  { name: 'Teal', hex: '#0E7490' }, { name: 'Slate', hex: '#475569' }, { name: 'Graphite', hex: '#1F2937' },
];

export const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v || '');
export const colorName = (hex) => TAG_PALETTE.find((p) => p.hex.toLowerCase() === (hex || '').toLowerCase())?.name || 'Custom';

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** White or ink text, whichever reads better on the colour. */
export function textOn(hex) {
  if (!isHex(hex)) return '#FFFFFF';
  const L = luminance(hex);
  return ratio(L, 1) >= ratio(L, luminance('#0F1B2D')) ? '#FFFFFF' : '#0F1B2D';
}
/** Solid chip (white or ink text on the colour). */
export const solidStyle = (hex) => ({ backgroundColor: isHex(hex) ? hex : '#475569', color: textOn(hex) });

/**
 * Soft chip: a light tint of the colour with readable tinted text. Mixing with the theme
 * foreground keeps contrast in both light and dark mode.
 */
export const chipStyle = (hex) => {
  const c = isHex(hex) ? hex : '#475569';
  return {
    backgroundColor: `color-mix(in srgb, ${c} 13%, transparent)`,
    color: `color-mix(in srgb, ${c} 70%, hsl(var(--foreground)))`,
    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${c} 24%, transparent)`,
  };
};

/** A tag rendered as a soft coloured chip with a dot. */
export default function TagChip({ tag, size = 'sm', className }) {
  if (!tag) return null;
  return (
    <span style={chipStyle(tag.color)}
      className={cx('inline-flex max-w-full items-center gap-1.5 truncate rounded-md font-medium', size === 'xs' ? 'h-5 px-1.5 text-[11px]' : 'h-6 px-2 text-xs', className)}>
      <span className="size-1.5 flex-none rounded-full" style={{ backgroundColor: isHex(tag.color) ? tag.color : '#475569' }} aria-hidden="true" />
      <span className="truncate">{tag.label}</span>
    </span>
  );
}
