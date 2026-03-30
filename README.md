# oidc-provider.dev

Community documentation site for [panva/node-oidc-provider](https://github.com/panva/node-oidc-provider) — an OpenID Certified™ OAuth 2.0 Authorization Server for Node.js.

**Live site:** [https://oidc-provider.dev](https://oidc-provider.dev)

## How it works

The site is built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build). Documentation content is fetched from the upstream `node-oidc-provider` repository and transformed into navigable, categorized pages by a build script.

```
upstream (panva/node-oidc-provider docs)
  → scripts/build-from-upstream.ts (fetch, parse, split, rewrite links)
    → src/content/docs/**/*.md (generated Starlight pages)
      → dist/ (static site)
```

### Content pipeline

- **Upstream sync** — A GitHub Actions workflow checks for upstream doc changes every 6 hours and opens a PR with updated cache files
- **Build** — `npm run build` fetches/caches upstream docs, parses them into sections, and generates ~50 Starlight pages
- **Deploy** — On merge to `main`, GitHub Actions builds and deploys to GitHub Pages

## Development

```bash
npm install

# Generate pages from cached upstream docs + start dev server
npm run dev

# Force-refresh upstream docs
npm run generate:refresh

# Production build
npm run build
```

## Project structure

```
├── public/              # Static assets (CNAME, favicon, robots.txt, llms.txt)
├── scripts/
│   └── build-from-upstream.ts   # Upstream doc fetcher/parser/generator
├── src/
│   ├── content/
│   │   └── docs/
│   │       ├── index.mdx        # Home page (hand-written)
│   │       ├── getting-started/  # Generated
│   │       ├── guides/           # Generated
│   │       ├── configuration/    # Generated (features split into sub-pages)
│   │       ├── events/           # Generated
│   │       └── faq.md            # Generated
│   └── data/                     # Generated JSON (specs, sidebar config)
├── upstream-cache/      # Cached upstream markdown files
├── astro.config.mjs     # Astro + Starlight configuration
└── .github/workflows/   # Deploy, preview, upstream sync
```

## Credits

- **[panva](https://github.com/panva)** — Author and maintainer of node-oidc-provider
- **[Dahkenangnon](https://github.com/Dahkenangnon)** — Creator and maintainer of this documentation site

## License

- **Documentation content**: [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- **Code (site, scripts, components)**: [MIT](https://opensource.org/licenses/MIT)
- **oidc-provider** itself is maintained by [@panva](https://github.com/panva) under the [MIT license](https://github.com/panva/node-oidc-provider/blob/main/LICENSE.md)
