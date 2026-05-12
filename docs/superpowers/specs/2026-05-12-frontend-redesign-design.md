# VaxWise Frontend Redesign — Design Spec
**Date:** 2026-05-12  
**Status:** Approved  
**Scope:** Full overhaul — visual identity, icons, UX patterns, layout, implementation system

---

## 1. Decisions Summary

| Decision | Choice |
|---|---|
| Scope | Full overhaul — icons, UX, layout, visual identity |
| Theme | Dark Slate + Teal |
| Navigation | Fixed sidebar (redesigned) |
| Implementation | Tailwind CSS v4 |
| Icon library | Lucide React |
| Logo accent | Teal icon box (logo image retained as-is) |
| Font | Inter (replaces DM Sans + Playfair Display split) |

---

## 2. Colour Tokens

All colours map directly to Tailwind v4 CSS variables and utility classes.

| Token | Hex | Tailwind class | Usage |
|---|---|---|---|
| `bg-slate-900` | `#0F172A` | `bg-slate-900` | Page background |
| `bg-slate-800` | `#1E293B` | `bg-slate-800` | Sidebar, cards, panels |
| `border-slate-700` | `#334155` | `border-slate-700` | All borders |
| `text-slate-50` | `#F8FAFC` | `text-slate-50` | Primary text |
| `text-slate-400` | `#94A3B8` | `text-slate-400` | Muted / secondary text |
| `text-slate-500` | `#64748B` | `text-slate-500` | Labels, placeholders |
| `teal-500` | `#14B8A6` | `text-teal-500` | Primary accent — active states, CTAs, progress |
| `teal-600` | `#0D9488` | `hover:bg-teal-600` | Hover state for teal buttons |
| `green-500` | `#22C55E` | `text-green-500` | Success, healthy status |
| `red-500` | `#EF4444` | `text-red-500` | Danger, errors, high risk |
| `amber-500` | `#F59E0B` | `text-amber-500` | Warnings, due-soon, medium risk |

---

## 3. Typography

**Font:** Inter — loaded from Google Fonts. Single font family replaces the current DM Sans + Playfair Display split.

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

| Role | Tailwind | Size | Weight |
|---|---|---|---|
| Page title | `text-2xl font-bold` | 24px | 700 |
| Section heading | `text-lg font-semibold` | 18px | 600 |
| Stat card value | `text-3xl font-bold` | 30px | 700 |
| Body | `text-sm` | 14px | 400 |
| Label | `text-xs font-semibold uppercase tracking-wider` | 11px | 600 |
| Caption / muted | `text-xs text-slate-400` | 12px | 400 |

---

## 4. Layout Shell

### Sidebar
- **Width:** 220px fixed, never collapses on desktop
- **Background:** `bg-slate-800` with `border-r border-slate-700`
- **Logo block:** 32×32 teal icon box (`bg-teal-500 rounded-lg`) + "VaxWise" wordmark in Inter 700 + "Biosecurity · ZA" subtitle in `text-xs text-slate-500`
- **Farm selector:** Styled pill button (`bg-slate-900 border border-teal-500/30 rounded-lg`) showing active farm name with a Home icon; clicking opens a dropdown select
- **Nav groups:** Three labelled sections — Core, Management, Compliance — plus Admin section at the bottom
- **Active link style:** `bg-teal-500/10 border-l-2 border-teal-500 text-teal-500 font-semibold`
- **Inactive link style:** `border-l-2 border-transparent text-slate-500 hover:text-slate-300`
- **Icons:** All Lucide React SVGs, 15×15px, `stroke-width={1.75}`
- **User area:** Avatar initials circle (`bg-teal-500 text-slate-900`), name, role, Sign Out button (`bg-red-500/10 text-red-300 border border-red-500/20`)

### Nav links and icons

| Page | Lucide icon |
|---|---|
| Dashboard | `LayoutGrid` |
| Animals | `Beef` (or `PawPrint`) |
| Vaccinations | `Syringe` |
| Health | `Activity` |
| Certificates | `FileText` |
| Farms | `Home` |
| Login Monitor | `ShieldAlert` |
| Settings | `Settings` |

### Main content area
- **Background:** `bg-slate-900`
- **Padding:** `p-8` (32px) desktop, `p-4` (16px) mobile
- **Page header pattern:** Page title (`text-2xl font-bold text-slate-50`) + subtitle row with farm info and LIVE badge + primary CTA button top-right

### Mobile
- Sidebar hidden by default; hamburger button in a sticky top bar opens it as an overlay drawer with a backdrop
- `useMobile` hook threshold stays at 768px

---

## 5. Component Patterns

### Stat Cards
```
bg-slate-800 border border-slate-700 rounded-xl p-4
- Header row: label (text-xs uppercase text-slate-500) + icon chip (28×28 bg-teal-500/10 rounded-md)
- Value: text-3xl font-bold text-slate-50
- Sub-line: text-xs text-teal-500 or text-green-500
- Progress bar (coverage card): h-1 bg-slate-700 rounded-full → inner div bg-teal-500
```

### Buttons
| Variant | Classes |
|---|---|
| Primary | `bg-teal-500 text-slate-900 font-semibold rounded-lg hover:bg-teal-600` |
| Outline | `border border-teal-500 text-teal-500 rounded-lg hover:bg-teal-500/10` |
| Ghost | `bg-teal-500/10 text-teal-500 border border-teal-500/20 rounded-lg` |
| Danger | `bg-red-500/10 text-red-300 border border-red-500/20 rounded-lg` |
| Disabled | `opacity-50 cursor-not-allowed` |

### Status Badges
Pill shape: `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border`

| Status | Colour |
|---|---|
| Active | `bg-teal-500/10 text-teal-400 border-teal-500/25` |
| Under Treatment | `bg-amber-500/10 text-amber-400 border-amber-500/25` |
| Quarantined | `bg-red-500/10 text-red-400 border-red-500/25` |
| Inactive | `bg-slate-500/10 text-slate-400 border-slate-500/25` |

Risk level badges use `rounded-md` (rectangular) instead of pill.

### Data Tables
Structure: toolbar (search input + action buttons) → `<table>` → pagination footer. All inside `bg-slate-800 border border-slate-700 rounded-xl overflow-hidden`.

- Header row: `text-xs font-semibold text-slate-500 uppercase tracking-wide`
- Body rows: `border-b border-slate-700/50 hover:bg-slate-700/20`
- Compliance column: mini progress bar + numeric score
- Action column: Ghost `View` button aligned right

### Forms
- Label: `text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5`
- Input default: `bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-50 placeholder:text-slate-500`
- Input focus: `focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500`
- Input error: `border-red-500/50` + `<p class="text-xs text-red-400 mt-1">` below
- Input valid: `border-teal-500/40`

### Empty States
Centred in card: icon in 44×44 `bg-slate-900 border border-slate-700 rounded-xl` + heading + helper text + primary action button.

### Loading Skeletons
`bg-slate-700 rounded animate-pulse` divs at appropriate widths/heights to match the shape of the content being loaded. Applied per-card, not full-page.

### Alert / Notification Banners
`rounded-xl p-4 border` with left-accent border pattern:
- Danger outbreak: `bg-red-500/10 border-red-500/30 text-red-300`
- Warning: `bg-amber-500/10 border-amber-500/30 text-amber-300`
- Info: `bg-teal-500/10 border-teal-500/30 text-teal-300`

---

## 6. Icon System

**Library:** `lucide-react` (install: `npm install lucide-react`)

All current unicode symbols replaced:

| Current | Replacement |
|---|---|
| `▦` Dashboard | `<LayoutGrid size={15} />` |
| `◈` Animals | `<Beef size={15} />` |
| `◉` Vaccinations | `<Syringe size={15} />` |
| `♥` Health | `<Activity size={15} />` |
| `◑` Certificates | `<FileText size={15} />` |
| `◧` Farms | `<Home size={15} />` |
| `◎` Admin | `<ShieldAlert size={15} />` |
| `⊙` Settings | `<Settings size={15} />` |
| `🛡️` Logo box | Shield SVG inline (kept as branded element) |

Standard props: `size={15} strokeWidth={1.75}` for nav; `size={14} strokeWidth={2}` for card icons.

---

## 7. UX Improvements

- **Loading skeletons** on every data-fetching page (replaces blank flash)
- **Empty states** on all list/table pages with contextual CTA
- **Inline form validation** already in place via `useFormErrors` — update visual treatment to new token colours
- **LIVE indicator** on Dashboard (already implemented) — retain with updated styling
- **Page-level error boundary** — wrap each page in a simple error card (red border, reload button)
- **Smooth sidebar transitions** — `transition-colors duration-150` on nav links

---

## 8. File Structure Changes

### New files
- `vaxwise-client/src/index.css` — Tailwind v4 `@import "tailwindcss"` + `@theme` block with custom tokens; replaces current scattered root variables
- No new component files beyond what already exists — refactor in-place

### Modified files (all pages + Layout)
Every `.jsx` page and `Layout.jsx` — inline style objects removed, replaced with Tailwind utility class strings.

### Packages to add
```
npm install lucide-react
npm install tailwindcss @tailwindcss/vite
```

### Packages to remove
None — Tailwind v4 uses a Vite plugin, no `tailwind.config.js` needed.

---

## 9. Pages Scope

All 13 pages redesigned to the new system:

| Page | Key changes |
|---|---|
| `LoginPage` | Two-panel layout retained; left panel updated to slate/teal; Inter font; teal buttons |
| `DashboardPage` | 4-col stat grid + 2-col secondary panels; LIVE badge; skeleton loader |
| `AnimalsPage` | Full table redesign with toolbar, status badges, compliance bars, pagination |
| `AnimalProfilePage` | Profile header card + history timeline; teal accent |
| `VaccinationsPage` | Table + schedule cards; due-soon amber badges; overdue red badges |
| `HealthPage` | Health record table; under-treatment amber; withdrawal countdown |
| `CertificatesPage` | Certificate list with download button; SHA badge |
| `FarmsPage` | Farm cards grid; add farm form |
| `SettingsPage` | Settings form; password change |
| `AdminPage` | Login audit table |
| `AcceptInvitationPage` | Invitation form; teal CTA |
| `ForgotPasswordPage` / `ResetPasswordPage` | Auth form styling update |
| `PublicVerifyPage` | Certificate verification; success/failure states |

---

## 10. Out of Scope

- No routing or API changes
- No new pages or features
- No animation library (CSS transitions only via Tailwind)
- No dark/light mode toggle (dark-only)
- No Tailwind component library (shadcn/ui, etc.) — raw Tailwind utilities only
