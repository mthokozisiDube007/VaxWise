# VaxWise Frontend Design — Tesla Design Language

Apply these principles whenever building or refining any React component in `vaxwise-client/`. The goal is a premium, minimal, high-contrast UI that feels like Tesla's web app — dark, spacious, data-forward, and fast.

---

## 1. Design Philosophy

Tesla's UI has four rules. Apply all four:

1. **Dark wins** — default to dark backgrounds. Light only where the content demands it (forms, data tables).
2. **Numbers are heroes** — metrics are large, bold, and front and center. Labels are small and muted below the number.
3. **Nothing decorative** — no gradients, no illustrations, no icon clutter. Every element has a job.
4. **Space is a feature** — generous padding and whitespace signal quality. Cramped = cheap.

---

## 2. Color Tokens

Use these exact values in all inline styles. Never introduce new colors without updating this table.

```
BACKGROUNDS
  Page           #111812   (near-black green — primary surface)
  Card           #1A2B1F   (slightly lighter surface)
  Card hover     #1F3326
  Input          #162219
  Header/nav     #0B1F14   (darkest — existing brand color)

TEXT
  Primary        #F0EDE8   (warm white — never pure #FFF)
  Secondary      #8C8677   (muted — labels, sub-text)
  Disabled       #4A4A42

ACCENT
  Green          #22C55E   (active, success, CTA)
  Green dim      #177A3E   (secondary actions, borders)
  Amber          #F59E0B   (warnings, pending)
  Red            #EF4444   (danger, overdue, outbreak)
  Red dark       #7F1D1D   (critical, DALRRD banners)
  White          #F0EDE8   (on dark surfaces only)

BORDERS
  Subtle         #1F3326   (card edges on dark bg)
  Visible        #2D4A34   (dividers, table lines)
  Focus          #22C55E   (input focus ring)
```

---

## 3. Typography

```
Font stack:
  Headings    'Playfair Display', Georgia, serif
  Body/UI     'DM Sans', system-ui, sans-serif
  Monospace   'JetBrains Mono', monospace   (hashes, GPS, codes)

Scale:
  Page title     32px / 700 / Playfair / #F0EDE8
  Section title  20px / 700 / Playfair / #F0EDE8
  Card title     16px / 600 / DM Sans  / #F0EDE8
  Metric number  48px / 700 / Playfair / accent color
  Label          11px / 600 / DM Sans  / #8C8677 / uppercase / 0.6px spacing
  Body           14px / 400 / DM Sans  / #F0EDE8
  Caption        12px / 400 / DM Sans  / #8C8677
  Mono           12px / 400 / JetBrains Mono / #8C8677
```

---

## 4. Component Patterns

### Stat Card (the hero element — use for every KPI)
```jsx
// Large number, muted label below, colored top border
<div style={{
  background: '#1A2B1F',
  borderRadius: '12px',
  borderTop: '3px solid #22C55E',   // color matches the metric meaning
  padding: '24px',
}}>
  <p style={{ fontSize: '11px', color: '#8C8677', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>
    LABEL
  </p>
  <p style={{ fontSize: '48px', fontWeight: '700', fontFamily: "'Playfair Display', serif", color: '#22C55E', lineHeight: 1 }}>
    {value}
  </p>
  <p style={{ fontSize: '12px', color: '#8C8677', marginTop: '6px' }}>sub-label</p>
</div>
```

### Content Card
```jsx
<div style={{
  background: '#1A2B1F',
  borderRadius: '14px',
  padding: '28px 32px',
  border: '1px solid #1F3326',
  marginBottom: '24px',
}} />
```

### Alert Banner (critical / DALRRD)
```jsx
// Left red stripe + white text on near-black — Tesla emergency style
<div style={{
  background: '#1A0A0A',
  border: '1px solid #7F1D1D',
  borderRadius: '12px',
  display: 'flex',
  overflow: 'hidden',
}}>
  <div style={{ width: '6px', background: '#EF4444', flexShrink: 0 }} />
  <div style={{ padding: '16px 20px' }}>
    <p style={{ color: '#EF4444', fontWeight: '700', fontSize: '14px' }}>TITLE</p>
    <p style={{ color: '#F0EDE8', fontSize: '13px', marginTop: '4px' }}>Detail text</p>
  </div>
</div>
```

### Progress Bar / Gauge
```jsx
// Clean horizontal bar — no gradients, solid fill
<div style={{ height: '6px', background: '#1F3326', borderRadius: '3px', overflow: 'hidden' }}>
  <div style={{
    height: '100%',
    width: `${pct}%`,
    background: pct >= 80 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444',
    borderRadius: '3px',
    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
  }} />
</div>
```

### Button — Primary CTA
```jsx
<button style={{
  background: '#22C55E',
  color: '#0B1F14',
  border: 'none',
  padding: '12px 28px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '700',
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  letterSpacing: '0.3px',
  transition: 'opacity 0.15s',
}} onMouseOver={e => e.target.style.opacity = '0.88'}
   onMouseOut={e => e.target.style.opacity = '1'} />
```

### Button — Secondary / Ghost
```jsx
<button style={{
  background: 'transparent',
  color: '#22C55E',
  border: '1.5px solid #22C55E',
  padding: '10px 24px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '600',
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
}} />
```

### Destructive Button
```jsx
<button style={{
  background: '#EF4444',
  color: '#FFFFFF',
  border: 'none',
  padding: '10px 22px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '700',
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
}} />
```

### Form Input
```jsx
<input style={{
  width: '100%',
  padding: '11px 14px',
  borderRadius: '8px',
  border: '1.5px solid #2D4A34',
  background: '#162219',
  color: '#F0EDE8',
  fontSize: '14px',
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}}
onFocus={e => e.target.style.borderColor = '#22C55E'}
onBlur={e => e.target.style.borderColor = '#2D4A34'} />
```

### Label (above input)
```jsx
<label style={{
  display: 'block',
  marginBottom: '6px',
  fontSize: '11px',
  fontWeight: '600',
  color: '#8C8677',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
}} />
```

### Table
```jsx
// Dark header, alternating near-black rows
th: { padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#0B1F14', borderBottom: '1px solid #2D4A34' }
td: { padding: '13px 14px', fontSize: '14px', borderBottom: '1px solid #1F3326', color: '#F0EDE8' }
// Even rows: background '#1A2B1F', odd rows: '#162219'
```

### Badge / Status Pill
```jsx
// Active / good
{ background: '#052E16', color: '#22C55E', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }
// Warning
{ background: '#431407', color: '#F59E0B', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }
// Danger
{ background: '#450A0A', color: '#EF4444', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }
// Neutral
{ background: '#1A2B1F', color: '#8C8677', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid #2D4A34' }
```

### Tab Switcher
```jsx
// Pill-style tabs on a dark surface
// Wrapper
{ display: 'flex', gap: '4px', background: '#162219', padding: '4px', borderRadius: '10px', width: 'fit-content' }
// Active tab
{ padding: '8px 20px', borderRadius: '8px', background: '#22C55E', color: '#0B1F14', fontWeight: '700', fontSize: '13px', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }
// Inactive tab
{ padding: '8px 20px', borderRadius: '8px', background: 'transparent', color: '#8C8677', fontWeight: '400', fontSize: '13px', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }
```

---

## 5. Layout Rules

- **Page background**: `#111812` — set on the outermost container or in `App.jsx` / `Layout.jsx`
- **Page padding**: `32px 40px` on desktop, `20px 16px` on mobile
- **Grid**: 4-column stat row → `repeat(4, 1fr)` with `16px` gap
- **Section spacing**: `32px` between sections, `20px` between cards in same section
- **Max content width**: `1280px` centered — `maxWidth: '1280px', margin: '0 auto'`
- **Card radius**: `14px` cards, `8px` inputs/buttons, `20px` pills
- **No box-shadows on dark surfaces** — use `border: '1px solid #1F3326'` instead

---

## 6. Animation

```
All transitions: 150ms ease  (fast feel — Tesla is snappy)
Progress bars:   800ms cubic-bezier(0.4,0,0.2,1)  (smooth load-in)
Hover opacity:   0.88 on primary buttons
Hover transform: translateY(-1px) on interactive cards
No bounce, no spring — clean linear/ease only
```

---

## 7. Responsive Breakpoints

```
Desktop  ≥1024px  — 4-column stats grid
Tablet    768px   — 2-column stats grid
Mobile   <640px   — 1-column, full-width cards, stacked nav
```

Implementation pattern:
```jsx
// Use inline style media queries via JS:
const cols = window.innerWidth >= 1024 ? 'repeat(4,1fr)' : window.innerWidth >= 768 ? 'repeat(2,1fr)' : '1fr';
// Or use a useWindowWidth() hook for reactive layout
```

---

## 8. Page Structure Template

```jsx
export default function SomePage() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#F0EDE8' }}>

      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '700', color: '#F0EDE8', marginBottom: '4px' }}>
          Page Title
        </h1>
        <p style={{ color: '#8C8677', fontSize: '14px' }}>Sub-description</p>
      </div>

      {/* Stat cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '32px' }}>
        {/* stat cards */}
      </div>

      {/* Main content card */}
      <div style={{ background: '#1A2B1F', borderRadius: '14px', padding: '28px 32px', border: '1px solid #1F3326' }}>
        {/* content */}
      </div>

    </div>
  );
}
```

---

## 9. Do / Don't

| ✓ Do | ✗ Don't |
|------|---------|
| Large numbers at 48px+ for KPIs | Small numbers buried in text |
| `#F0EDE8` warm white for text on dark | Pure `#FFFFFF` — too harsh on dark |
| Border `1px solid #1F3326` for card edges | Box-shadow on dark backgrounds |
| One accent color per card top-border | Multiple accent colors in same card |
| `cubic-bezier` progress bar animation | Instant jump with no transition |
| Muted `#8C8677` for labels | Bright labels competing with values |
| `letter-spacing: 0.6px` on uppercase labels | Uppercase labels without spacing |
| Destructive actions in `#EF4444` | Red for anything other than danger |
| Generous `28px 32px` card padding | Tight padding that cramps content |

---

## 10. Applying This to VaxWise

When a user asks to "redesign", "restyle", or "make it look better":

1. Switch `Layout.jsx` page background from white to `#111812`
2. Replace all `background: 'white'` cards with `background: '#1A2B1F'`
3. Replace all `color: '#1A1A18'` text with `color: '#F0EDE8'`
4. Replace all `border: '1.5px solid #E0D9CE'` inputs with `border: '1.5px solid #2D4A34'` and `background: '#162219'`
5. Replace all `background: '#F8F5F0'` table headers with `background: '#0B1F14'`
6. Scale stat numbers up to `48px` using `Playfair Display`
7. Apply colored top-border to each stat card matching its semantic meaning (green=good, amber=warning, red=danger)
8. Verify contrast: all text must be readable (target WCAG AA minimum)
