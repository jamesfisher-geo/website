# Design System — "Field Notebook"

> **For Claude Code:** Read this file before writing or changing any UI. Follow it exactly.
> When something isn't covered here, choose the *quieter* option: less color, less motion, more whitespace.
> Add a line to your project's `CLAUDE.md`: `All UI work must follow DESIGN.md.`

---

## 1. The idea in one paragraph

The site should feel like a **researcher's field notebook laid on top of a precise map**. It's quiet, cream survey-sheet paper, mostly set in a calm serif. **Handwritten annotations** appear only where a person would actually scribble: labels, margin notes, circles, arrows. **Monospaced coordinates and data** show it's a serious, measurement-driven tool. The tone borrows from geospatial/earth-intelligence companies (inspiration: atlasai.co): understated, confident, data-first. The texture comes from a hand-kept journal. The cartographic reference is the **1930s–40s USGS topographic quadrangle**, specifically the Valley-and-Ridge sheets of central Pennsylvania (e.g. *Millheim, PA, 1937, 1:48,000*): brown contours on aged cream paper, packed into long parallel ridges, letter-spaced ridge names, and engraved map furniture.

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
  /* Sampled from the 1937 USGS Millheim, PA sheet and softened for reading. */
  --paper:        #F4EDC6;  /* page background: aged survey-sheet cream (scan: #F4EEBB) */
  --paper-raised: #F9F6DC;  /* cards, panels, popovers: the sheet's margin paper (scan: #F8F6CD) */
  --paper-sunken: #EBE2B8;  /* inputs, code blocks, wells */
  --rule:         #E0D3A4;  /* ruled lines, dividers, borders */
  --rule-strong:  #C9B783;  /* hover borders, table headers */

  --ink:          #221C14;  /* primary text: warm engraving black, never #000 */
  --graphite:     #5C5446;  /* secondary text */
  --pencil:       #8A7F69;  /* tertiary text, captions, placeholders */

  /* ── Accents (use sparingly) ──────────────── */
  --ink-blue:     #2B4A75;  /* links, primary action, focus: fountain-pen blue */
  --ink-blue-soft:#DCE3EC;  /* blue tint backgrounds, selection */
  --red-pencil:   #B4452F;  /* annotations, highlights, errors: editor's red */
  --highlighter:  #EAD27E;  /* marker highlight behind text (stronger, so it shows on yellow paper) */
  --moss:         #4F6B4A;  /* success, "land" data in maps */

  /* ── Survey linework (texture, not accent) ── */
  --contour:      #804017;  /* index contours: USGS contour brown, sampled from the scan */
  --contour-soft: #B17949;  /* intermediate contours, sampled from the scan */

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
    --paper: #1C1A13; --paper-raised: #25221A; --paper-sunken: #16140E;
    --rule: #38332A; --rule-strong: #4F4834;
    --ink: #EEE6CC; --graphite: #B8AE94; --pencil: #887E68;
    --ink-blue: #8FB0DA; --ink-blue-soft: #243246;
    --red-pencil: #E0806B; --highlighter: #5A4E22; --moss: #8DAE86;
    --contour: #C08552; --contour-soft: #5F4429;
  }
}
:root[data-theme="dark"] { /* repeat the dark values above */ }
```

**Theme.** The site always uses the light survey-sheet palette: `index.html` sets `<html data-theme="light">`, so the OS dark-mode setting is ignored. Keep the dark tokens maintained for a future opt-in toggle, but design and review against light first.

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
- **Contour brown is a texture color, not an accent.** Use `--contour` / `--contour-soft` only for topographic linework and graticule crosses. Map furniture (scale bars, north arrows) stays in `--ink`, as on the printed sheets. Because the texture is capped at 40% opacity, it doesn't count toward the 5% accent budget. Never use it for text, buttons, or links.
- The highlighter appears only *behind text*, at most once per section:
  ```css
  .highlight {
    background: linear-gradient(transparent 55%, var(--highlighter) 55% 92%, transparent 92%);
    padding: 0 0.15em;
  }
  ```
- **The palette comes from the sheet.** Paper, rules, and contours are sampled from the 1937 Millheim scan. When adding a neutral, pull it from the same cream/brown family. Never use cool grays.
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

These keep the journal look rooted in the geospatial, measurement-driven tone. The reference sheet is the 1937 USGS Millheim, PA quadrangle. Borrow its *grammar*, not its scan: never use the scan itself as a background image.

- **Coordinates as metadata:** show lat/long, dates, and IDs in mono on cards, figures, and section labels.
- **Contour texture: Valley and Ridge.** A faint topographic SVG is allowed at ≤ 40% opacity in the hero, the footer, or as a fixed full-page backdrop on the Journal and Contact pages. Outside those, never put it behind body text. It must read like a Pennsylvania ridge-and-valley sheet:
  - **Long parallel ridges**, all trending the same way (ENE, about −17° in SVG space, rising to the right). Each ridge is a stack of **nested, elongated closed contours**: narrow across, long along the axis.
  - **Tight flanks, open valleys.** Lines bunch on the slopes and leave wide empty valley floors between ridges. Keep the space behind headline text empty.
  - **Noses and gaps.** Ridge ends taper to a point or round off bluntly. Allowed variations are an occasional water gap (one ridge split in two, collinear) and a plunging fold (two limbs opening from adjacent noses).
  - **Index contours.** Every 5th contour is heavier (`--contour`, 1.25px). Intermediate contours are `--contour-soft` at 0.75px. Use `vector-effect: non-scaling-stroke`.
  - **Density:** contours sit about 2 viewBox units apart on the flanks, with 12–27 levels per ridge, to echo the sheet's 20-foot interval.
  - **Not uniform.** Real slopes aren't machined. Every ridge gets uneven contour spacing (benches and steep pitches), one steeper flank (a scarp against a dip slope), and 1–3 drainage gullies per flank that notch the lower contours and fade toward the crest. All of this is seeded, so it's deterministic.
  - Contours **never cross** each other or other ridges. No concentric bullseyes, random blobs, or crossing waves.
  - Generate the shapes with `src/utils/contours.ts` (deterministic and seeded) and lay them out in `src/components/sketch/contourLayout.ts`. Don't hand-draw new contour paths.
- **Map lettering** (on map-like surfaces only, e.g. viewer overlays, figure plates, footer):
  - Feature names (ridges, valleys, regions): mono, uppercase, wide-tracked (`letter-spacing: 0.4em`), `--graphite`, e.g. `T H I C K   M O U N T A I N`. Along with eyebrows, this is the only allowed ALL-CAPS use. Rotate it to follow the feature if needed.
  - Water features (runs, creeks): italic serif, `--graphite`, e.g. *Elk Creek*.
  - Spot heights: mono `--text-xs` tabular numbers beside a 3px ink dot (`1916`).
- **Graticule crosses.** Use `<GraticuleCrosses />` (`src/components/map/`) for faint 14px `+` marks in `--contour-soft` at the interior grid intersections (⅓ and ⅔ across and down), like the 5′ marks on the sheet. The contour texture stays full-bleed: **no neatline border, edge ticks, or corner coordinate labels** on the hero. The crosses are hidden below 640px, where they'd land on the hero text.
- **Map furniture.**
  - Scale bar: alternating filled/empty `--ink` segments, 4px tall, mono `--text-xs` labels beneath (`0  1  2  3  4 MILES`). Add a representative fraction above if it's meaningful (`1:48,000`).
  - North arrow: a declination diagram (a true-north line topped with a small star, plus a magnetic-north line with a half arrowhead offset a few degrees) in `--ink` strokes. No filled compass roses.
  - Datum notes: small mono lines like `CONTOUR INTERVAL 20 FEET · DATUM IS MEAN SEA LEVEL` in `--pencil`.

---

## 9. 3D viewer (React Three Fiber + 3D Tiles + Gaussian splats)

The viewer is the one place where content goes full-bleed and dark backgrounds are allowed. Its UI chrome still belongs to the notebook.

- Canvas background: `--paper` on light pages (splats float on paper), or `#16140E` (dark `--paper-sunken`) for an immersive mode. Never pure black.
- Overlay panels: `--paper-raised` at 92% opacity, `backdrop-filter: blur(8px)`, `--border`, `--radius-md`, positioned with `--space-4` inset.
- HUD readouts (lat/long, altitude, tile count, FPS) in mono `--text-xs`, `--graphite`, tabular numbers.
- Compass and scale bar follow the map furniture in §8 (declination north arrow, alternating-segment scale bar) with `--ink` strokes and a slightly hand-drawn line quality.
- Points of interest: small ink dots (6px, `--red-pencil`) with a handwritten label and a short `<Arrow />`. Use HTML overlays (e.g. drei `<Html>`) so the fonts render crisply.
- Loading state: a handwritten "loading tiles…" line plus a thin 1px progress rule in `--ink-blue`. No spinners.
- The viewer has a visible "reset view" control and keyboard-accessible controls.
- **Full screen:** a square overlay button with the standard four-corner glyph (corners out to enter, in to exit; `currentColor` 1.5px strokes; accessible name "Full screen" / "Exit full screen") sits in the viewer's bottom-left corner once the scene is ready. It uses the Fullscreen API on the viewer box, which goes edge to edge with no border or radius. While in full screen, "Reset view" also appears inside the viewer. Hide the control where the browser can't make an element full screen (e.g. iPhone Safari).

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
- [ ] Contours read as parallel, elongated ridges with index lines every 5th. No blobs, no crossings, never behind text
- [ ] Radius ≤ 4px. No pills, gradients, glassy cards (except viewer overlays), or heavy shadows
- [ ] Prose width ≤ 66ch, section padding is generous
- [ ] Focus states visible, contrast AA, tap targets ≥ 44px, reduced motion respected
- [ ] Works at 360px wide with no horizontal scroll
- [ ] The light sheet theme looks right (it's what ships). Dark tokens still render sensibly if `data-theme="dark"` is set

**Don't:** use emojis as icons, use stock 3D blobs, use Inter/Roboto-style default SaaS looks, put cards inside cards, center long paragraphs, write in ALL CAPS (except mono labels), use more than one primary button per section, or use handwriting fonts for body text.

---

## 13. File layout (suggested)

```
src/
  styles/
    tokens.css        ← §2, imported once in main.tsx
    base.css          ← resets, body, headings, links, .ruled, .highlight
  components/
    sketch/           ← Underline, Circle, Arrow, Squiggle, MarginNote, ContourTexture (+ contourLayout.ts)
    ui/               ← Button, Card, Input, Figure, DataTable, NavBar
    map/              ← GraticuleCrosses (interior graticule marks)
    viewer/           ← SplatViewer, HudPanel, Compass, ScaleBar, PoiLabel
  utils/
    contours.ts       ← §8 Valley-and-Ridge contour generator
```

---

*Inspiration: the restrained, data-led, earth-observation tone of atlasai.co, combined with the texture of a hand-kept field journal. This guide does not reuse Atlas AI's branding, logo, copy, or assets. Adjust the tokens in §2 once you've finalized your own palette.*