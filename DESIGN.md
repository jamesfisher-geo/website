# Design System — "Field Notebook"

> **For Claude Code:** Read this file before writing or changing any UI. Follow it exactly.
> When something isn't covered here, choose the *quieter* option: less color, less motion, more whitespace.
> Add a line to your project's `CLAUDE.md`: `All UI work must follow DESIGN.md.`

---

## 1. The idea in one paragraph

The site should feel like a **researcher's field notebook laid on top of a precise map**. It's quiet, warm paper, mostly set in a calm serif. **Handwritten annotations** appear only where a person would actually scribble: labels, margin notes, circles, arrows. **Monospaced coordinates and data** show it's a serious, measurement-driven tool. The tone borrows from geospatial/earth-intelligence companies (inspiration: atlasai.co): understated, confident, data-first. The texture comes from a hand-kept journal.

**Three voices, strict roles:**

| Voice | Font role | Used for | Never used for |
|---|---|---|---|
| **Print** | Serif | Headlines, body copy, navigation | — |
| **Hand** | Handwriting | Annotations, margin notes, small labels, one hero accent word | Body text, buttons, anything longer than ~8 words |
| **Instrument** | Monospace | Coordinates, numbers, metadata, dates, tags, technical labels | Paragraphs, headlines |

If you're unsure which voice to use, use **Print**.

---

## 2. Design tokens

Put these in `src/styles/tokens.css` and import once at the app root. **Never hard-code colors, fonts, or spacing in components. Always use the variables.**

```css
:root {
  /* ── Paper & ink ─────────────────────────── */
  --paper:        #F6F2EA;  /* page background: warm notebook paper */
  --paper-raised: #FBF9F4;  /* cards, panels, popovers */
  --paper-sunken: #EEE8DC;  /* inputs, code blocks, wells */
  --rule:         #E2DACB;  /* ruled lines, dividers, borders */
  --rule-strong:  #CFC5B3;  /* hover borders, table headers */

  --ink:          #1F1D1A;  /* primary text: soft black, never #000 */
  --graphite:     #5E5A53;  /* secondary text */
  --pencil:       #8F897E;  /* tertiary text, captions, placeholders */

  /* ── Accents (use sparingly) ──────────────── */
  --ink-blue:     #2B4A75;  /* links, primary action, focus: fountain-pen blue */
  --ink-blue-soft:#DCE3EC;  /* blue tint backgrounds, selection */
  --red-pencil:   #B4452F;  /* annotations, highlights, errors: editor's red */
  --highlighter:  #F3E3A1;  /* marker highlight behind text */
  --moss:         #4F6B4A;  /* success, "land" data in maps */

  /* ── Type families ────────────────────────── */
  --font-print: "Source Serif 4", "Iowan Old Style", Georgia, serif;
  --font-hand:  "Caveat", "Segoe Print", "Bradley Hand", cursive;
  --font-instr: "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* ── Type scale (1.25 ratio, fluid at top) ── */
  --text-xs:   0.75rem;   /* 12 — mono metadata */
  --text-sm:   0.875rem;  /* 14 — captions */
  --text-base: 1.0625rem; /* 17 — body */
  --text-lg:   1.25rem;   /* 20 — lead paragraph */
  --text-xl:   1.5625rem; /* 25 — h3 */
  --text-2xl:  clamp(1.75rem, 1.4rem + 1.5vw, 2.25rem);  /* h2 */
  --text-3xl:  clamp(2.25rem, 1.6rem + 3vw, 3.75rem);    /* h1 */
  --text-hand: 1.5rem;    /* handwriting reads small, so set it ~1.4× the size of surrounding text */

  --leading-tight: 1.15;
  --leading-body:  1.65;

  /* ── Spacing (4px base) ───────────────────── */
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;
  --space-4: 16px;  --space-5: 24px;  --space-6: 32px;
  --space-7: 48px;  --space-8: 64px;  --space-9: 96px;
  --space-10: 144px;

  /* ── Layout ───────────────────────────────── */
  --measure: 66ch;          /* max line length for prose */
  --container: 1120px;
  --margin-col: 220px;      /* notebook margin for annotations */
  --gutter: clamp(16px, 4vw, 40px);

  /* ── Shape & depth ────────────────────────── */
  --radius-sm: 2px;
  --radius-md: 4px;         /* max radius: notebooks are not bubbly */
  --border: 1px solid var(--rule);
  --shadow-paper: 0 1px 0 var(--rule), 0 8px 24px -16px rgb(31 29 26 / 0.18);

  /* ── Motion ───────────────────────────────── */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --dur-fast: 150ms;
  --dur-base: 280ms;
  --dur-draw: 900ms;        /* hand-drawn stroke reveal */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --paper: #1A1917; --paper-raised: #22211E; --paper-sunken: #151412;
    --rule: #34312C; --rule-strong: #4A463F;
    --ink: #ECE6DA; --graphite: #B5AEA2; --pencil: #847E73;
    --ink-blue: #8FB0DA; --ink-blue-soft: #243246;
    --red-pencil: #E0806B; --highlighter: #5A4E22; --moss: #8DAE86;
  }
}
:root[data-theme="dark"] { /* repeat the dark values above */ }
```

**Fonts.** Load from Google Fonts (all are free/OFL):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap" rel="stylesheet">
```

Only these weights: serif 400/600, hand 500/600, mono 400/500. **No bold-italic, no light weights.**

---

## 3. Color rules

- **The page is ~90% paper and ink.** Accents together should cover under 5% of any screen.
- **One accent color per component.** Blue = "you can act on this." Red pencil = "a person noted this." Never use both on one button or card.
- **Never** use gradients, neon, pure black `#000`, or pure white `#FFF` as backgrounds.
- The highlighter appears only *behind text*, at most once per section:
  ```css
  .highlight {
    background: linear-gradient(transparent 55%, var(--highlighter) 55% 92%, transparent 92%);
    padding: 0 0.15em;
  }
  ```
- Text contrast must meet **WCAG AA**: `--ink` and `--graphite` on `--paper` pass. Use `--pencil` only for text ≥ 14px that isn't critical.

---

## 4. Typography rules

- Headlines: `--font-print`, weight 600, `--leading-tight`, `letter-spacing: -0.01em`. Sentence case, **never ALL CAPS**.
- Body: `--font-print`, 400, `--text-base`, `--leading-body`, `max-width: var(--measure)`.
- Eyebrow / section label: `--font-instr`, `--text-xs`, `text-transform: uppercase`, `letter-spacing: 0.08em`, color `--graphite`. Prefix with a coordinate-style index, e.g. `01 / FIELD SITE` or `N 40.71° · W 74.00°`.
- Handwriting:
  - color `--red-pencil` (annotations) or `--ink-blue` (labels on blue elements)
  - slight rotation: `transform: rotate(-2deg)`; vary between −3° and +2° so the notes don't look stamped
  - **max one handwritten element per viewport** outside the margin column
  - never below 20px rendered size (legibility)
- Numbers in data contexts use `--font-instr` with `font-variant-numeric: tabular-nums`.
- Links: `--ink-blue`, underline with `text-underline-offset: 0.2em; text-decoration-thickness: 1px;` and on hover the thickness goes to 2px. No color change on hover.

---

## 5. Layout

- **Generous whitespace is the design.** Section vertical padding: `--space-9` on desktop, `--space-7` on mobile.
- **Notebook margin.** On screens ≥ 1024px, long-form pages use a two-column grid: main column (`--measure`) plus a right margin column (`--margin-col`) for handwritten annotations, figure notes, and coordinates. Below 1024px, margin notes move inline as small asides beneath the paragraph they reference.
  ```css
  .notebook { display: grid; grid-template-columns: minmax(0, var(--measure)) var(--margin-col); gap: var(--space-7); }
  ```
- **Ruled paper** (optional, hero/journal pages only, never behind dense UI):
  ```css
  .ruled {
    background-image: repeating-linear-gradient(
      to bottom, transparent 0 31px, var(--rule) 31px 32px);
  }
  ```
  Align body `line-height` to 32px on ruled surfaces so text sits on the lines.
- Dividers are 1px `--rule` lines or a **hand-drawn SVG squiggle** (see §7). Never thick bars.
- Asymmetry is welcome. Left-align text by default. Center only the hero headline, if anything.
- Mobile first. 16px minimum side gutter, no horizontal scroll, tap targets ≥ 44px.

---

## 6. Components

### Buttons
| Variant | Style |
|---|---|
| **Primary** | bg `--ink`, text `--paper`, `--font-print` 600 `--text-sm`, padding `12px 20px`, radius `--radius-sm`. Hover: bg `--ink-blue`. |
| **Secondary** | transparent, 1px `--ink` border, text `--ink`. Hover: bg `--paper-sunken`. |
| **Text link button** | `--ink-blue` text plus a trailing `→` that moves 3px right on hover. |

At most **one primary button per screen section.** No pill shapes, no shadows, no icons inside primary buttons except `→`.

### Cards / "notebook entries"
- bg `--paper-raised`, `--border`, radius `--radius-md`, padding `--space-6`, `--shadow-paper`.
- Top line: mono metadata (`2026-11-01 · SITE 04 · 3DGS`) in `--pencil`.
- Optional "tape" corner: a 48×16px rotated (−6°) rectangle, `--highlighter` at 70% opacity, top-left. Use it on **at most one card per grid**.
- Hover: border → `--rule-strong`, translateY(−2px). Nothing else.

### Navigation
- Thin top bar on `--paper`, bottom border 1px `--rule`. Logo/wordmark in the serif (600), nav links in the serif `--text-sm`, `--graphite` → `--ink` on hover.
- Current page: a hand-drawn underline SVG beneath the link in `--red-pencil`.
- No mega-menus, no dropdown shadows.

### Forms
- Inputs: bg `--paper-sunken`, no side borders, **bottom border only** (1px `--rule-strong`), like writing on a line. Focus: bottom border 2px `--ink-blue` and a visible focus ring for keyboard users (`outline: 2px solid var(--ink-blue); outline-offset: 2px` on `:focus-visible`).
- Labels in mono `--text-xs` uppercase. Helper text in `--pencil`. Errors in `--red-pencil` with a handwritten "!" mark.

### Figures & images
- Images sit on `--paper-raised` with 8px padding and a 1px `--rule` border, like a photo pasted in.
- Caption below in mono `--text-xs`: `FIG. 03 — description · coordinates`.
- Prefer desaturated or naturally toned imagery: satellite tiles, terrain, field photos. Optional `filter: saturate(0.85)`.

### Tables & data
- No zebra stripes, no vertical borders. Header row in mono uppercase `--text-xs`, 1px `--rule-strong` bottom border. Rows separated by 1px `--rule`.
- Numbers right-aligned, tabular, mono.

---

## 7. Hand-drawn elements

Hand-drawn marks are the signature of the site. Because they're the signature, **restraint matters more than quantity.**

Build these as small reusable React components in `src/components/sketch/`:

- `<Underline />` — slightly wavy SVG path under a word
- `<Circle />` — loose, unclosed ellipse around a word or number (the end overshoots the start)
- `<Arrow />` — curved arrow with an open hand-drawn head, used to point a margin note at content
- `<Squiggle />` — section divider
- `<MarginNote>` — handwritten text plus an optional `<Arrow />`

Rules:
- Strokes: `stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; fill: none;` Color via `--red-pencil` or `--ink-blue`.
- Paths must look imperfect: uneven control points, no perfect geometry. Create **2–3 variants** of each and pick deterministically (e.g. by index) so repeats don't look identical.
- **Draw-in animation** on first scroll into view: animate `stroke-dashoffset` from path length to 0 over `--dur-draw` with `--ease-out`. Animate once only and never loop.
- Max **two sketch marks per viewport.**
- Purely decorative marks get `aria-hidden="true"`. Margin notes with meaning stay in the accessibility tree.

---

## 8. Cartographic / data motifs

These keep the journal look rooted in the geospatial, measurement-driven tone.

- **Coordinates as metadata:** show lat/long, dates, and IDs in mono on cards, figures, and section labels.
- **Contour-line texture:** a faint topographic SVG pattern (`--rule` stroke, 0.5–1px) is allowed in the hero or footer background at ≤ 40% opacity. Never behind body text.
- **Scale bar & north arrow:** small mono/hand-drawn details for map and viewer UI.
- **Grid ticks:** tiny 4px tick marks at container corners can suggest a survey sheet. Optional, and only in the hero.

---

## 9. 3D viewer (React Three Fiber + 3D Tiles + Gaussian splats)

The viewer is the one place where content goes full-bleed and dark backgrounds are allowed. Its UI chrome still belongs to the notebook.

- Canvas background: `--paper` on light pages (splats float on paper), or `#151412` for an immersive mode. Never pure black.
- Overlay panels: `--paper-raised` at 92% opacity, `backdrop-filter: blur(8px)`, `--border`, `--radius-md`, positioned with `--space-4` inset.
- HUD readouts (lat/long, altitude, tile count, FPS) in mono `--text-xs`, `--graphite`, tabular numbers.
- Compass and scale bar in a hand-drawn style (`--ink` strokes).
- Points of interest: small ink dots (6px, `--red-pencil`) with a handwritten label and a short `<Arrow />`. Use HTML overlays (e.g. drei `<Html>`) so the fonts render crisply.
- Loading state: a handwritten "loading tiles…" line plus a thin 1px progress rule in `--ink-blue`. No spinners.
- The viewer has a visible "reset view" control and keyboard-accessible controls.

---

## 10. Motion

- Default transition: `var(--dur-base) var(--ease-out)` on color, border-color, opacity, transform only.
- Page sections fade up 8px on enter, once only.
- Sketch strokes draw in (see §7). That's the only "showy" motion allowed.
- **No** parallax, bouncing, autoplay carousels, cursor followers, or typing effects.
- Respect reduced motion:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
  }
  ```

---

## 11. Voice & copy

- Calm, precise, first-person-plural when needed. Short declarative sentences. Write like field notes from someone who measured it.
- Headlines state what's true or what changed. No hype words: avoid "revolutionary," "cutting-edge," "supercharge," "unlock."
- Handwritten annotations can be warmer and more personal ("start here," "worth a look →", "measured Oct '26").
- Use real units and numbers wherever possible.

---

## 12. Do / Don't checklist

Before finishing any UI task, check every line:

- [ ] Only token variables were used. No raw hex, px font sizes, or font names in components
- [ ] Background is paper, text is ink, and accents cover under 5% of the screen
- [ ] Handwriting appears only as annotations/labels, ≤ 8 words, ≤ 1 per viewport (outside the margin)
- [ ] Sketch marks: ≤ 2 per viewport, animate once, `aria-hidden` when decorative
- [ ] Radius ≤ 4px. No pills, gradients, glassy cards (except viewer overlays), or heavy shadows
- [ ] Prose width ≤ 66ch, section padding is generous
- [ ] Focus states visible, contrast AA, tap targets ≥ 44px, reduced motion respected
- [ ] Works at 360px wide with no horizontal scroll
- [ ] Light and dark themes both look right

**Don't:** use emojis as icons, use stock 3D blobs, use Inter/Roboto-style default SaaS looks, put cards inside cards, center long paragraphs, write in ALL CAPS (except mono labels), use more than one primary button per section, or use handwriting fonts for body text.

---

## 13. File layout (suggested)

```
src/
  styles/
    tokens.css        ← §2, imported once in main.tsx
    base.css          ← resets, body, headings, links, .ruled, .highlight
  components/
    sketch/           ← Underline, Circle, Arrow, Squiggle, MarginNote
    ui/               ← Button, Card, Input, Figure, DataTable, NavBar
    viewer/           ← SplatViewer, HudPanel, Compass, ScaleBar, PoiLabel
```

---

*Inspiration: the restrained, data-led, earth-observation tone of atlasai.co, combined with the texture of a hand-kept field journal. This guide does not reuse Atlas AI's branding, logo, copy, or assets. Adjust the tokens in §2 once you've finalized your own palette.*