import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Teach tailwind-merge about Harbor's custom tokens so conflicts resolve correctly.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: [{ shadow: ['xs', 'card', 'raised', 'pop', 'drawer', 'inset-top'] }],
      'font-size': [{ text: ['2xs'] }],
    },
  },
});

/** Merge class names, resolving Tailwind conflicts (shadcn/ui helper). */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
