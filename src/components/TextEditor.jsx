import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Ban, Bold, Braces, ChevronDown, Highlighter, Italic, List, ListOrdered,
  Search, Smile, Strikethrough, Type, Underline,
} from 'lucide-react';
import { ALL_EMOJIS, EMOJI_BY_CODE, EMOJI_CATEGORIES } from '../data/emojis';
import { contactShortcuts } from '../data/shortcodes';
import { cn } from 'lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { SimpleTooltip } from './ui/tooltip';

const RECENT_KEY = 'harbor.recentEmojis';
const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Toolbar options (same groups as a Quill toolbar)
const FONTS = [
  { value: 'sans', label: 'Sans Serif', css: () => getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() || 'sans-serif' },
  { value: 'serif', label: 'Serif', css: () => 'Georgia, "Times New Roman", serif' },
  { value: 'mono', label: 'Monospace', css: () => '"Courier New", ui-monospace, monospace' },
];
const HEADERS = [{ value: 'h1', label: 'Heading 1' }, { value: 'h2', label: 'Heading 2' }, { value: 'h3', label: 'Heading 3' }, { value: 'p', label: 'Normal' }];
const HEADER_PREVIEW = { h1: 'text-lg font-semibold', h2: 'text-md font-semibold', h3: 'text-base font-semibold', p: 'text-sm' };
const ALIGNS = [
  { cmd: 'justifyLeft', label: 'Align left', icon: AlignLeft },
  { cmd: 'justifyCenter', label: 'Align center', icon: AlignCenter },
  { cmd: 'justifyRight', label: 'Align right', icon: AlignRight },
  { cmd: 'justifyFull', label: 'Justify', icon: AlignJustify },
];
const COLORS = [
  '#000000', '#E60000', '#FF9900', '#FFFF00', '#008A00', '#0066CC', '#9933FF',
  '#FFFFFF', '#FACCCC', '#FFEBCC', '#FFFFCC', '#CCE8CC', '#CCE0F5', '#EBD6FF',
  '#BBBBBB', '#F06666', '#FFC266', '#FFFF66', '#66B966', '#66A3E0', '#C285FF',
  '#888888', '#A10000', '#B26B00', '#B2B200', '#006100', '#0047B2', '#6B24B2',
  '#444444', '#5C0000', '#663D00', '#666600', '#003700', '#002966', '#3D1466',
];

/** Typography for the editing area (and anywhere editor HTML is shown). Uses theme tokens, so it follows dark mode. */
const CONTENT_CLASS = cn(
  'te-content text-base leading-relaxed text-foreground outline-none',
  '[&_h1]:mb-2 [&_h1]:mt-1 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight',
  '[&_h2]:mb-1.5 [&_h2]:mt-1 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight',
  '[&_h3]:mb-1 [&_h3]:mt-1 [&_h3]:text-lg [&_h3]:font-semibold',
  '[&_p]:my-0.5 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5',
  '[&_blockquote]:my-1.5 [&_blockquote]:border-l-2 [&_blockquote]:border-line-strong [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
  '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
  '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em]',
  '[&_.te-field]:mx-0.5 [&_.te-field]:inline-flex [&_.te-field]:items-center [&_.te-field]:rounded [&_.te-field]:bg-brand-50 [&_.te-field]:px-1.5',
  '[&_.te-field]:font-mono [&_.te-field]:text-[0.85em] [&_.te-field]:font-medium [&_.te-field]:text-brand-700 [&_.te-field]:ring-1 [&_.te-field]:ring-inset [&_.te-field]:ring-brand-200',
);

/** Plain text from editor HTML (for tables, search and CSV). */
export function htmlToText(html = '') {
  return html.replace(/<br\s*\/?>/gi, ' ').replace(/<\/(p|div|h\d|li|blockquote)>/gi, ' ').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

const toHex = (c = '') => {
  const m = c.match(/\d+/g);
  if (!m || m.length < 3) return c;
  return `#${m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
};

/** Ghost icon button (size-8). Works as a Radix trigger (forwards ref + props). Mouse-down never steals the text selection. */
const ToolButton = forwardRef(function ToolButton({ label, active, expanded, children, className, onMouseDown, ...props }, ref) {
  return (
    <button ref={ref} type="button" aria-label={label} aria-pressed={expanded === undefined ? active ?? undefined : undefined}
      aria-expanded={expanded} {...props}
      onMouseDown={(e) => { e.preventDefault(); onMouseDown?.(e); }} /* keep the text selection */
      className={cn('inline-flex h-8 min-w-8 flex-none items-center justify-center gap-0.5 rounded-md px-1.5 text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:shrink-0',
        'data-[state=open]:bg-accent data-[state=open]:text-foreground',
        active && 'bg-accent text-foreground', className)}>
      {children}
    </button>
  );
});
const Divider = () => <span className="mx-1 h-5 w-px flex-none bg-border" aria-hidden="true" />;
const Caret = () => <ChevronDown className="!size-3 opacity-60" aria-hidden="true" />;

/** Search field used inside the emoji and shortcode popovers. */
function PanelSearch({ label, value, onChange, placeholder }) {
  return (
    <label className="flex h-8 items-center gap-2 rounded-md border border-input bg-card px-2.5 shadow-xs transition-[box-shadow,border-color] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20">
      <Search className="size-3.5 flex-none text-muted-foreground" aria-hidden="true" /><span className="sr-only">{label}</span>
      <input autoFocus value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70" />
    </label>
  );
}
const panelHeading = 'px-1 pb-1 text-2xs font-medium uppercase tracking-wider text-muted-foreground';

/**
 * Rich text editor (no extra packages).
 * Toolbar: font · heading · bold / italic / underline / strike · text color / background · lists · align · emoji · shortcodes
 * Emoji shortcodes: type ":rocket" for suggestions, ":rocket:" converts to 🚀
 *
 * Props: value (HTML) · onChange(html) · placeholder · ariaLabel · minHeight · maxLength
 *        shortcuts: list like [{ title, isBold: true }, { title, isBold: false, value: 'ACCOUNT_NAME' }]  (default: contactShortcuts)
 */
export default function TextEditor({ value = '', onChange, placeholder = 'Start typing…', ariaLabel = 'Text editor', shortcuts = contactShortcuts, minHeight = 180, maxLength }) {
  const wrapRef = useRef(null);
  const editorRef = useRef(null);
  const savedRange = useRef(null);
  const lastHtml = useRef(null);
  const suggestRef = useRef(null);

  const [state, setState] = useState({ font: 'sans', header: 'p', align: 'justifyLeft', color: '', background: '' });
  const [active, setActive] = useState({});
  const [panel, setPanel] = useState(null);   // 'color' | 'background' | 'emoji' | 'shortcodes' | null
  const [emojiQuery, setEmojiQuery] = useState('');
  const [emojiCat, setEmojiCat] = useState(EMOJI_CATEGORIES[0].id);
  const [codeQuery, setCodeQuery] = useState('');
  const [suggest, setSuggest] = useState(null);
  const [counts, setCounts] = useState({ words: 0, chars: 0, empty: true });
  const [recent, setRecent] = useState(() => { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; } });

  /* ---------- value in / out ---------- */
  const updateCounts = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const text = (el.innerText || el.textContent || '').replace(/ /g, ' ');
    setCounts({ words: text.trim().split(/\s+/).filter(Boolean).length, chars: text.replace(/\n/g, '').length, empty: !text.trim() && !el.querySelector('.te-field') });
  }, []);

  useEffect(() => {
    if (value !== lastHtml.current && editorRef.current) {
      editorRef.current.innerHTML = value || '';
      lastHtml.current = value;
      updateCounts();
    }
  }, [value, updateCounts]);

  const emit = () => {
    let html = editorRef.current.innerHTML;
    if (html === '<br>' || html === '<p><br></p>') html = '';
    lastHtml.current = html;
    updateCounts();
    onChange?.(html);
  };

  /* ---------- selection ---------- */
  const saveSelection = useCallback(() => {
    const sel = window.getSelection?.();
    if (sel && sel.rangeCount && editorRef.current?.contains(sel.anchorNode)) savedRange.current = sel.getRangeAt(0).cloneRange();
  }, []);
  const restoreSelection = () => {
    const el = editorRef.current;
    el.focus();
    const sel = window.getSelection();
    let range = savedRange.current;
    if (!range || !el.contains(range.startContainer)) { range = document.createRange(); range.selectNodeContents(el); range.collapse(false); }
    sel.removeAllRanges();
    sel.addRange(range);
  };

  // Read the formatting at the cursor so the toolbar shows it
  const refresh = useCallback(() => {
    if (!document.queryCommandState) return;
    try {
      const q = (c) => document.queryCommandState(c);
      setActive({ bold: q('bold'), italic: q('italic'), underline: q('underline'), strike: q('strikeThrough'), ol: q('insertOrderedList'), ul: q('insertUnorderedList') });
      const block = (document.queryCommandValue('formatBlock') || 'p').toLowerCase().replace(/[<>]/g, '');
      const fontName = (document.queryCommandValue('fontName') || '').toLowerCase();
      setState((s) => ({
        ...s,
        header: ['h1', 'h2', 'h3'].includes(block) ? block : 'p',
        font: /mono|courier/.test(fontName) ? 'mono' : /serif|georgia|times/.test(fontName) && !/sans/.test(fontName) ? 'serif' : 'sans',
        align: ALIGNS.find((a) => q(a.cmd))?.cmd || 'justifyLeft',
        color: toHex(document.queryCommandValue('foreColor')),
        background: toHex(document.queryCommandValue('hiliteColor') || document.queryCommandValue('backColor')),
      }));
    } catch { /* not supported */ }
  }, []);

  useEffect(() => {
    const onSel = () => { saveSelection(); if (editorRef.current?.contains(document.activeElement)) refresh(); };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, [saveSelection, refresh]);

  // Close the panels / suggestions on outside clicks. Toolbar popovers render in a portal, so clicks in them don't count.
  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current?.contains(e.target) || e.target?.closest?.('[data-te-popover]')) return;
      setPanel(null); setSuggest(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  /* ---------- commands ---------- */
  const exec = (cmd, arg) => {
    restoreSelection();
    try { document.execCommand?.('styleWithCSS', false, true); } catch { /* ignore */ }
    document.execCommand?.(cmd, false, arg);
    emit(); refresh(); saveSelection();
  };
  const insertHtml = (html) => {
    restoreSelection();
    const ok = document.execCommand?.('insertHTML', false, html);
    if (!ok) {
      const sel = window.getSelection();
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const frag = range.createContextualFragment(html);
      const last = frag.lastChild;
      range.insertNode(frag);
      if (last) { range.setStartAfter(last); range.collapse(true); sel.removeAllRanges(); sel.addRange(range); }
    }
    emit(); saveSelection();
  };
  const insertText = (text) => insertHtml(escapeHtml(text));

  const setFont = (v) => { setState((s) => ({ ...s, font: v })); exec('fontName', FONTS.find((f) => f.value === v).css()); };
  const setHeader = (v) => { setState((s) => ({ ...s, header: v })); exec('formatBlock', `<${v}>`); };
  const setColor = (hex) => { exec('foreColor', hex || '#0F1B2D'); setPanel(null); };
  const setBackground = (hex) => {
    restoreSelection();
    try { document.execCommand?.('styleWithCSS', false, true); } catch { /* ignore */ }
    const ok = document.execCommand?.('hiliteColor', false, hex || 'transparent');
    if (!ok) document.execCommand?.('backColor', false, hex || 'transparent');
    emit(); refresh(); setPanel(null);
  };
  const setAlign = (cmd) => { exec(cmd); setPanel(null); };

  // Controlled Radix popover for one panel ('color' | 'background' | 'emoji' | 'shortcodes')
  const panelProps = (name) => ({
    open: panel === name,
    onOpenChange: (open) => {
      if (open) { saveSelection(); setSuggest(null); setPanel(name); } else setPanel((p) => (p === name ? null : p));
    },
  });
  // Keep the caret in the editor when a menu / popover closes (instead of jumping back to the toolbar button)
  const keepEditorFocus = (e) => e.preventDefault();

  /* ---------- emoji ---------- */
  const addRecent = (e) => {
    const next = [e.code, ...recent.filter((c) => c !== e.code)].slice(0, 16);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const pickEmoji = (e) => { insertText(e.char); addRecent(e); setPanel(null); setEmojiQuery(''); };
  const emojiResults = useMemo(() => {
    const q = emojiQuery.trim().toLowerCase();
    return q ? ALL_EMOJIS.filter((e) => e.code.includes(q) || e.name.includes(q)).slice(0, 48) : null;
  }, [emojiQuery]);
  const recentEmojis = recent.map((c) => EMOJI_BY_CODE[c]).filter(Boolean);

  const replaceBeforeCaret = (node, offset, length, text) => {
    const range = document.createRange();
    range.setStart(node, offset - length);
    range.setEnd(node, offset);
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(range);
    savedRange.current = range.cloneRange();
    insertText(text);
  };
  const detectEmojiCode = () => {
    const sel = window.getSelection?.();
    if (!sel || !sel.rangeCount) { setSuggest(null); return; }
    const r = sel.getRangeAt(0);
    const node = r.startContainer;
    if (node.nodeType !== 3) { setSuggest(null); return; }
    const before = node.textContent.slice(0, r.startOffset);
    const done = before.match(/:([a-z0-9_+-]+):$/i);
    if (done && EMOJI_BY_CODE[done[1].toLowerCase()]) {
      const e = EMOJI_BY_CODE[done[1].toLowerCase()];
      replaceBeforeCaret(node, r.startOffset, done[0].length, e.char);
      addRecent(e); setSuggest(null);
      return;
    }
    const m = before.match(/(?:^|[\s(])(:([a-z0-9_+-]{2,}))$/i);
    if (!m) { setSuggest(null); return; }
    const q = m[2].toLowerCase();
    const list = ALL_EMOJIS.filter((e) => e.code.startsWith(q) || e.code.includes(q) || e.name.includes(q)).slice(0, 8);
    if (!list.length) { setSuggest(null); return; }
    let top = 48; let left = 8;
    const rect = r.getBoundingClientRect?.();
    const box = wrapRef.current.getBoundingClientRect();
    if (rect && (rect.top || rect.left)) { top = rect.bottom - box.top + 6; left = Math.min(rect.left - box.left, box.width - 260); }
    suggestRef.current = { node, offset: r.startOffset, length: m[1].length };
    setSuggest({ list, index: 0, top, left: Math.max(8, left) });
  };
  const pickSuggestion = (e) => {
    const s = suggestRef.current;
    if (!s) return;
    replaceBeforeCaret(s.node, s.offset, s.length, e.char);
    addRecent(e); setSuggest(null);
  };

  /* ---------- shortcodes ---------- */
  // Keep headings (isBold) that have at least one matching item below them
  const shortcodeRows = useMemo(() => {
    const q = codeQuery.trim().toLowerCase();
    const out = [];
    let heading = null;
    shortcuts.forEach((s) => {
      if (s.isBold) { heading = s; return; }
      if (q && !`${s.title} ${s.value}`.toLowerCase().includes(q)) return;
      if (heading) { out.push(heading); heading = null; }
      out.push(s);
    });
    return out;
  }, [shortcuts, codeQuery]);
  const insertShortcode = (s) => {
    insertHtml(`<span class="te-field" contenteditable="false" data-field="${s.value}">[${s.value}]</span>&nbsp;`);
    setPanel(null); setCodeQuery('');
  };

  /* ---------- keyboard / paste ---------- */
  const onKeyDown = (e) => {
    if (!suggest) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSuggest((s) => ({ ...s, index: (s.index + 1) % s.list.length })); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSuggest((s) => ({ ...s, index: (s.index - 1 + s.list.length) % s.list.length })); }
    else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pickSuggestion(suggest.list[suggest.index]); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setSuggest(null); }
  };
  const onPaste = (e) => {
    const text = e.clipboardData?.getData('text/plain');
    if (text == null) return;
    e.preventDefault();
    insertHtml(escapeHtml(text).replace(/\n/g, '<br>'));
  };

  const overLimit = maxLength && counts.chars > maxLength;
  const visibleEmojis = emojiResults || EMOJI_CATEGORIES.find((c) => c.id === emojiCat).items;
  const AlignIcon = (ALIGNS.find((a) => a.cmd === state.align) || ALIGNS[0]).icon;
  const fontLabel = (FONTS.find((f) => f.value === state.font) || FONTS[0]).label;
  const headerLabel = (HEADERS.find((h) => h.value === state.header) || HEADERS[3]).label;
  const menuTrigger = 'inline-flex h-8 flex-none items-center gap-1 rounded-md px-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:bg-accent';

  // Called as a function (not a component) so it keeps its identity between renders
  const renderPalette = ({ label, current, onPick, resetLabel }) => (
    <PopoverContent data-te-popover="" align="start" aria-label={label} onCloseAutoFocus={keepEditorFocus} className="w-[248px] p-2.5">
      <div className="mb-2 text-xs font-medium text-muted-foreground">{label}</div>
      <div className="grid grid-cols-7 gap-1.5" role="group" aria-label={label}>
        {COLORS.map((c) => (
          <button key={c} type="button" title={c} aria-label={`${label} ${c}`} aria-pressed={current === c} onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(c)}
            className={cn('size-7 rounded-md border border-foreground/10 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-popover',
              current === c ? 'ring-2 ring-primary ring-offset-1 ring-offset-popover' : 'hover:scale-110')}
            style={{ backgroundColor: c }} />
        ))}
      </div>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onPick('')}
        className="mt-2.5 flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-input bg-card text-sm font-medium text-muted-foreground shadow-xs transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        <Ban className="size-3.5" aria-hidden="true" /> {resetLabel}
      </button>
    </PopoverContent>
  );

  return (
    <div ref={wrapRef} className="relative rounded-lg border border-input bg-card shadow-xs transition-[box-shadow,border-color] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20">
      {/* ---------- Toolbar ---------- */}
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 rounded-t-lg border-b bg-subtle/70 px-1.5 py-1">
        {/* font */}
        <DropdownMenu modal={false}>
          <SimpleTooltip label="Font">
            <DropdownMenuTrigger aria-label="Font" onPointerDown={saveSelection} onMouseDown={(e) => e.preventDefault()} className={cn(menuTrigger, 'w-[112px] justify-between')}>
              <span className="truncate">{fontLabel}</span><Caret />
            </DropdownMenuTrigger>
          </SimpleTooltip>
          <DropdownMenuContent data-te-popover="" align="start" className="w-44" onCloseAutoFocus={keepEditorFocus}>
            <DropdownMenuLabel>Font</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={state.font} onValueChange={setFont}>
              {FONTS.map((f) => <DropdownMenuRadioItem key={f.value} value={f.value} style={{ fontFamily: f.value === 'sans' ? undefined : f.css() }}>{f.label}</DropdownMenuRadioItem>)}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* header */}
        <DropdownMenu modal={false}>
          <SimpleTooltip label="Heading">
            <DropdownMenuTrigger aria-label="Heading" onPointerDown={saveSelection} onMouseDown={(e) => e.preventDefault()} className={cn(menuTrigger, 'w-[108px] justify-between')}>
              <span className="truncate">{headerLabel}</span><Caret />
            </DropdownMenuTrigger>
          </SimpleTooltip>
          <DropdownMenuContent data-te-popover="" align="start" className="w-44" onCloseAutoFocus={keepEditorFocus}>
            <DropdownMenuLabel>Text style</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={state.header} onValueChange={setHeader}>
              {HEADERS.map((h) => <DropdownMenuRadioItem key={h.value} value={h.value} className={HEADER_PREVIEW[h.value]}>{h.label}</DropdownMenuRadioItem>)}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Divider />
        {/* bold italic underline strike */}
        <SimpleTooltip label="Bold" shortcut="Ctrl B"><ToolButton label="Bold" active={!!active.bold} onClick={() => exec('bold')}><Bold /></ToolButton></SimpleTooltip>
        <SimpleTooltip label="Italic" shortcut="Ctrl I"><ToolButton label="Italic" active={!!active.italic} onClick={() => exec('italic')}><Italic /></ToolButton></SimpleTooltip>
        <SimpleTooltip label="Underline" shortcut="Ctrl U"><ToolButton label="Underline" active={!!active.underline} onClick={() => exec('underline')}><Underline /></ToolButton></SimpleTooltip>
        <SimpleTooltip label="Strikethrough"><ToolButton label="Strikethrough" active={!!active.strike} onClick={() => exec('strikeThrough')}><Strikethrough /></ToolButton></SimpleTooltip>
        <Divider />
        {/* color · background */}
        <Popover {...panelProps('color')}>
          <SimpleTooltip label="Text color">
            <PopoverTrigger asChild>
              <ToolButton label="Text color">
                <span className="relative flex flex-col items-center"><Type /><span className="mt-px h-[3px] w-4 rounded-full" style={{ backgroundColor: state.color || 'currentColor' }} /></span>
                <Caret />
              </ToolButton>
            </PopoverTrigger>
          </SimpleTooltip>
          {panel === 'color' && renderPalette({ label: 'Text color', current: state.color, onPick: setColor, resetLabel: 'Default color' })}
        </Popover>
        <Popover {...panelProps('background')}>
          <SimpleTooltip label="Background color">
            <PopoverTrigger asChild>
              <ToolButton label="Background color">
                <span className="relative flex flex-col items-center"><Highlighter />
                  <span className="mt-px h-[3px] w-4 rounded-full border border-line-strong" style={{ backgroundColor: state.background && state.background !== '#000000' ? state.background : 'transparent' }} />
                </span>
                <Caret />
              </ToolButton>
            </PopoverTrigger>
          </SimpleTooltip>
          {panel === 'background' && renderPalette({ label: 'Background color', current: state.background, onPick: setBackground, resetLabel: 'No background' })}
        </Popover>
        <Divider />
        {/* lists */}
        <SimpleTooltip label="Numbered list"><ToolButton label="Numbered list" active={!!active.ol} onClick={() => exec('insertOrderedList')}><ListOrdered /></ToolButton></SimpleTooltip>
        <SimpleTooltip label="Bulleted list"><ToolButton label="Bulleted list" active={!!active.ul} onClick={() => exec('insertUnorderedList')}><List /></ToolButton></SimpleTooltip>
        <Divider />
        {/* align */}
        <DropdownMenu modal={false}>
          <SimpleTooltip label="Align">
            <DropdownMenuTrigger asChild onPointerDown={saveSelection}>
              <ToolButton label="Align"><AlignIcon /><Caret /></ToolButton>
            </DropdownMenuTrigger>
          </SimpleTooltip>
          <DropdownMenuContent data-te-popover="" align="start" aria-label="Alignment" className="w-40" onCloseAutoFocus={keepEditorFocus}>
            <DropdownMenuRadioGroup value={state.align} onValueChange={setAlign}>
              {ALIGNS.map(({ cmd, label, icon: Icon }) => (
                <DropdownMenuRadioItem key={cmd} value={cmd} aria-label={label}><Icon className="text-muted-foreground" aria-hidden="true" />{label}</DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Divider />
        {/* emoji · shortcodes */}
        <Popover {...panelProps('emoji')}>
          <SimpleTooltip label="Insert emoji">
            <PopoverTrigger asChild><ToolButton label="Insert emoji"><Smile /></ToolButton></PopoverTrigger>
          </SimpleTooltip>
          {panel === 'emoji' && (
            <PopoverContent data-te-popover="" align="end" aria-label="Emoji picker" onCloseAutoFocus={keepEditorFocus} className="flex w-[min(340px,calc(100vw-32px))] flex-col p-0">
              <div className="border-b p-2">
                <PanelSearch label="Search emoji" value={emojiQuery} onChange={setEmojiQuery} placeholder="Search emoji (e.g. rocket)" />
              </div>
              {!emojiResults && (
                <div role="tablist" aria-label="Emoji categories" className="flex gap-0.5 overflow-x-auto border-b px-1.5 py-1">
                  {EMOJI_CATEGORIES.map((c) => (
                    <button key={c.id} type="button" role="tab" aria-selected={emojiCat === c.id} title={c.label} aria-label={c.label} onClick={() => setEmojiCat(c.id)}
                      className={cn('flex size-8 flex-none items-center justify-center rounded-md text-base transition-colors',
                        emojiCat === c.id ? 'bg-accent ring-1 ring-inset ring-border' : 'opacity-70 hover:bg-accent hover:opacity-100')}>{c.icon}</button>
                  ))}
                </div>
              )}
              <div className="max-h-[260px] overflow-y-auto p-2">
                {!emojiResults && recentEmojis.length > 0 && (
                  <>
                    <div className={panelHeading}>Recently used</div>
                    <div className="mb-2 grid grid-cols-8 gap-0.5">
                      {recentEmojis.map((e) => <button key={`r-${e.code}`} type="button" title={`:${e.code}:`} aria-label={e.name} onClick={() => pickEmoji(e)} className="flex h-9 items-center justify-center rounded-md text-xl transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none">{e.char}</button>)}
                    </div>
                  </>
                )}
                <div className={panelHeading}>
                  {emojiResults ? `${emojiResults.length} result${emojiResults.length === 1 ? '' : 's'}` : EMOJI_CATEGORIES.find((c) => c.id === emojiCat).label}
                </div>
                <div className="grid grid-cols-8 gap-0.5">
                  {visibleEmojis.map((e) => (
                    <button key={e.code} type="button" title={`${e.name}  :${e.code}:`} aria-label={e.name} onClick={() => pickEmoji(e)}
                      className="flex h-9 items-center justify-center rounded-md text-xl transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none">{e.char}</button>
                  ))}
                </div>
                {emojiResults && emojiResults.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No emoji found.</p>}
              </div>
              <div className="border-t bg-subtle px-3 py-2 text-xs text-muted-foreground">Tip: type <kbd className="kbd">:smile:</kbd> in the text to add an emoji.</div>
            </PopoverContent>
          )}
        </Popover>
        <Popover {...panelProps('shortcodes')}>
          <SimpleTooltip label="Insert a shortcode">
            <PopoverTrigger asChild>
              <ToolButton label="Shortcodes" className="gap-1.5 px-2 text-sm font-medium">
                <Braces aria-hidden="true" /> Shortcodes <Caret />
              </ToolButton>
            </PopoverTrigger>
          </SimpleTooltip>
          {panel === 'shortcodes' && (
            <PopoverContent data-te-popover="" align="end" aria-label="Shortcodes" onCloseAutoFocus={keepEditorFocus} className="flex w-[min(320px,calc(100vw-32px))] flex-col p-0">
              <div className="border-b p-2">
                <PanelSearch label="Search shortcodes" value={codeQuery} onChange={setCodeQuery} placeholder="Search shortcodes" />
              </div>
              <div className="max-h-[300px] overflow-y-auto p-1">
                {shortcodeRows.map((s) => (s.isBold ? (
                  <div key={`h-${s.title}`} className={cn(panelHeading, 'px-2 pt-2')}>{s.title}</div>
                ) : (
                  <button key={s.value} type="button" onClick={() => insertShortcode(s)}
                    className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none">
                    <span className="truncate text-sm">{s.title}</span>
                    <code className="max-w-[55%] truncate rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[11px] text-brand-700 ring-1 ring-inset ring-brand-200">[{s.value}]</code>
                  </button>
                )))}
                {shortcodeRows.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No shortcodes found.</p>}
              </div>
            </PopoverContent>
          )}
        </Popover>
      </div>

      {/* ---------- Editing area ---------- */}
      <div className="relative">
        {counts.empty && <div className="pointer-events-none absolute left-4 top-3 text-base text-muted-foreground/70" aria-hidden="true">{placeholder}</div>}
        <div ref={editorRef} role="textbox" aria-multiline="true" aria-label={ariaLabel} contentEditable suppressContentEditableWarning
          onInput={() => { emit(); detectEmojiCode(); }} onKeyDown={onKeyDown} onKeyUp={saveSelection}
          onMouseUp={() => { saveSelection(); refresh(); }} onBlur={saveSelection} onPaste={onPaste}
          className={cn(CONTENT_CLASS, 'px-4 py-3')} style={{ minHeight }} />
      </div>

      {/* :emoji suggestions */}
      {suggest && (
        <ul role="listbox" aria-label="Emoji suggestions" className="absolute z-40 w-64 rounded-lg border bg-popover p-1 text-popover-foreground shadow-pop animate-in fade-in-0 zoom-in-95" style={{ top: suggest.top, left: suggest.left }}>
          {suggest.list.map((e, i) => (
            <li key={e.code} role="option" aria-selected={i === suggest.index} onMouseDown={(ev) => { ev.preventDefault(); pickSuggestion(e); }}
              className={cn('flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm', i === suggest.index ? 'bg-accent text-accent-foreground' : 'hover:bg-accent')}>
              <span className="text-lg leading-none">{e.char}</span><span className="font-mono text-xs text-muted-foreground">:{e.code}:</span>
            </li>
          ))}
        </ul>
      )}

      {/* footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-b-lg border-t bg-subtle/50 px-3 py-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">Type <kbd className="kbd">:</kbd> for emoji</span>
        <span className={cn('tabular-nums', overLimit && 'font-medium text-danger-700')} aria-live="polite">
          {counts.words} word{counts.words === 1 ? '' : 's'} · {counts.chars}{maxLength ? ` / ${maxLength}` : ''} characters
        </span>
      </div>
    </div>
  );
}
