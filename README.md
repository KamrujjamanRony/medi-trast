# MEDI-TRUST ENGINEERS

Product catalogue and admin panel for Medi-Trust Engineers, a medical equipment
supplier. Built with **Angular 22** — standalone signal components, signal
forms, `httpResource` for data loading, and zoneless change detection.

## Requirements

- Node.js 22.22.3+, 24.15.0+, or 26+
- npm 10+

## Getting started

```bash
npm install
npm start          # dev server on http://localhost:4200/
```

Other commands:

```bash
npm run build      # production build into dist/
npm run watch      # development build, rebuilding on change
npm test           # unit tests (Vitest + jsdom)
```

## Architecture

```
src/app/
  app.ts, app.config.ts, app.routes.ts   Bootstrap, providers, lazy routes
  core/
    directives/reveal.directive.ts       IntersectionObserver scroll reveal
    security/                            Admin gate, route guard, upload and URL validation
  features/
    models/                              API types and the product category list
    services/                            One shared httpResource per API resource
  layouts/                               Public shell and admin shell
  pages/                                 Home, About, Contact, Products, Product details, 404
  admin/                                 Product and carousel CRUD, About and Contact editors
  shared/
    components/                          Header, footer, hero carousel, product card, page header
    ui/                                  Icons, dialog, field error, empty and loading states
```

### Data loading

Each API resource is fetched **once** into an application-wide `httpResource`
declared on its service, and components read derived signals from it:

```ts
readonly resource = httpResource<Product[]>(() => environment.ProductApi, {
  defaultValue: [],
  parse: (raw) => (Array.isArray(raw) ? (raw as Product[]) : []),
});

readonly products = computed(() =>
  this.resource.value().filter((p) => p.companyID === environment.companyCode),
);
```

`isLoading()` and `error()` come free, which is what drives the skeleton and
retry states. After a write, call `service.reload()`.

### Forms

Admin forms use **signal forms** (`@angular/forms/signals`): a `signal` model, a
schema of validators, and a submit action.

```ts
private readonly model = signal({ ...EMPTY });

protected readonly productForm = form(
  this.model,
  (path) => {
    required(path.productName, { message: 'A product name is required.' });
    maxLength(path.productName, 200, { message: 'Keep the name under 200 characters.' });
  },
  { submission: { action: async () => { await this.save(); return undefined; } } },
);
```

In the template, `[formRoot]` goes on the `<form>` and `[formField]` on each
control. `<app-field-error [field]="…" />` renders the first message once the
field has been touched.

### Styling

Tailwind v4, configured CSS-first in `src/styles.css`. Design tokens live in the
`@theme` block (`--color-brand-*`, `--color-accent-*`, `--color-ink-*`, radii,
shadows), and the reusable classes — `.btn`, `.card`, `.input`, `.data-table`,
`.product-grid`, `.skeleton` — are defined in `@layer components`. There is no
component framework: no daisyUI, Material or tw-elements.

To change the brand colours, edit the `@theme` block; everything follows.

## Routes

| URL | Page |
|---|---|
| `/#/` | Home |
| `/#/about` | About Us |
| `/#/contact` | Contact Us |
| `/#/products/:category` | Catalogue (`all`, `se`, `mf`, `me`, `le`, `de`, `ao`) |
| `/#/product/:id` | Product details |
| `/#/mte12` | Admin panel (security key required) |

The app uses `withHashLocation()`, so the `#` is part of every URL.

## Configuration

`src/environments/environments.ts` (development) and `environments.prod.ts`
(production, swapped in at build time) hold the API endpoints, `companyCode`,
and the admin PBKDF2 salt/hash. See [SECURITY.md](SECURITY.md) before changing
the `adminAuth` block.

## Deployment

`npm run build` emits to `dist/`. Deploy `dist/browser/` together with
`web.config`, which supplies the SPA rewrite rule, HTTPS redirect and the
security response headers. The Content-Security-Policy is declared in both
`web.config` and `src/index.html` — **keep the two in sync**.
