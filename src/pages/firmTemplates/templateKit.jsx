/**
 * Building blocks shared by the Firm Templates list pages and full-page template editors
 * (Tasks, Emails, Chats, the generic TemplatesTable and the layout's type navigation).
 * Everything here is presentational; data and behaviour stay in the pages.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle, ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, Briefcase, Check, CheckSquare, ChevronDown, ChevronLeft,
  ChevronRight, ChevronUp, ClipboardList, FileSignature, Flag, Folder, GripVertical, Mail, MessageSquare, Plus, Receipt, Trash2, UserRoundX,
} from 'lucide-react';
import { cn } from 'lib/utils';
import { Avatar, initials } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { SimpleTooltip, TooltipProvider } from '../../components/ui/tooltip';
import { TableHead } from '../../components/ui/table';
import { SectionHeading } from '../../components/page';
import TagChip from '../../components/TagChip';
import { useData } from '../../context/DataContext';

/* ------------------------------------------------------------------ */
/* Formatting + small display helpers                                  */
/* ------------------------------------------------------------------ */

export const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

/** Tooltip that works with or without an app-level TooltipProvider. */
export function Tip({ label, side, children }) {
  if (!label) return children;
  return <TooltipProvider delayDuration={300}><SimpleTooltip label={label} side={side}>{children}</SimpleTooltip></TooltipProvider>;
}

export const Dash = () => <span className="text-muted-foreground/60">—</span>;

/** Status / priority → Badge variant */
export const STATUS_BADGE = { Active: 'success', Draft: 'warning', Inactive: 'neutral' };
export const PRIORITY_BADGE = { Low: 'neutral', Medium: 'info', High: 'warning', Urgent: 'danger' };
export const STATUS_DOT = { Active: 'bg-success-500', Draft: 'bg-warning-500', Inactive: 'bg-muted-foreground/50' };
export const PRIORITY_DOT = { Low: 'bg-muted-foreground/50', Medium: 'bg-brand-500', High: 'bg-warning-500', Urgent: 'bg-danger-500' };

/** Section title row above a template list (the layout already shows the page title). */
export function ListHeader({ title, description, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        {description && <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * Toolbar filter that looks like a FacetFilter chip but is a native <select> underneath
 * (keyboard/phone friendly, and labelled by `label`).
 * options: string[] | { value, label }[] · allValue: value meaning "no filter"
 */
export function SelectFilter({ label, icon: Icon, value, onChange, options, allValue = 'All' }) {
  const id = useId();
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const current = opts.find((o) => o.value === value);
  const active = value !== allValue;
  return (
    <div className={cn('relative inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md border border-line-strong bg-card pl-2.5 pr-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent focus-within:ring-2 focus-within:ring-ring/50',
      !active && 'border-dashed')}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <span aria-hidden="true" className="flex items-center gap-1.5">
        {Icon && <Icon className="size-3.5 text-muted-foreground" />}
        {label}
        {active && (
          <>
            <span className="mx-0.5 h-4 w-px bg-border" />
            <span className="max-w-[140px] truncate rounded bg-secondary px-1.5 text-xs font-medium text-secondary-foreground">{current?.label ?? value}</span>
          </>
        )}
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 size-full cursor-pointer appearance-none rounded-md bg-card text-sm text-foreground opacity-0">
        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

/** Sortable column header (same as the Accounts table). sort: { col, dir } | null */
export function SortHead({ label, col, sort, setSort, className }) {
  const active = sort?.col === col;
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => setSort({ col, dir: active && sort.dir === 'asc' ? 'desc' : 'asc' })}
        className={cn('-ml-2 inline-flex h-7 items-center gap-1.5 rounded-md px-2 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50', active && 'text-foreground')}>
        {label}<Icon className={cn('size-3.5', !active && 'opacity-50')} aria-hidden="true" />
      </button>
    </TableHead>
  );
}

/** Sort a list by a key getter; returns the original order when sort is null. */
export function sortRows(list, sort, getters) {
  if (!sort || !getters[sort.col]) return list;
  const get = getters[sort.col];
  const dir = sort.dir === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => String(get(a) ?? '').localeCompare(String(get(b) ?? ''), undefined, { numeric: true }) * dir);
}

/** Template name cell: icon tile, name (opens the editor) and a one-line preview. */
export function NameCell({ icon: Icon, name, preview, onOpen }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {Icon && (
        <span className="flex size-8 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground [&_svg]:size-4" aria-hidden="true">
          <Icon />
        </span>
      )}
      <div className="min-w-0">
        <button type="button" onClick={onOpen}
          className="block max-w-full truncate rounded-sm text-left font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          {name}
        </button>
        {preview && <div className="truncate text-xs text-muted-foreground">{preview}</div>}
      </div>
    </div>
  );
}

export function PersonCell({ name }) {
  if (!name) return <Dash />;
  return <span className="flex items-center gap-2 whitespace-nowrap text-sm"><Avatar text={initials(name)} size="xs" />{name}</span>;
}

export function PeopleStack({ names }) {
  if (!names?.length) return <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-muted-foreground/80"><UserRoundX className="size-3.5" aria-hidden="true" />Unassigned</span>;
  return (
    <Tip label={names.join(', ')}>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1">
          {names.slice(0, 3).map((n) => <span key={n} className="rounded-full ring-2 ring-card"><Avatar text={initials(n)} size="xs" /></span>)}
        </div>
        <span className="max-w-[140px] truncate text-sm">{names.length === 1 ? names[0] : `${names[0].split(' ')[0]} +${names.length - 1}`}</span>
      </div>
    </Tip>
  );
}

export function TagList({ tags, max = 2 }) {
  if (!tags?.length) return <Dash />;
  const rest = tags.length - max;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.slice(0, max).map((t) => <TagChip key={t.value} tag={t} size="xs" />)}
      {rest > 0 && (
        <Tip label={tags.slice(max).map((t) => t.label).join(', ')}>
          <span className="inline-flex h-5 items-center rounded-md border bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">+{rest}</span>
        </Tip>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Firm Templates type navigation (used by both layouts)               */
/* ------------------------------------------------------------------ */

export const TEMPLATE_TABS = [
  { to: '/firmtemp/templates/tasks', label: 'Tasks', icon: CheckSquare, dataKey: 'taskTemplates' },
  { to: '/firmtemp/templates/emails', label: 'Emails', icon: Mail, dataKey: 'emailTemplates' },
  { to: '/firmtemp/templates/clientfacing', label: 'Client-facing Status', icon: Flag, dataKey: 'clientFacingJobs' },
  { to: '/firmtemp/templates/jobs', label: 'Jobs', icon: Briefcase, dataKey: 'jobTemplates' },
  { to: '/firmtemp/templates/chats', label: 'Chats', icon: MessageSquare, dataKey: 'chatTemplates' },
  { to: '/firmtemp/templates/folders', label: 'Folders', icon: Folder, dataKey: 'folderTemplates' },
  { to: '/firmtemp/templates/invoices', label: 'Invoices', icon: Receipt, dataKey: 'invoiceTemplates' },
  { to: '/firmtemp/templates/proposals', label: 'Proposals & ELs', icon: FileSignature, dataKey: 'proposalTemplates' },
  { to: '/firmtemp/templates/organizers', label: 'Organizers', icon: ClipboardList, dataKey: 'organizerTemplates' },
];

/**
 * Line tabs with icons and live counts (tablet / desktop) + a native select on phones.
 * The links keep their plain label as the accessible name ("Emails"), counts are decorative.
 */
export function TemplateTypeNav({ className }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const data = useData() || {};
  const current = TEMPLATE_TABS.find((t) => pathname.toLowerCase().startsWith(t.to)) || TEMPLATE_TABS[0];
  const countOf = (t) => (Array.isArray(data[t.dataKey]) ? data[t.dataKey].length : null);

  // Scroll arrows when the tabs don't fit
  const scroller = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const updateArrows = () => {
    const el = scroller.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };
  const scrollBy = (dir) => scroller.current?.scrollBy?.({ left: dir * 240, behavior: 'smooth' });

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, []);

  // Keep the active tab visible when the page changes (horizontal only, so the page doesn't jump)
  useEffect(() => {
    const el = scroller.current;
    const active = el?.querySelector('[aria-current="page"]');
    if (el && active && el.scrollTo) {
      const target = active.offsetLeft - (el.clientWidth - active.clientWidth) / 2;
      el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
    }
    updateArrows();
  }, [pathname]);

  const CurrentIcon = current.icon;

  return (
    <div className={className}>
      {/* Phones: dropdown */}
      <div className="pb-3 pt-1 md:hidden">
        <label htmlFor="template-type" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Template type</label>
        <div className="relative">
          <CurrentIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
          <select id="template-type" value={current.to} onChange={(e) => navigate(e.target.value)}
            className="h-10 w-full appearance-none rounded-md border border-input bg-card pl-9 pr-9 text-sm font-medium text-foreground shadow-xs transition-[box-shadow,border-color] focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-ring/20">
            {TEMPLATE_TABS.map((t) => {
              const n = countOf(t);
              return <option key={t.to} value={t.to}>{n == null ? t.label : `${t.label} (${n})`}</option>;
            })}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        </div>
      </div>

      {/* Tablets & desktop: line tabs */}
      <div className="relative hidden border-b md:block">
        {canLeft && (
          <>
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-canvas to-transparent" aria-hidden="true" />
            <button type="button" onClick={() => scrollBy(-1)} aria-label="Scroll tabs left"
              className="absolute left-0 top-1/2 z-20 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-raised transition-colors hover:text-foreground">
              <ChevronLeft className="size-4" />
            </button>
          </>
        )}

        <nav ref={scroller} onScroll={updateArrows} aria-label="Template types"
          className="-mb-px flex gap-1 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TEMPLATE_TABS.map((t) => {
            const { to, label, icon: Icon } = t;
            const isActive = current.to === to;
            const n = countOf(t);
            return (
              <Link key={to} to={to} aria-label={label} aria-current={isActive ? 'page' : undefined}
                className={cn('group relative flex h-11 flex-none items-center rounded-t-md px-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                <span className="flex items-center gap-2 whitespace-nowrap rounded-md px-2 py-1.5 transition-colors group-hover:bg-accent">
                  <Icon className={cn('size-4', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} aria-hidden="true" />
                  {label}
                  {n != null && (
                    <span aria-hidden="true" className={cn('min-w-[20px] rounded-full px-1.5 text-center text-[11px] font-semibold leading-[18px] tabular-nums transition-colors',
                      isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>{n}</span>
                  )}
                </span>
                <span aria-hidden="true" className={cn('absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-colors', isActive ? 'bg-primary' : 'bg-transparent group-hover:bg-line-strong')} />
              </Link>
            );
          })}
        </nav>

        {canRight && (
          <>
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-canvas to-transparent" aria-hidden="true" />
            <button type="button" onClick={() => scrollBy(1)} aria-label="Scroll tabs right"
              className="absolute right-0 top-1/2 z-20 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-raised transition-colors hover:text-foreground">
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Full-page template editor                                           */
/* ------------------------------------------------------------------ */

/** Editor header: back link, title + status badges, short description, optional meta on the right. */
export function EditorHeader({ backLabel, backAriaLabel, onBack, title, icon: Icon, badges, description, meta }) {
  return (
    <header className="flex flex-col gap-3">
      <button type="button" onClick={onBack} aria-label={backAriaLabel}
        className="-ml-1.5 inline-flex w-fit items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        <ArrowLeft className="size-4" aria-hidden="true" />{backLabel}
      </button>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span className="mt-0.5 flex size-10 flex-none items-center justify-center rounded-xl border bg-card text-primary shadow-card [&_svg]:size-5" aria-hidden="true"><Icon /></span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
              {badges}
            </div>
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {meta && <div className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">{meta}</div>}
      </div>
    </header>
  );
}

/** Generic error summary shown above the form after a failed save. */
export function ErrorSummary({ show }) {
  if (!show) return null;
  return (
    <div role="alert" className="flex items-center gap-2.5 rounded-lg border border-danger-100 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
      <AlertCircle className="size-4 flex-none" aria-hidden="true" />Please fix the highlighted fields.
    </div>
  );
}

/** Card with an icon + SectionHeading, used for every editor section. */
export function FormSection({ icon: Icon, title, description, action, children, className, bodyClassName }) {
  return (
    <Card className={cn('p-5 sm:p-6', className)}>
      <div className="mb-5 flex items-start gap-3">
        {Icon && (
          <span className="flex size-8 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground [&_svg]:size-4" aria-hidden="true"><Icon /></span>
        )}
        <SectionHeading title={title} description={description} action={action} className="min-w-0 flex-1" />
      </div>
      <div className={cn('flex flex-col gap-5', bodyClassName)}>{children}</div>
    </Card>
  );
}

/** Label + control + inline error / hint. Pass the control's id as `id`. */
export function Field({ id, label, required, hint, error, children, className }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      {label && (
        <Label htmlFor={id} className="flex items-center gap-0.5">
          {label}{required && <span className="text-danger-700" aria-hidden="true">*</span>}
        </Label>
      )}
      {children}
      {error
        ? <p id={id ? `${id}-error` : undefined} className="flex items-center gap-1.5 text-xs font-medium text-danger-700"><AlertCircle className="size-3.5 flex-none" aria-hidden="true" />{error}</p>
        : hint && <p id={id ? `${id}-hint` : undefined} className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Props for an Input/Select that may show an error (aria-invalid + red border). */
export const invalidProps = (id, error) => (error ? { 'aria-invalid': true, 'aria-describedby': `${id}-error` } : {});

/** Settings-style row with a switch. The switch is named by `label`. */
export function SwitchRow({ label, description, checked, onChange }) {
  const id = useId();
  return (
    <div className={cn('flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors', checked ? 'border-primary/30 bg-primary/[0.03]' : 'bg-subtle/60')}>
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-sm font-medium text-foreground">{label}</label>
        {description && <p id={`${id}-desc`} className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      <Switch id={id} aria-label={label} aria-describedby={description ? `${id}-desc` : undefined} checked={!!checked} onCheckedChange={onChange} className="mt-0.5" />
    </div>
  );
}

/**
 * Segmented single-choice control with coloured dots (role="radiogroup", arrow keys move).
 * options: string[] · dots: { [option]: 'bg-…' }
 */
export function ChoiceGroup({ label, options, value, onChange, dots = {} }) {
  const refs = useRef([]);
  const onKeyDown = (e, i) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + options.length) % options.length;
    onChange(options[next]);
    refs.current[next]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-fit max-w-full flex-wrap gap-0.5 rounded-lg bg-muted p-[3px]">
      {options.map((o, i) => {
        const on = value === o;
        return (
          <button key={o} ref={(el) => { refs.current[i] = el; }} type="button" role="radio" aria-checked={on}
            tabIndex={on || (!options.includes(value) && i === 0) ? 0 : -1}
            onClick={() => onChange(o)} onKeyDown={(e) => onKeyDown(e, i)}
            className={cn('inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              on ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground')}>
            {dots[o] && <span className={cn('size-2 rounded-full', dots[o])} aria-hidden="true" />}
            {o}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Re-orderable checklist (subtasks / client tasks). Drag the grip or use the arrow buttons.
 * Accessible names: "<itemLabel> N", "<itemLabel> N <doneSuffix>", "Move <item> N up/down", "Delete <item> N".
 */
export function ChecklistEditor({ items, itemLabel, doneSuffix, placeholder, addLabel, hint, onAdd, onText, onToggle, onDelete, onMove }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const lower = itemLabel.toLowerCase();
  return (
    <div className="flex flex-col gap-2">
      {items.length > 0 && (
        <ol className="flex flex-col gap-1.5">
          {items.map((s, index) => {
            const n = index + 1;
            return (
              <li key={s.id} draggable
                onDragStart={() => setDragIndex(index)} onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                onDragOver={(e) => { e.preventDefault(); setOverIndex(index); }}
                onDrop={() => { onMove(dragIndex, index); setDragIndex(null); setOverIndex(null); }}
                className={cn('group flex items-center gap-1.5 rounded-lg border bg-card py-1 pl-1 pr-1 shadow-xs transition-[border-color,opacity,box-shadow] hover:border-line-strong focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/15',
                  dragIndex === index && 'opacity-50', overIndex === index && dragIndex !== index && 'border-primary')}>
                <span className="flex h-7 w-5 flex-none cursor-grab items-center justify-center text-muted-foreground/50 transition-colors group-hover:text-muted-foreground active:cursor-grabbing" title="Drag to reorder" aria-hidden="true">
                  <GripVertical className="size-4" />
                </span>
                <Checkbox checked={!!s.checked} onCheckedChange={() => onToggle(s.id)} aria-label={`${itemLabel} ${n} ${doneSuffix}`} />
                <input value={s.text} onChange={(e) => onText(s.id, e.target.value)} aria-label={`${itemLabel} ${n}`}
                  placeholder={typeof placeholder === 'function' ? placeholder(n) : placeholder}
                  className={cn('h-8 min-w-0 flex-1 bg-transparent px-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0',
                    s.checked && 'text-muted-foreground line-through decoration-muted-foreground/50')} />
                <div className="flex flex-none items-center opacity-70 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => onMove(index, index - 1)} disabled={index === 0} aria-label={`Move ${lower} ${n} up`} className="text-muted-foreground">
                    <ChevronUp />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => onMove(index, index + 1)} disabled={index === items.length - 1} aria-label={`Move ${lower} ${n} down`} className="text-muted-foreground">
                    <ChevronDown />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => onDelete(s.id)} aria-label={`Delete ${lower} ${n}`} className="text-muted-foreground hover:bg-danger-50 hover:text-danger-700">
                    <Trash2 />
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <Button type="button" variant="outline" onClick={onAdd} className="w-full border-dashed text-muted-foreground shadow-none hover:text-foreground">
        <Plus />{addLabel}
      </Button>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * Floating action bar that sticks to the bottom of the viewport while editing:
 * Delete (edit mode) and save state on the left · Cancel / Save / Save & Exit on the right.
 */
export function EditorActionBar({ isEdit, dirty, saving, onDelete, onCancel, onSave, onSaveExit }) {
  return (
    <div className="sticky bottom-4 z-20 mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/95 px-3 py-2.5 shadow-pop backdrop-blur supports-[backdrop-filter]:bg-card/85 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        {isEdit && (
          <Button type="button" variant="ghost" size="sm" onClick={onDelete} disabled={saving} className="text-danger-700 hover:bg-danger-50 hover:text-danger-700">
            <Trash2 />Delete
          </Button>
        )}
        <span className="hidden items-center gap-2 text-sm text-muted-foreground sm:inline-flex" aria-live="polite">
          {dirty
            ? <><span className="size-2 rounded-full bg-warning-500" aria-hidden="true" />Unsaved changes</>
            : isEdit
              ? <><Check className="size-4 text-success-600" aria-hidden="true" />All changes saved</>
              : <><span className="size-2 rounded-full bg-muted-foreground/40" aria-hidden="true" />Not saved yet</>}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="button" variant="outline" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        <Button type="button" onClick={onSaveExit} disabled={saving}>{saving ? 'Saving…' : 'Save & Exit'}</Button>
      </div>
    </div>
  );
}

/** "Not found" state for an editor URL that points at a deleted / unknown template. */
export function EditorNotFound({ title, backTo, backLabel }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">It may have been deleted, or the link is out of date.</p>
      <Button asChild className="mt-2"><Link to={backTo}><ArrowLeft />{backLabel}</Link></Button>
    </Card>
  );
}

/** Small "status" badges for the editor header. */
export function TemplateStatusBadge({ status }) {
  return <Badge variant={STATUS_BADGE[status] || 'neutral'} dot shape="pill">{status}</Badge>;
}
