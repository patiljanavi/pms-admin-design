import { Check, PlusCircle } from 'lucide-react';
import { cn } from 'lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from './ui/command';

/**
 * shadcn data-table "faceted filter": a dashed toolbar button that opens a searchable
 * checklist with per-option counts. Selected values show as compact badges on the button.
 *
 * options: [{ value, label, icon?, count?, render? }] · value: string[] · onChange(string[])
 */
export default function FacetFilter({ title, options, value, onChange, icon: TitleIcon = PlusCircle, searchPlaceholder }) {
  const selected = new Set(value);
  const toggle = (v) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v); else next.add(v);
    onChange([...next]);
  };
  return (
    <Popover>
      <PopoverTrigger className={cn('inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md border border-dashed border-line-strong bg-card px-2.5 text-sm font-medium shadow-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:bg-accent',
        selected.size > 0 && 'border-solid')}>
        <TitleIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
        {title}
        {selected.size > 0 && (
          <>
            <span className="mx-0.5 h-4 w-px bg-border" aria-hidden="true" />
            {selected.size > 2
              ? <span className="rounded bg-secondary px-1.5 text-xs font-medium">{selected.size} selected</span>
              : options.filter((o) => selected.has(o.value)).map((o) => <span key={o.value} className="max-w-[110px] truncate rounded bg-secondary px-1.5 text-xs font-medium">{o.label}</span>)}
          </>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder || `Filter ${title.toLowerCase()}…`} className="h-10 text-sm" />
          <CommandList className="max-h-72">
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const on = selected.has(o.value);
                const Icon = o.icon;
                return (
                  <CommandItem key={o.value} value={`${o.label} ${o.value}`} onSelect={() => toggle(o.value)}>
                    <span className={cn('flex size-4 items-center justify-center rounded-[4px] border', on ? 'border-primary bg-primary text-primary-foreground' : 'border-line-strong [&_svg]:invisible')}>
                      <Check className="!size-3" strokeWidth={3} />
                    </span>
                    {Icon && <Icon className="text-muted-foreground" />}
                    <span className="min-w-0 flex-1 truncate">{o.render ? o.render(o) : o.label}</span>
                    {o.count != null && <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">{o.count}</span>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selected.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => onChange([])} className="justify-center text-center text-muted-foreground">Clear filter</CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
