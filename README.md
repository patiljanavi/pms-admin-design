# Harbor Admin — React + Tailwind CSS + React Router (CRA)

Harbor design from the canvas, rebuilt as a real React app:
Login → 6-step Registration (email → code → details → about you → preferences → password) →
Accounts dashboard (search, filters, pagination, add form, guided setup, account drawer with nested tabs) → Kanban board.

---

## Quick start (use this project as-is)

```bash
unzip harbor-admin.zip
cd harbor-admin
npm install
npm start          # opens http://localhost:3000
```

Production build: `npm run build` (output in `build/`).
Needs **Node.js 18 or newer**.

---

## Build it yourself, step by step

### Step 1 — Create the CRA app
```bash
npx create-react-app harbor-admin
cd harbor-admin
```

### Step 2 — Install React Router and Tailwind CSS
Tailwind **v3** is the version that works with Create React App's PostCSS setup.
```bash
npm install react-router-dom@6 react-icons@5
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```
This creates `tailwind.config.js` and `postcss.config.js`.

### Step 3 — Add the Harbor design tokens
Replace `tailwind.config.js` with the one in this project. It defines:

| Token | Value | Used for |
|---|---|---|
| `canvas` | `#F3F5F9` | page background |
| `surface` | `#FFFFFF` | cards, panels, inputs |
| `subtle` | `#F7F9FC` | table headers, footers |
| `ink` | `#0F1B2D` | main text |
| `muted` | `#5A6577` | secondary text |
| `line` / `line-strong` | `#E2E7EF` / `#C9D2E0` | borders |
| `brand-600` / `brand-700` | `#1D4ED8` / `#1E40AF` | primary buttons, links, active states |
| `success-700` | `#17633A` | Active, Paid, completed steps |
| `warning-700` | `#8A5300` | Pending, Billing sub-tabs |
| `danger-700` | `#A3261B` | Suspended, errors, sign out |
| `violet-600` | `#5B3CC4` | Settings sub-tabs, toggles |

Type: **IBM Plex Sans** (UI) and **IBM Plex Mono** (IDs, invoice numbers).
Scale: 12 · 13 · 14 (base) · 16 · 18 · 20 · 26 · 28 · 36 px.
Radius 6–14 px; minimum touch target 44 px.

### Step 4 — Load the fonts
In `public/index.html`, inside `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

### Step 5 — Global styles
Replace `src/index.css` with this project's file: the three `@tailwind` lines, base styles
(font, background, visible keyboard focus, reduced motion) and reusable classes
`.btn-primary`, `.btn-secondary`, `.btn-success`, `.btn-link`, `.input`, `.field-label`, `.card`, `.pill`.

### Step 6 — Router, login and shared data
- `src/index.js` wraps the app in `<BrowserRouter>`, `<AppearanceProvider>`, `<AuthProvider>` and `<DataProvider>`.
- `src/context/AuthContext.js` stores the signed-in user (demo: `localStorage`).
- `src/context/DataContext.js` holds accounts and tags so every page sees the same data.
- `src/context/AppearanceContext.js` applies the font chosen in Settings → My Account.
- `src/components/RequireAuth.jsx` sends signed-out visitors to `/login`.

### Step 7 — Routes (`src/App.js`)
`App.js` creates one route for every item in `MENU` (in `src/config.js`).
Paths listed in `SCREENS` (inside `App.js`) open a real page; the rest show `pages/Placeholder.jsx`.

| URL | Page |
|---|---|
| `/login`, `/register` | `pages/Login.jsx`, `pages/Register.jsx` |
| `/insights` | `pages/Insights.jsx` |
| `/clients/accounts/activeaccounts` (+ `/:accountId` for the drawer) | `pages/Accounts.jsx` |
| `/clients/contacts` (+ `/new` or `/:contactId` for the form drawer) | `pages/Contacts.jsx` + `components/ContactDrawer.jsx` |
| `/tasks/pending` | `pages/Tasks.jsx` (Kanban) |
| `/firmtemp/tags` | `pages/Tags.jsx` |
| `/settings/myaccount` | `pages/MyAccount.jsx` |
| any other menu path | `pages/Placeholder.jsx` |

### Step 8 — Folder structure
```
src/
├── index.js            starts the app (router + providers)
├── index.css           Tailwind + shared classes (.btn-primary, .input, .card …)
├── App.js              routes
├── config.js           URLs, sidebar MENU, font options — all settings in one place
│
├── pages/              one file per screen (one URL each)
│   ├── Login.jsx  Register.jsx
│   ├── Insights.jsx  Accounts.jsx  Contacts.jsx  Tasks.jsx  Tags.jsx  MyAccount.jsx
│   └── Placeholder.jsx  NotFound.jsx
│
├── components/         reusable pieces used by pages
│   ├── AppLayout.jsx  Sidebar.jsx  AuthShell.jsx  RequireAuth.jsx     layout
│   ├── ui.jsx                     Modal, Drawer, Tabs, Segmented, Checkbox, Toggle, Avatar, cx, initials
│   ├── MultiSelect.jsx  OtpInput.jsx  Pagination.jsx  TagChip.jsx    inputs & display
│   ├── TableSelection.jsx         row checkboxes + selection bar + CSV export
│   └── AccountDrawer.jsx  AddAccountDrawer.jsx  ContactDrawer.jsx  SetupWizard.jsx  TagDrawer.jsx   drawers & dialogs
│
├── context/            shared state
│   ├── AuthContext.js  DataContext.js  AppearanceContext.js
│
└── data/               sample data (replace with API calls)
    ├── sampleData.js   team members, tags, accounts, contacts, tasks
    ├── countries.js    countries + dialling codes (phone & address)
    └── revenue.js      Insights calculations
```
**Rules:** a screen goes in `pages/`; anything a page uses goes in `components/`; settings go in `config.js`.

### Step 9 — Run
```bash
npm start
```

---

---

## Sidebar menu
The menu is `MENU` in `src/config.js` (`id`, `label`, `path`, `icon`, `submenu`).
`components/Sidebar.jsx` draws it; `App.js` turns every path into a route.

- Add a menu item: add an entry to `MENU` (import its icon at the top of `config.js`).
- Give it a real screen: create the page in `src/pages/`, import it in `App.js`, add its path to `SCREENS`.

## How the flow works
1. **/login** — enter any email + password → goes straight to **/accounts**.
2. **Create an account** → **/register**: Email → 6-digit code (any 6 digits work in the demo; paste supported, 30 s resend timer) → name, company, address → account type / role / seats (− + stepper and slider) → interests, notifications, theme → password + terms → back to **/login** with your email filled in.
3. **Sidebar** — Accounts, Projects board, Sign out. On phones it becomes a top bar with a menu button.

## Responsive behaviour
- Below 1024 px the sidebar becomes a top bar + menu; the auth brand panel shrinks to a header.
- Stat cards: 2 columns on small screens, 4 on large.
- Wide tables and the board scroll sideways inside their own box; the page never scrolls sideways.
- Forms switch from 2 columns / label-left rows to a single column on phones.

## Firm Templates
`src/pages/firmTemplates/` — `FirmTemplatesLayout.jsx` (title + 9 tabs + `<Outlet />`), `TemplatesTable.jsx` (shared screen: cards, search, filter, checkboxes + bulk actions, rows per page, Add / Edit drawer) and one small file per tab with its `columns`, `fields` and sample `rows`.
Routes are the nested `<Route path={FIRM_TEMPLATES_PATH}>` block in `App.js`.

## Tests
`npm test` runs `src/smoke.test.js` (every main page and all 9 Firm Templates tabs open without crashing) and `src/firmTemplates.test.js` (create, edit, select, bulk delete and filter on a templates tab).

## Connecting a real backend
Replace the demo pieces:
- `AuthContext.signIn` → call your login API and store the session/token.
- Register step 1 → call "send code"; step 2 → call "verify code"; last step → "create account".
- `data/sampleData.js` and `data/revenue.js` → fetch from your API (for example with `useEffect` or React Query), or load it inside `context/DataContext.js`.
