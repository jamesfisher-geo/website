# james-website

Source for [jamesfishergeo.com](https://jamesfishergeo.com), the personal site of James A. Fisher.

Built with **React 19**, **TypeScript 6** and **Vite**. It's deployed to GitHub Pages.

## Getting started

Requires Node.js 20+ (developed on Node 24).

```sh
npm install
npm run dev        # http://localhost:3000
```

## Scripts

| Command                                  | What it does                           |
| ---------------------------------------- | -------------------------------------- |
| `npm run dev`                            | Start the Vite dev server on port 3000 |
| `npm run build`                          | Type-check and build to `dist/`        |
| `npm run preview`                        | Serve the production build locally     |
| `npm run test`                           | Run Vitest in watch mode               |
| `npm run test -- --run path/to/file.tsx` | Run one test file once                 |
| `npm run typecheck`                      | `tsc --noEmit` across the project      |
| `npm run lint`                           | ESLint plus a Prettier check           |
| `npm run lint:fix`                       | Auto-fix lint and formatting issues    |

Run `npm run typecheck && npm run lint` before committing.

## Project layout

```
index.html              Vite entry (fonts, favicon)
public/                 Static files copied as-is (CNAME, favicon.ico)
src/
  main.tsx              App bootstrap: styles + BrowserRouter
  App.tsx               Route table
  styles/               tokens.css (design tokens) and base.css (global styles)
  pages/                Route-level pages: Home, Journal, Resume, Contact, NotFound
  components/
    layout/             SiteLayout (nav + main)
    ui/                 Button, NavBar, ...
    sketch/             Hand-drawn SVG marks (Circle, ...)
  test/                 Vitest setup and helpers (renderWithRouter)
```

## Routes

| Path       | Page                                |
| ---------- | ----------------------------------- |
| `/`        | Landing page                        |
| `/journal` | 3-D Journal (Gaussian splat scenes) |
| `/resume`  | Resume                              |
| `/contact` | Contact                             |

## Design

All UI follows [DESIGN.md](./DESIGN.md), the "Field Notebook" design system. It covers tokens, typography, components, hand-drawn marks and motion rules. Components only use the CSS variables from `src/styles/tokens.css`. Styles are CSS Modules, kept next to each component.

## Deployment

Every push to `main` triggers `.github/workflows/node.js.yml`. It builds the site, copies `dist/index.html` to `dist/404.html`, and publishes `dist/` to GitHub Pages. The `404.html` copy is the fallback that lets client-side routes such as `/resume` load directly. The custom domain comes from `public/CNAME`.
