# oidc-provider.dev

An unofficial community documentation site for [node-oidc-provider][], built to make the existing docs easier to browse.

**Live:** [oidc-provider.dev][]

## Architecture

The site is built with [Astro][] + [Starlight][]. A build script fetches documentation from the upstream repository, splits it into sections, and outputs Starlight pages.

```
upstream docs → scripts/build-from-upstream.ts → src/content/docs/**/*.md → dist/
```

A GitHub Actions workflow checks for upstream changes every 6 hours, opens a PR with updated cache files, and deploys to GitHub Pages on merge to `main`.

## Development

```bash
npm install
npm run dev                # generate pages from cache + start dev server
npm run generate:refresh   # force-refresh upstream docs
npm run build              # production build
```

## Acknowledgments

All credit for [node-oidc-provider][] goes to [@panva][]. This site simply reorganizes the existing documentation.

## License

| Scope | License |
|---|---|
| Documentation content | [CC-BY-SA 4.0][cc-by-sa] |
| Site code | [MIT][mit] |

[node-oidc-provider]: https://github.com/panva/node-oidc-provider
[oidc-provider.dev]: https://oidc-provider.dev
[@panva]: https://github.com/panva
[Astro]: https://astro.build
[Starlight]: https://starlight.astro.build
[cc-by-sa]: https://creativecommons.org/licenses/by-sa/4.0/
[mit]: https://opensource.org/licenses/MIT
