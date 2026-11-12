# Harbor design system

Harbor's UI is built on **shadcn/ui** (Radix primitives + Tailwind + `cva`), with
**lucide-react** icons, **Sonner** toasts, **cmdk** for the command menu and **Recharts**
for charts. Light and dark themes come from CSS variables, so every screen supports both
without extra work.

Reference screen: `src/pages/Accounts-Contacts/Accounts.jsx`. New list pages should match it.

---

## 1. Where things live

| Path | What it is |
|---|---|
| `src/index.css` | Theme variables for light (`:root`) and dark (`.dark`), base styles, older `.btn-*`/`.input`/`.card` classes, page helpers (`.page`, `.page-title`) |
| `tailwind.config.js` | Maps the variables to Tailwind colours (`bg-primary`, `text-muted-foreground`, `border-border`, `bg-brand-50` …) |
| `src/components/ui/*.jsx` | shadcn components: `button`, `badge`, `card`, `input`, `textarea`, `label`, `select`, `checkbox`, `switch`, `radio-group`, `tabs`, `toggle-group`, `dialog`, `sheet`, `dropdown-menu`, `popover`, `tooltip`, `command`, `table`, `breadcrumb`, `skeleton`, `separator`, `scroll-area`, `progress`, `alert`, `avatar`, `hover-card`, `collapsible`, `sonner` |
| `src/components/ui/index.jsx` | Older Harbor components rebuilt on shadcn, with the same props as before: `Modal`, `Drawer`, `Toggle`, `Segmented`, `Tabs`, `Checkbox`, `RadioDot`, `Avatar`, `StatusBadge`, `CloseButton`, `cx`, `initials` |
| `src/components/page.jsx` | Page building blocks: `PageHeader`, `StatCard`, `EmptyState`, `SearchInput`, `DataCard`, `SectionHeading` |
| `src/components/FacetFilter.jsx` | Toolbar filter button with a searchable checklist and counts |
| `src/components/TableSelection.jsx` | Row selection hook, checkboxes, the floating `BulkBar`, `BarSelect`, CSV export |
| `src/components/RowActionsMenu.jsx` | The ⋯ menu on table rows (shadcn DropdownMenu) |
| `src/components/Pagination.jsx` | `usePagination` hook and the table footer |
| `src/lib/utils.js` | `cn()`: joins class names and resolves Tailwind conflicts |

Imports work from `src` (`jsconfig.json` sets `baseUrl: src`), so `import { Button } from 'components/ui/button'` works from any folder.
`components.json` is set up for the shadcn CLI. Run `npx shadcn@latest add <name>`, then change any `@/` imports to plain `src` paths (CRA has no `@/` alias).

## 2. Tokens

Use colour by its **role**. Never use a hex value, `bg-white` or `text-black` in a className, because they break dark mode.

| Role | Classes |
|---|---|
| Page background / card / popover | `bg-canvas` · `bg-card` · `bg-popover` |
| Table header, footers, quiet panels | `bg-subtle` · `bg-muted` |
| Main / secondary text | `text-foreground` · `text-muted-foreground` |
| Borders | `border` (= `border-border`), `border-input` for inputs, `border-line-strong` for stronger lines |
| Primary action / focus | `bg-primary text-primary-foreground` · `ring-ring` |
| Hover background | `hover:bg-accent` |
| Status | `success-*`, `warning-*`, `danger-*`, `brand-*`, `violet-*` (50/100 for backgrounds, 700 for text) |
| Always-dark surface (tooltip, toast) | `bg-inverse text-inverse-foreground` |
| Charts | `hsl(var(--chart-1))` … `hsl(var(--chart-5))` |

Older names (`ink`, `surface`, `line`, `brand-600` …) still work and follow the theme, but new code should use the shadcn names.

Font sizes: `text-xs` 12 · `text-sm` 13 · `text-base` 14 (body) · `text-md` 15 · `text-lg` 17 · `text-2xl` 22 · `text-3xl` 24 (page title).
Use font weights **medium (500)** and **semibold (600)**. Use bold only for big numbers.

## 3. Patterns

**Page**
```jsx
<div className="page">
  <PageHeader title="Contacts" description="One line on what this page is for."
    actions={<><Button variant="outline">…</Button><Button><Plus />Add contact</Button></>} />
  …
</div>
```
The top bar already shows the breadcrumb trail (Section › Page), so don't put "Clients / Accounts" text above titles.

**Table**: `DataCard` with a toolbar (`SearchInput` h-8, `FacetFilter`s, a Reset ghost button, and a View/Columns menu on the right). Then `Table`/`TableHeader`/`TableRow`/`TableHead`/`TableCell`, a ⋯ `RowActionsMenu` on each row, an `EmptyState` for no data or no matches, a `Pagination` footer and a floating `BulkBar` while rows are selected.

**Forms**: group fields in `Card`s with a `SectionHeading`. Use `Label` + `Input`, `Textarea` or `Select` (or the `.field-label` + `.input` classes). Controls are `h-9` tall. Show errors as `text-xs text-danger-700` below the field. On long forms, put the save actions in a sticky footer.

**Drawers**: `<Drawer label width="max-w-[560px]">`. Give it a header (title, short description, `CloseButton`), a scrolling body (`flex-1 overflow-y-auto px-6 py-5`) and a footer (`border-t bg-subtle px-6 py-3.5`, actions on the right).

**Dialogs**: `<Modal title description footer>`. For destructive actions, use `<Button variant="destructive">` and say what will be deleted.

**Feedback**: `toast.success('Saved')`, `toast('Deleted 3 tags', { action: { label: 'Undo', onClick } })`. Older `<ToastBridge message={…} />` keeps working.

**Status**: `<Badge variant="success|warning|danger|info|neutral|violet" dot>`.

**Icons**: `lucide-react`, size 16 (`size-4`) in controls. Buttons size their own icons, so just put `<Plus />` inside.

## 4. App shell

- **Sidebar**: workspace switcher, search, grouped navigation (`MENU_GROUPS` in `config.js`), collapsible sections, an icon rail with flyout menus when collapsed, and a user menu (theme, shortcuts, sign out).
- **Header**: breadcrumbs from the route, search, notifications, theme toggle and the **New** menu.
- **Keyboard**: `Ctrl/⌘ K` opens the command menu, `Ctrl/⌘ B` toggles the sidebar, `A` / `C` / `J` / `T` start a new account / contact / job / task, and `?` lists the shortcuts.
- **Theme**: light, dark or system. It's saved in `harbor.appearance` and applied before first paint, so there's no flash.
