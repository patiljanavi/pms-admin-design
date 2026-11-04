// import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import {
//   MdCode, MdDataObject, MdFormatBold, MdFormatClear, MdFormatItalic, MdFormatListBulleted, MdFormatListNumbered,
//   MdFormatQuote, MdFormatStrikethrough, MdFormatUnderlined, MdInsertEmoticon, MdLink, MdLinkOff, MdRedo, MdUndo,
// } from 'react-icons/md';
// import { FiSearch } from 'react-icons/fi';
// import { ALL_EMOJIS, EMOJI_BY_CODE, EMOJI_CATEGORIES } from '../data/emojis';
// import { EDITOR_FIELDS } from '../data/editorFields';
// import { cx } from './ui';

// const RECENT_KEY = 'harbor.recentEmojis';
// const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// /** Plain text from editor HTML (for tables, search and CSV). */
// export function htmlToText(html = '') {
//   return html.replace(/<br\s*\/?>/gi, ' ').replace(/<\/(p|div|h\d|li|blockquote)>/gi, ' ').replace(/<[^>]+>/g, '')
//     .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
// }

// function ToolButton({ label, active, onClick, children }) {
//   return (
//     <button type="button" title={label} aria-label={label} aria-pressed={active ?? undefined}
//       onMouseDown={(e) => e.preventDefault()} /* keep the text selection */ onClick={onClick}
//       className={cx('flex h-9 w-9 flex-none items-center justify-center rounded text-[19px] transition-colors',
//         active ? 'bg-brand-100 text-brand-600' : 'text-muted hover:bg-subtle hover:text-ink')}>
//       {children}
//     </button>
//   );
// }
// const Divider = () => <span className="mx-1 h-6 w-px flex-none bg-line" aria-hidden="true" />;

// /**
//  * Rich text editor (no extra packages).
//  * - Toolbar: paragraph / headings, bold, italic, underline, strikethrough, lists, quote, code, link, clear, undo / redo
//  * - Emoji picker (search, categories, recent) + emoji shortcodes: type ":rocket" for suggestions, ":rocket:" converts
//  * - Insert field: [ACCOUNT_NAME], [DUE_DATE] … inserted as chips
//  * - Word and character count
//  *
//  * Props: value (HTML), onChange(html), placeholder, ariaLabel, fields (defaults to data/editorFields.js), minHeight, maxLength
//  */
// export default function TextEditor({ value = '', onChange, placeholder = 'Start typing…', ariaLabel = 'Text editor', fields = EDITOR_FIELDS, minHeight = 180, maxLength }) {
//   const wrapRef = useRef(null);
//   const editorRef = useRef(null);
//   const savedRange = useRef(null);
//   const lastHtml = useRef(null);
//   const suggestRef = useRef(null);

//   const [active, setActive] = useState({});
//   const [block, setBlock] = useState('p');
//   const [panel, setPanel] = useState(null);          // 'emoji' | 'fields' | 'link' | null
//   const [emojiQuery, setEmojiQuery] = useState('');
//   const [emojiCat, setEmojiCat] = useState(EMOJI_CATEGORIES[0].id);
//   const [fieldQuery, setFieldQuery] = useState('');
//   const [linkUrl, setLinkUrl] = useState('');
//   const [suggest, setSuggest] = useState(null);      // emoji shortcode suggestions
//   const [counts, setCounts] = useState({ words: 0, chars: 0, empty: true });
//   const [recent, setRecent] = useState(() => { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; } });

//   /* ---------- value in / out ---------- */
//   const updateCounts = useCallback(() => {
//     const el = editorRef.current;
//     if (!el) return;
//     const text = (el.innerText || el.textContent || '').replace(/\u00a0/g, ' ');
//     const hasField = !!el.querySelector('.te-field');
//     setCounts({ words: text.trim().split(/\s+/).filter(Boolean).length, chars: text.replace(/\n/g, '').length, empty: !text.trim() && !hasField });
//   }, []);

//   useEffect(() => {                                   // load outside changes (e.g. opening another template)
//     if (value !== lastHtml.current && editorRef.current) {
//       editorRef.current.innerHTML = value || '';
//       lastHtml.current = value;
//       updateCounts();
//     }
//   }, [value, updateCounts]);

//   const emit = () => {
//     const el = editorRef.current;
//     let html = el.innerHTML;
//     if (html === '<br>' || html === '<p><br></p>') html = '';
//     lastHtml.current = html;
//     updateCounts();
//     onChange?.(html);
//   };

//   /* ---------- selection helpers ---------- */
//   const saveSelection = useCallback(() => {
//     const sel = window.getSelection?.();
//     if (sel && sel.rangeCount && editorRef.current?.contains(sel.anchorNode)) savedRange.current = sel.getRangeAt(0).cloneRange();
//   }, []);
//   const restoreSelection = () => {
//     const el = editorRef.current;
//     el.focus();
//     const sel = window.getSelection();
//     let range = savedRange.current;
//     if (!range || !el.contains(range.startContainer)) { range = document.createRange(); range.selectNodeContents(el); range.collapse(false); }
//     sel.removeAllRanges();
//     sel.addRange(range);
//   };
//   const refreshActive = useCallback(() => {
//     if (!document.queryCommandState) return;
//     try {
//       setActive({
//         bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic'),
//         underline: document.queryCommandState('underline'), strike: document.queryCommandState('strikeThrough'),
//         ul: document.queryCommandState('insertUnorderedList'), ol: document.queryCommandState('insertOrderedList'),
//       });
//       const b = (document.queryCommandValue('formatBlock') || 'p').toLowerCase().replace(/[<>]/g, '');
//       setBlock(['h2', 'h3', 'blockquote'].includes(b) ? b : 'p');
//     } catch { /* not supported */ }
//   }, []);

//   useEffect(() => {
//     const onSel = () => { saveSelection(); if (editorRef.current?.contains(document.activeElement)) refreshActive(); };
//     document.addEventListener('selectionchange', onSel);
//     return () => document.removeEventListener('selectionchange', onSel);
//   }, [saveSelection, refreshActive]);

//   // Close popovers on outside click
//   useEffect(() => {
//     const onDoc = (e) => { if (!wrapRef.current?.contains(e.target)) { setPanel(null); setSuggest(null); } };
//     document.addEventListener('mousedown', onDoc);
//     return () => document.removeEventListener('mousedown', onDoc);
//   }, []);

//   /* ---------- editing commands ---------- */
//   const exec = (cmd, arg) => { restoreSelection(); document.execCommand?.(cmd, false, arg); emit(); refreshActive(); saveSelection(); };

//   const insertHtml = (html) => {
//     restoreSelection();
//     const ok = document.execCommand?.('insertHTML', false, html);
//     if (!ok) {                                         // fallback (older browsers / tests)
//       const sel = window.getSelection();
//       const range = sel.getRangeAt(0);
//       range.deleteContents();
//       const frag = range.createContextualFragment(html);
//       const last = frag.lastChild;
//       range.insertNode(frag);
//       if (last) { range.setStartAfter(last); range.collapse(true); sel.removeAllRanges(); sel.addRange(range); }
//     }
//     emit(); saveSelection();
//   };
//   const insertText = (text) => insertHtml(escapeHtml(text));

//   const setBlockType = (tag) => exec('formatBlock', `<${tag}>`);
//   const toggleCode = () => {
//     restoreSelection();
//     const text = window.getSelection().toString();
//     insertHtml(`<code>${escapeHtml(text || 'code')}</code>&nbsp;`);
//   };
//   const applyLink = () => {
//     const url = linkUrl.trim();
//     if (!url) return;
//     const href = /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`;
//     restoreSelection();
//     const hasText = !window.getSelection().isCollapsed;
//     if (hasText) exec('createLink', href);
//     else insertHtml(`<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>&nbsp;`);
//     setLinkUrl(''); setPanel(null);
//   };

//   /* ---------- emoji ---------- */
//   const addRecent = (e) => {
//     const next = [e.code, ...recent.filter((c) => c !== e.code)].slice(0, 16);
//     setRecent(next);
//     try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
//   };
//   const pickEmoji = (e) => { insertText(e.char); addRecent(e); setPanel(null); setEmojiQuery(''); };

//   const emojiResults = useMemo(() => {
//     const q = emojiQuery.trim().toLowerCase();
//     if (!q) return null;
//     return ALL_EMOJIS.filter((e) => e.code.includes(q) || e.name.includes(q)).slice(0, 48);
//   }, [emojiQuery]);
//   const recentEmojis = recent.map((c) => EMOJI_BY_CODE[c]).filter(Boolean);

//   // Shortcodes: ":rocket" → suggestions, ":rocket:" → 🚀
//   const replaceBeforeCaret = (node, offset, length, text) => {
//     const range = document.createRange();
//     range.setStart(node, offset - length);
//     range.setEnd(node, offset);
//     const sel = window.getSelection();
//     sel.removeAllRanges(); sel.addRange(range);
//     savedRange.current = range.cloneRange();
//     insertText(text);
//   };
//   const detectShortcode = () => {
//     const sel = window.getSelection?.();
//     if (!sel || !sel.rangeCount) { setSuggest(null); return; }
//     const r = sel.getRangeAt(0);
//     const node = r.startContainer;
//     if (node.nodeType !== 3) { setSuggest(null); return; }
//     const before = node.textContent.slice(0, r.startOffset);

//     const done = before.match(/:([a-z0-9_+-]+):$/i);
//     if (done && EMOJI_BY_CODE[done[1].toLowerCase()]) {
//       const e = EMOJI_BY_CODE[done[1].toLowerCase()];
//       replaceBeforeCaret(node, r.startOffset, done[0].length, e.char);
//       addRecent(e); setSuggest(null);
//       return;
//     }
//     const m = before.match(/(?:^|[\s(])(:([a-z0-9_+-]{2,}))$/i);
//     if (!m) { setSuggest(null); return; }
//     const q = m[2].toLowerCase();
//     const list = ALL_EMOJIS.filter((e) => e.code.startsWith(q) || e.code.includes(q) || e.name.includes(q)).slice(0, 8);
//     if (!list.length) { setSuggest(null); return; }
//     let top = 40; let left = 8;
//     const rect = r.getBoundingClientRect?.();
//     const box = wrapRef.current.getBoundingClientRect();
//     if (rect && (rect.top || rect.left)) { top = rect.bottom - box.top + 6; left = Math.min(rect.left - box.left, box.width - 260); }
//     suggestRef.current = { node, offset: r.startOffset, length: m[1].length };
//     setSuggest({ list, index: 0, top, left: Math.max(8, left) });
//   };
//   const pickSuggestion = (e) => {
//     const s = suggestRef.current;
//     if (!s) return;
//     replaceBeforeCaret(s.node, s.offset, s.length, e.char);
//     addRecent(e); setSuggest(null);
//   };

//   /* ---------- fields ---------- */
//   const fieldResults = useMemo(() => {
//     const q = fieldQuery.trim().toLowerCase();
//     return fields.filter((f) => !q || `${f.label} ${f.key} ${f.group}`.toLowerCase().includes(q));
//   }, [fields, fieldQuery]);
//   const fieldGroups = useMemo(() => [...new Set(fieldResults.map((f) => f.group))], [fieldResults]);
//   const insertField = (f) => {
//     insertHtml(`<span class="te-field" contenteditable="false" data-field="${f.key}">[${f.key}]</span>&nbsp;`);
//     setPanel(null); setFieldQuery('');
//   };

//   /* ---------- keyboard ---------- */
//   const onKeyDown = (e) => {
//     if (suggest) {
//       if (e.key === 'ArrowDown') { e.preventDefault(); setSuggest((s) => ({ ...s, index: (s.index + 1) % s.list.length })); return; }
//       if (e.key === 'ArrowUp') { e.preventDefault(); setSuggest((s) => ({ ...s, index: (s.index - 1 + s.list.length) % s.list.length })); return; }
//       if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pickSuggestion(suggest.list[suggest.index]); return; }
//       if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setSuggest(null); return; }
//     }
//     if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); saveSelection(); setPanel('link'); }
//   };
//   const onPaste = (e) => {                             // paste as plain text (keeps formatting clean)
//     const text = e.clipboardData?.getData('text/plain');
//     if (text == null) return;
//     e.preventDefault();
//     insertHtml(escapeHtml(text).replace(/\n/g, '<br>'));
//   };

//   const togglePanel = (name) => { saveSelection(); setPanel((p) => (p === name ? null : name)); setSuggest(null); };
//   const overLimit = maxLength && counts.chars > maxLength;
//   const visibleEmojis = emojiResults || EMOJI_CATEGORIES.find((c) => c.id === emojiCat).items;

//   return (
//     <div ref={wrapRef} className="relative rounded-md border border-line-strong bg-surface focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/30">
//       {/* Toolbar */}
//       <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 border-b border-line bg-subtle px-1.5 py-1">
//         <select aria-label="Text style" value={block} onMouseDown={saveSelection} onChange={(e) => setBlockType(e.target.value)}
//           className="h-9 rounded border border-transparent bg-transparent px-2 text-sm font-semibold text-ink hover:border-line focus:border-brand-600 focus:outline-none">
//           <option value="p">Paragraph</option>
//           <option value="h2">Heading</option>
//           <option value="h3">Subheading</option>
//           <option value="blockquote">Quote</option>
//         </select>
//         <Divider />
//         <ToolButton label="Bold (Ctrl+B)" active={!!active.bold} onClick={() => exec('bold')}><MdFormatBold /></ToolButton>
//         <ToolButton label="Italic (Ctrl+I)" active={!!active.italic} onClick={() => exec('italic')}><MdFormatItalic /></ToolButton>
//         <ToolButton label="Underline (Ctrl+U)" active={!!active.underline} onClick={() => exec('underline')}><MdFormatUnderlined /></ToolButton>
//         <ToolButton label="Strikethrough" active={!!active.strike} onClick={() => exec('strikeThrough')}><MdFormatStrikethrough /></ToolButton>
//         <Divider />
//         <ToolButton label="Bulleted list" active={!!active.ul} onClick={() => exec('insertUnorderedList')}><MdFormatListBulleted /></ToolButton>
//         <ToolButton label="Numbered list" active={!!active.ol} onClick={() => exec('insertOrderedList')}><MdFormatListNumbered /></ToolButton>
//         <ToolButton label="Quote" active={block === 'blockquote'} onClick={() => setBlockType(block === 'blockquote' ? 'p' : 'blockquote')}><MdFormatQuote /></ToolButton>
//         <ToolButton label="Inline code" onClick={toggleCode}><MdCode /></ToolButton>
//         <Divider />
//         <ToolButton label="Add link (Ctrl+K)" active={panel === 'link'} onClick={() => togglePanel('link')}><MdLink /></ToolButton>
//         <ToolButton label="Remove link" onClick={() => exec('unlink')}><MdLinkOff /></ToolButton>
//         <ToolButton label="Insert emoji" active={panel === 'emoji'} onClick={() => togglePanel('emoji')}><MdInsertEmoticon /></ToolButton>
//         <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => togglePanel('fields')} aria-expanded={panel === 'fields'}
//           className={cx('flex h-9 items-center gap-1.5 rounded px-2.5 text-sm font-semibold', panel === 'fields' ? 'bg-brand-100 text-brand-600' : 'text-muted hover:bg-subtle hover:text-ink')}>
//           <MdDataObject className="text-[18px]" aria-hidden="true" /> Insert field
//         </button>
//         <span className="ml-auto flex">
//           <ToolButton label="Clear formatting" onClick={() => exec('removeFormat')}><MdFormatClear /></ToolButton>
//           <ToolButton label="Undo (Ctrl+Z)" onClick={() => exec('undo')}><MdUndo /></ToolButton>
//           <ToolButton label="Redo (Ctrl+Y)" onClick={() => exec('redo')}><MdRedo /></ToolButton>
//         </span>
//       </div>

//       {/* Link popover */}
//       {panel === 'link' && (
//         <div className="absolute left-2 right-2 top-12 z-30 flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface p-3 shadow-pop sm:left-auto sm:w-[380px]">
//           <label className="sr-only" htmlFor="te-link">Link address</label>
//           <input id="te-link" autoFocus value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com"
//             onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyLink(); } if (e.key === 'Escape') setPanel(null); }}
//             className="input min-h-[40px] flex-1" />
//           <button type="button" className="btn-primary min-h-[40px]" onClick={applyLink}>Add link</button>
//           <p className="w-full text-xs text-muted">Select text first to turn it into a link, or add the address as a new link.</p>
//         </div>
//       )}

//       {/* Emoji picker */}
//       {panel === 'emoji' && (
//         <div role="dialog" aria-label="Emoji picker" className="absolute right-2 top-12 z-30 flex w-[min(340px,calc(100%-16px))] flex-col rounded-md border border-line bg-surface shadow-pop"
//           onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setPanel(null); } }}>
//           <div className="border-b border-line p-2">
//             <label className="flex min-h-[38px] items-center gap-2 rounded border border-line-strong px-2.5 focus-within:border-brand-600">
//               <FiSearch className="text-muted" aria-hidden="true" /><span className="sr-only">Search emoji</span>
//               <input autoFocus value={emojiQuery} onChange={(e) => setEmojiQuery(e.target.value)} placeholder="Search emoji (e.g. rocket)" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
//             </label>
//           </div>
//           {!emojiResults && (
//             <div role="tablist" aria-label="Emoji categories" className="flex gap-0.5 overflow-x-auto border-b border-line px-1.5 py-1">
//               {EMOJI_CATEGORIES.map((c) => (
//                 <button key={c.id} type="button" role="tab" aria-selected={emojiCat === c.id} title={c.label} aria-label={c.label} onClick={() => setEmojiCat(c.id)}
//                   className={cx('flex h-9 w-9 flex-none items-center justify-center rounded text-lg', emojiCat === c.id ? 'bg-brand-100' : 'hover:bg-subtle')}>{c.icon}</button>
//               ))}
//             </div>
//           )}
//           <div className="max-h-[260px] overflow-y-auto p-2">
//             {!emojiResults && recentEmojis.length > 0 && (
//               <>
//                 <div className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">Recently used</div>
//                 <div className="mb-2 grid grid-cols-8 gap-0.5">
//                   {recentEmojis.map((e) => <button key={`r-${e.code}`} type="button" title={`:${e.code}:`} aria-label={e.name} onClick={() => pickEmoji(e)} className="flex h-9 items-center justify-center rounded text-xl hover:bg-subtle">{e.char}</button>)}
//                 </div>
//               </>
//             )}
//             <div className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">
//               {emojiResults ? `${emojiResults.length} result${emojiResults.length === 1 ? '' : 's'}` : EMOJI_CATEGORIES.find((c) => c.id === emojiCat).label}
//             </div>
//             <div className="grid grid-cols-8 gap-0.5">
//               {visibleEmojis.map((e) => (
//                 <button key={e.code} type="button" title={`${e.name}  :${e.code}:`} aria-label={e.name} onClick={() => pickEmoji(e)}
//                   className="flex h-9 items-center justify-center rounded text-xl hover:bg-subtle focus:bg-brand-100 focus:outline-none">{e.char}</button>
//               ))}
//             </div>
//             {emojiResults && emojiResults.length === 0 && <p className="p-4 text-center text-sm text-muted">No emoji found.</p>}
//           </div>
//           <div className="border-t border-line px-3 py-2 text-xs text-muted">Tip: type <kbd className="font-mono">:smile:</kbd> in the text to add an emoji.</div>
//         </div>
//       )}

//       {/* Insert field */}
//       {panel === 'fields' && (
//         <div role="dialog" aria-label="Insert field" className="absolute right-2 top-12 z-30 flex w-[min(320px,calc(100%-16px))] flex-col rounded-md border border-line bg-surface shadow-pop"
//           onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setPanel(null); } }}>
//           <div className="border-b border-line p-2">
//             <label className="flex min-h-[38px] items-center gap-2 rounded border border-line-strong px-2.5 focus-within:border-brand-600">
//               <FiSearch className="text-muted" aria-hidden="true" /><span className="sr-only">Search fields</span>
//               <input autoFocus value={fieldQuery} onChange={(e) => setFieldQuery(e.target.value)} placeholder="Search fields" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
//             </label>
//           </div>
//           <div className="max-h-[280px] overflow-y-auto p-1.5">
//             {fieldGroups.map((g) => (
//               <div key={g} className="mb-1">
//                 <div className="px-2 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{g}</div>
//                 {fieldResults.filter((f) => f.group === g).map((f) => (
//                   <button key={f.key} type="button" onClick={() => insertField(f)}
//                     className="flex w-full items-center justify-between gap-3 rounded px-2 py-2 text-left hover:bg-subtle focus:bg-brand-50 focus:outline-none">
//                     <span className="text-sm font-semibold">{f.label}</span>
//                     <code className="rounded bg-brand-100 px-1.5 font-mono text-xs text-brand-800">[{f.key}]</code>
//                   </button>
//                 ))}
//               </div>
//             ))}
//             {fieldResults.length === 0 && <p className="p-4 text-center text-sm text-muted">No fields found.</p>}
//           </div>
//         </div>
//       )}

//       {/* Editing area */}
//       <div className="relative">
//         {counts.empty && <div className="pointer-events-none absolute left-4 top-3 text-muted/70" aria-hidden="true">{placeholder}</div>}
//         <div ref={editorRef} role="textbox" aria-multiline="true" aria-label={ariaLabel} contentEditable suppressContentEditableWarning
//           onInput={() => { emit(); detectShortcode(); }} onKeyDown={onKeyDown} onKeyUp={saveSelection} onMouseUp={() => { saveSelection(); refreshActive(); }}
//           onBlur={saveSelection} onPaste={onPaste}
//           className="te-content px-4 py-3 text-base leading-relaxed" style={{ minHeight }} />
//       </div>

//       {/* Shortcode suggestions */}
//       {suggest && (
//         <ul role="listbox" aria-label="Emoji suggestions" className="absolute z-40 w-64 rounded-md border border-line bg-surface p-1 shadow-pop" style={{ top: suggest.top, left: suggest.left }}>
//           {suggest.list.map((e, i) => (
//             <li key={e.code} role="option" aria-selected={i === suggest.index} onMouseDown={(ev) => { ev.preventDefault(); pickSuggestion(e); }}
//               className={cx('flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm', i === suggest.index ? 'bg-brand-100' : 'hover:bg-subtle')}>
//               <span className="text-lg">{e.char}</span><span className="font-mono">:{e.code}:</span>
//             </li>
//           ))}
//         </ul>
//       )}

//       {/* Footer */}
//       <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-1.5 text-xs text-muted">
//         <span>Type <kbd className="font-mono">:</kbd> for emoji · <kbd className="font-mono">Ctrl K</kbd> for a link</span>
//         <span className={cx(overLimit && 'font-semibold text-danger-700')} aria-live="polite">
//           {counts.words} word{counts.words === 1 ? '' : 's'} · {counts.chars}{maxLength ? ` / ${maxLength}` : ''} characters
//         </span>
//       </div>
//     </div>
//   );
// }
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MdArrowDropDown, MdDataObject, MdFormatAlignCenter, MdFormatAlignJustify, MdFormatAlignLeft, MdFormatAlignRight,
  MdFormatBold, MdFormatColorFill, MdFormatColorReset, MdFormatColorText, MdFormatItalic, MdFormatListBulleted,
  MdFormatListNumbered, MdFormatStrikethrough, MdFormatUnderlined, MdInsertEmoticon,
} from 'react-icons/md';
import { FiSearch } from 'react-icons/fi';
import { ALL_EMOJIS, EMOJI_BY_CODE, EMOJI_CATEGORIES } from '../data/emojis';
import { contactShortcuts } from '../data/shortcodes';
import { cx } from './ui';

const RECENT_KEY = 'harbor.recentEmojis';
const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Toolbar options (same groups as a Quill toolbar)
const FONTS = [
  { value: 'sans', label: 'Sans Serif', css: () => getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() || 'sans-serif' },
  { value: 'serif', label: 'Serif', css: () => 'Georgia, "Times New Roman", serif' },
  { value: 'mono', label: 'Monospace', css: () => '"Courier New", ui-monospace, monospace' },
];
const HEADERS = [{ value: 'h1', label: 'Heading 1' }, { value: 'h2', label: 'Heading 2' }, { value: 'h3', label: 'Heading 3' }, { value: 'p', label: 'Normal' }];
const ALIGNS = [
  { cmd: 'justifyLeft', label: 'Align left', icon: MdFormatAlignLeft },
  { cmd: 'justifyCenter', label: 'Align center', icon: MdFormatAlignCenter },
  { cmd: 'justifyRight', label: 'Align right', icon: MdFormatAlignRight },
  { cmd: 'justifyFull', label: 'Justify', icon: MdFormatAlignJustify },
];
const COLORS = [
  '#000000', '#E60000', '#FF9900', '#FFFF00', '#008A00', '#0066CC', '#9933FF',
  '#FFFFFF', '#FACCCC', '#FFEBCC', '#FFFFCC', '#CCE8CC', '#CCE0F5', '#EBD6FF',
  '#BBBBBB', '#F06666', '#FFC266', '#FFFF66', '#66B966', '#66A3E0', '#C285FF',
  '#888888', '#A10000', '#B26B00', '#B2B200', '#006100', '#0047B2', '#6B24B2',
  '#444444', '#5C0000', '#663D00', '#666600', '#003700', '#002966', '#3D1466',
];

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

function ToolButton({ label, active, onClick, children, expanded }) {
  return (
    <button type="button" title={label} aria-label={label} aria-pressed={expanded === undefined ? active ?? undefined : undefined}
      aria-expanded={expanded} onMouseDown={(e) => e.preventDefault()} /* keep the text selection */ onClick={onClick}
      className={cx('flex h-9 min-w-[36px] flex-none items-center justify-center rounded px-1 text-[19px] transition-colors',
        active ? 'bg-brand-100 text-brand-600' : 'text-muted hover:bg-subtle hover:text-ink')}>
      {children}
    </button>
  );
}
const Divider = () => <span className="mx-1 h-6 w-px flex-none bg-line" aria-hidden="true" />;
const popover = 'absolute top-12 z-30 rounded-md border border-line bg-surface shadow-pop';

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
  const [panel, setPanel] = useState(null);   // 'color' | 'background' | 'align' | 'emoji' | 'shortcodes' | null
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
    const text = (el.innerText || el.textContent || '').replace(/\u00a0/g, ' ');
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

  useEffect(() => {
    const onDoc = (e) => { if (!wrapRef.current?.contains(e.target)) { setPanel(null); setSuggest(null); } };
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
  const openPanel = (name) => { saveSelection(); setPanel((p) => (p === name ? null : name)); setSuggest(null); };

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
  const selectCls = 'h-9 rounded border border-transparent bg-transparent pl-2 pr-1 text-sm font-semibold text-ink hover:border-line focus:border-brand-600 focus:outline-none';
  const closeOnEsc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setPanel(null); } };

  const Palette = ({ label, current, onPick, resetLabel }) => (
    <div role="dialog" aria-label={label} onKeyDown={closeOnEsc} className={cx(popover, 'left-2 w-[244px] p-2.5 sm:left-auto')}>
      <div className="grid grid-cols-7 gap-1.5">
        {COLORS.map((c) => (
          <button key={c} type="button" title={c} aria-label={`${label} ${c}`} onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(c)}
            className={cx('h-7 w-7 rounded border', current === c ? 'ring-2 ring-brand-600 ring-offset-1' : 'border-line hover:scale-110')} style={{ backgroundColor: c }} />
        ))}
      </div>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onPick('')}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded border border-line py-1.5 text-sm font-semibold text-muted hover:bg-subtle hover:text-ink">
        <MdFormatColorReset aria-hidden="true" /> {resetLabel}
      </button>
    </div>
  );

  return (
    <div ref={wrapRef} className="relative rounded-md border border-line-strong bg-surface focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/30">
      {/* ---------- Toolbar ---------- */}
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 rounded-t-md border-b border-line bg-subtle px-1.5 py-1">
        {/* font */}
        <select aria-label="Font" value={state.font} onMouseDown={saveSelection} onChange={(e) => setFont(e.target.value)} className={cx(selectCls, 'w-[118px]')}>
          {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        {/* header */}
        <select aria-label="Heading" value={state.header} onMouseDown={saveSelection} onChange={(e) => setHeader(e.target.value)} className={cx(selectCls, 'w-[110px]')}>
          {HEADERS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
        </select>
        <Divider />
        {/* bold italic underline strike */}
        <ToolButton label="Bold" active={!!active.bold} onClick={() => exec('bold')}><MdFormatBold /></ToolButton>
        <ToolButton label="Italic" active={!!active.italic} onClick={() => exec('italic')}><MdFormatItalic /></ToolButton>
        <ToolButton label="Underline" active={!!active.underline} onClick={() => exec('underline')}><MdFormatUnderlined /></ToolButton>
        <ToolButton label="Strikethrough" active={!!active.strike} onClick={() => exec('strikeThrough')}><MdFormatStrikethrough /></ToolButton>
        <Divider />
        {/* color · background */}
        <ToolButton label="Text color" expanded={panel === 'color'} active={panel === 'color'} onClick={() => openPanel('color')}>
          <span className="relative flex flex-col items-center leading-none"><MdFormatColorText /><span className="mt-[-3px] h-[3px] w-4 rounded" style={{ backgroundColor: state.color || '#0F1B2D' }} /></span>
          <MdArrowDropDown className="text-base" aria-hidden="true" />
        </ToolButton>
        <ToolButton label="Background color" expanded={panel === 'background'} active={panel === 'background'} onClick={() => openPanel('background')}>
          <span className="relative flex flex-col items-center leading-none"><MdFormatColorFill /><span className="mt-[-3px] h-[3px] w-4 rounded border border-line" style={{ backgroundColor: state.background && state.background !== '#000000' ? state.background : 'transparent' }} /></span>
          <MdArrowDropDown className="text-base" aria-hidden="true" />
        </ToolButton>
        <Divider />
        {/* lists */}
        <ToolButton label="Numbered list" active={!!active.ol} onClick={() => exec('insertOrderedList')}><MdFormatListNumbered /></ToolButton>
        <ToolButton label="Bulleted list" active={!!active.ul} onClick={() => exec('insertUnorderedList')}><MdFormatListBulleted /></ToolButton>
        <Divider />
        {/* align */}
        <ToolButton label="Align" expanded={panel === 'align'} active={panel === 'align'} onClick={() => openPanel('align')}>
          <AlignIcon /><MdArrowDropDown className="text-base" aria-hidden="true" />
        </ToolButton>
        <Divider />
        {/* emoji · shortcodes */}
        <ToolButton label="Insert emoji" expanded={panel === 'emoji'} active={panel === 'emoji'} onClick={() => openPanel('emoji')}><MdInsertEmoticon /></ToolButton>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => openPanel('shortcodes')} aria-expanded={panel === 'shortcodes'}
          className={cx('flex h-9 items-center gap-1 rounded px-2 text-sm font-semibold', panel === 'shortcodes' ? 'bg-brand-100 text-brand-600' : 'text-muted hover:bg-subtle hover:text-ink')}>
          <MdDataObject className="text-[18px]" aria-hidden="true" /> Shortcodes <MdArrowDropDown className="text-base" aria-hidden="true" />
        </button>
      </div>

      {/* ---------- Popovers ---------- */}
      {panel === 'color' && <Palette label="Text color" current={state.color} onPick={setColor} resetLabel="Default color" />}
      {panel === 'background' && <Palette label="Background color" current={state.background} onPick={setBackground} resetLabel="No background" />}

      {panel === 'align' && (
        <div role="menu" aria-label="Alignment" onKeyDown={closeOnEsc} className={cx(popover, 'left-2 flex gap-1 p-1.5 sm:left-auto')}>
          {ALIGNS.map(({ cmd, label, icon: Icon }) => (
            <button key={cmd} type="button" role="menuitemradio" aria-checked={state.align === cmd} title={label} aria-label={label}
              onMouseDown={(e) => e.preventDefault()} onClick={() => setAlign(cmd)}
              className={cx('flex h-9 w-9 items-center justify-center rounded text-[20px]', state.align === cmd ? 'bg-brand-100 text-brand-600' : 'text-muted hover:bg-subtle hover:text-ink')}>
              <Icon />
            </button>
          ))}
        </div>
      )}

      {panel === 'emoji' && (
        <div role="dialog" aria-label="Emoji picker" onKeyDown={closeOnEsc} className={cx(popover, 'right-2 flex w-[min(340px,calc(100%-16px))] flex-col')}>
          <div className="border-b border-line p-2">
            <label className="flex min-h-[38px] items-center gap-2 rounded border border-line-strong px-2.5 focus-within:border-brand-600">
              <FiSearch className="text-muted" aria-hidden="true" /><span className="sr-only">Search emoji</span>
              <input autoFocus value={emojiQuery} onChange={(e) => setEmojiQuery(e.target.value)} placeholder="Search emoji (e.g. rocket)" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </label>
          </div>
          {!emojiResults && (
            <div role="tablist" aria-label="Emoji categories" className="flex gap-0.5 overflow-x-auto border-b border-line px-1.5 py-1">
              {EMOJI_CATEGORIES.map((c) => (
                <button key={c.id} type="button" role="tab" aria-selected={emojiCat === c.id} title={c.label} aria-label={c.label} onClick={() => setEmojiCat(c.id)}
                  className={cx('flex h-9 w-9 flex-none items-center justify-center rounded text-lg', emojiCat === c.id ? 'bg-brand-100' : 'hover:bg-subtle')}>{c.icon}</button>
              ))}
            </div>
          )}
          <div className="max-h-[260px] overflow-y-auto p-2">
            {!emojiResults && recentEmojis.length > 0 && (
              <>
                <div className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">Recently used</div>
                <div className="mb-2 grid grid-cols-8 gap-0.5">
                  {recentEmojis.map((e) => <button key={`r-${e.code}`} type="button" title={`:${e.code}:`} aria-label={e.name} onClick={() => pickEmoji(e)} className="flex h-9 items-center justify-center rounded text-xl hover:bg-subtle">{e.char}</button>)}
                </div>
              </>
            )}
            <div className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">
              {emojiResults ? `${emojiResults.length} result${emojiResults.length === 1 ? '' : 's'}` : EMOJI_CATEGORIES.find((c) => c.id === emojiCat).label}
            </div>
            <div className="grid grid-cols-8 gap-0.5">
              {visibleEmojis.map((e) => (
                <button key={e.code} type="button" title={`${e.name}  :${e.code}:`} aria-label={e.name} onClick={() => pickEmoji(e)}
                  className="flex h-9 items-center justify-center rounded text-xl hover:bg-subtle focus:bg-brand-100 focus:outline-none">{e.char}</button>
              ))}
            </div>
            {emojiResults && emojiResults.length === 0 && <p className="p-4 text-center text-sm text-muted">No emoji found.</p>}
          </div>
          <div className="border-t border-line px-3 py-2 text-xs text-muted">Tip: type <kbd className="font-mono">:smile:</kbd> in the text to add an emoji.</div>
        </div>
      )}

      {panel === 'shortcodes' && (
        <div role="dialog" aria-label="Shortcodes" onKeyDown={closeOnEsc} className={cx(popover, 'right-2 flex w-[min(320px,calc(100%-16px))] flex-col')}>
          <div className="border-b border-line p-2">
            <label className="flex min-h-[38px] items-center gap-2 rounded border border-line-strong px-2.5 focus-within:border-brand-600">
              <FiSearch className="text-muted" aria-hidden="true" /><span className="sr-only">Search shortcodes</span>
              <input autoFocus value={codeQuery} onChange={(e) => setCodeQuery(e.target.value)} placeholder="Search shortcodes" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </label>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1.5">
            {shortcodeRows.map((s) => (s.isBold ? (
              <div key={`h-${s.title}`} className="px-2 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-ink">{s.title}</div>
            ) : (
              <button key={s.value} type="button" onClick={() => insertShortcode(s)}
                className="flex w-full items-center justify-between gap-3 rounded px-2 py-1.5 text-left hover:bg-subtle focus:bg-brand-50 focus:outline-none">
                <span className="text-sm">{s.title}</span>
                <code className="truncate rounded bg-brand-100 px-1.5 font-mono text-[11px] text-brand-800">[{s.value}]</code>
              </button>
            )))}
            {shortcodeRows.length === 0 && <p className="p-4 text-center text-sm text-muted">No shortcodes found.</p>}
          </div>
        </div>
      )}

      {/* ---------- Editing area ---------- */}
      <div className="relative">
        {counts.empty && <div className="pointer-events-none absolute left-4 top-3 text-muted/70" aria-hidden="true">{placeholder}</div>}
        <div ref={editorRef} role="textbox" aria-multiline="true" aria-label={ariaLabel} contentEditable suppressContentEditableWarning
          onInput={() => { emit(); detectEmojiCode(); }} onKeyDown={onKeyDown} onKeyUp={saveSelection}
          onMouseUp={() => { saveSelection(); refresh(); }} onBlur={saveSelection} onPaste={onPaste}
          className="te-content px-4 py-3 text-base leading-relaxed" style={{ minHeight }} />
      </div>

      {/* :emoji suggestions */}
      {suggest && (
        <ul role="listbox" aria-label="Emoji suggestions" className="absolute z-40 w-64 rounded-md border border-line bg-surface p-1 shadow-pop" style={{ top: suggest.top, left: suggest.left }}>
          {suggest.list.map((e, i) => (
            <li key={e.code} role="option" aria-selected={i === suggest.index} onMouseDown={(ev) => { ev.preventDefault(); pickSuggestion(e); }}
              className={cx('flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm', i === suggest.index ? 'bg-brand-100' : 'hover:bg-subtle')}>
              <span className="text-lg">{e.char}</span><span className="font-mono">:{e.code}:</span>
            </li>
          ))}
        </ul>
      )}

      {/* footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-1.5 text-xs text-muted">
        <span>Type <kbd className="font-mono">:</kbd> for emoji</span>
        <span className={cx(overLimit && 'font-semibold text-danger-700')} aria-live="polite">
          {counts.words} word{counts.words === 1 ? '' : 's'} · {counts.chars}{maxLength ? ` / ${maxLength}` : ''} characters
        </span>
      </div>
    </div>
  );
}