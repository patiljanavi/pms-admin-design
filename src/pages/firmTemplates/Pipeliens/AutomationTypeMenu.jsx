import { Fragment } from 'react';
import {
  CheckSquare, ClipboardList, Eye, FileSignature, FolderTree, Mail, MessageSquare, Plus, Receipt, Tags, UserCog, Zap,
} from 'lucide-react';
import { AUTOMATION_TYPES } from '../../../data/pipelinesdata';
import { Button } from '../../../components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { cn } from 'lib/utils';

/** Icon for each automation type (falls back to a bolt). */
const ICONS = {
  'Send Email': Mail,
  'Send Invoice': Receipt,
  'Send Proposal/Els': FileSignature,
  'Create Organizer': ClipboardList,
  'Apply folder template': FolderTree,
  'Update account tags': Tags,
  'Create Task': CheckSquare,
  'Send message': MessageSquare,
  'Update client-facing job status': Eye,
  'Update job assignees': UserCog,
};
export const automationIcon = (type) => ICONS[type] || Zap;

/** Menu groups (display only). Types not listed here land in "Other", so nothing is ever hidden. */
const GROUPS = [
  { label: 'Send to client', types: ['Send Email', 'Send message', 'Send Invoice', 'Send Proposal/Els'] },
  { label: 'Create', types: ['Create Organizer', 'Create Task', 'Apply folder template'] },
  { label: 'Update', types: ['Update account tags', 'Update client-facing job status', 'Update job assignees'] },
];
const grouped = () => {
  const known = new Set(GROUPS.flatMap((g) => g.types));
  const all = new Set(AUTOMATION_TYPES.map((a) => a.type));
  const groups = GROUPS.map((g) => ({ ...g, types: g.types.filter((t) => all.has(t)) }));
  const other = AUTOMATION_TYPES.map((a) => a.type).filter((t) => !known.has(t));
  if (other.length) groups.push({ label: 'Other', types: other });
  return groups.filter((g) => g.types.length);
};

/** "+ Add automation" button with a menu of the automation types (shadcn DropdownMenu). */
export default function AutomationTypeMenu({ label = 'Add automation', onPick, className, align = 'left' }) {
  const groups = grouped();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline"
          className={cn('w-full border-dashed border-line-strong text-muted-foreground shadow-none hover:border-solid hover:text-foreground data-[state=open]:border-solid data-[state=open]:bg-accent data-[state=open]:text-foreground', className)}>
          <Plus aria-hidden="true" />{label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent aria-label="Automation types" align={align === 'right' ? 'end' : 'start'}
        className="max-h-80 w-[var(--radix-dropdown-menu-trigger-width)] min-w-64 overflow-y-auto">
        {groups.map((g, gi) => (
          <Fragment key={g.label}>
            {gi > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel>{g.label}</DropdownMenuLabel>
            {g.types.map((type) => {
              const Icon = automationIcon(type);
              return (
                <DropdownMenuItem key={type} onSelect={() => onPick(type)}>
                  <Icon className="text-muted-foreground" aria-hidden="true" />{type}
                </DropdownMenuItem>
              );
            })}
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
