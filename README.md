# oidc-provider.dev

An unofficial community documentation site for [node-oidc-provider][], built to make the existing docs easier to browse.

**Live:** [oidc-provider.dev][]

## Architecture

The site is built with [Astro][] + [Starlight][]. A build script fetches documentation from the upstream repository, splits it into sections, and outputs Starlight pages.

```
upstream docs → scripts/build-from-upstream.ts → src/content/docs/**/*.md → dist/
```

The homepage specifications table and access-token formats are also generated from the upstream root README. The remaining homepage content is maintained manually. Generation fails if the specification structure or references cannot be parsed.

A GitHub Actions workflow checks for upstream changes every 6 hours and rebuilds and deploys to GitHub Pages when changes are detected. Pushes to `main` also trigger deployment.

## Development

```bash
npm install
npm run dev                # generate pages from cache + start dev server
npm run generate:refresh   # force-refresh upstream docs
npm test                   # upstream specification parser tests
npm run build              # production build
```

## Acknowledgments

All credit for [node-oidc-provider][] goes to [@panva][]. This site simply reorganizes the existing documentation.

## License

This project is licensed under the [MIT License][mit].

The upstream [node-oidc-provider][] project and its original documentation remain subject to their original licensing and attribution.

[node-oidc-provider]: https://github.com/panva/node-oidc-provider
[oidc-provider.dev]: https://oidc-provider.dev
[@panva]: https://github.com/panva
[Astro]: https://astro.build
[Starlight]: https://starlight.astro.build
[mit]: https://opensource.org/licenses/MIT
