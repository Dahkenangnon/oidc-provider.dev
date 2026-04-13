// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightGitHubAlerts from 'starlight-github-alerts';
import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc';
import starlightVersions from 'starlight-versions';
import featuresSidebar from './src/data/features-sidebar.json' with { type: 'json' };
import { ogImageIntegration } from './src/integrations/og-images.ts';

// https://astro.build/config
export default defineConfig({
	site: 'https://oidc-provider.dev',
	integrations: [
		starlight({
			title: 'oidc-provider',
			description: 'Community documentation for node-oidc-provider — an OpenID Certified™ OAuth 2.0 Authorization Server for Node.js.',
			logo: {
				src: './src/assets/logo.svg',
			},
			favicon: '/favicon.svg',
			lastUpdated: true,
			social: [
				{
					icon: 'github',
					label: 'Library on GitHub',
					href: 'https://github.com/panva/node-oidc-provider',
				},
			],
			editLink: {
				baseUrl: 'https://github.com/Dahkenangnon/oidc-provider.dev/edit/main/',
			},
			components: {
				Footer: './src/components/Footer.astro',
				Head: './src/components/Head.astro',
			},
			head: [
				{ tag: 'meta', attrs: { property: 'og:image', content: 'https://oidc-provider.dev/og-image.png' } },
				{ tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
				{ tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
				{
					tag: 'script',
					attrs: {
						'data-goatcounter': 'https://oidc-provider.goatcounter.com/count',
						async: true,
						src: '//gc.zgo.at/count.js',
					},
				},
				{ tag: 'link', attrs: { rel: 'alternate', type: 'application/rss+xml', title: 'oidc-provider Changelog', href: '/changelog-rss.xml' } },
			],
			customCss: ['./src/styles/custom.css'],
			tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
			plugins: [
				starlightGitHubAlerts(),
				starlightTypeDoc({
					entryPoints: ['./src/typedoc-entry.ts'],
					tsconfig: './tsconfig.typedoc.json',
					output: 'api',
					sidebar: {
						label: 'API Reference',
						collapsed: true,
					},
					typeDoc: {
						excludePrivate: true,
						excludeProtected: true,
					},
				}),
				starlightVersions({
					versions: [
						{ slug: 'v8', label: 'v8.x' },
					],
				}),
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
						{ label: 'Accounts', slug: 'getting-started/accounts' },
						{ label: 'Mounting', slug: 'getting-started/mounting' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'User Flows', slug: 'guides/user-flows' },
						{ label: 'Custom Grant Types', slug: 'guides/custom-grant-types' },
						{ label: 'Context Access', slug: 'guides/context-access' },
						{ label: 'Middleware', slug: 'guides/middleware' },
						{ label: 'Proxy', slug: 'guides/proxy' },
					],
				},
				{
					label: 'Configuration',
					items: [
						{ label: 'Adapter', slug: 'configuration/adapter' },
						{ label: 'Claims', slug: 'configuration/claims' },
						{ label: 'Clients', slug: 'configuration/clients' },
						{ label: 'Features', collapsed: true, items: featuresSidebar },
						{ label: 'Interactions', slug: 'configuration/interactions' },
						{ label: 'JWKS & JWA', slug: 'configuration/jwks' },
						{ label: 'PKCE', slug: 'configuration/pkce' },
						{ label: 'Tokens & TTL', slug: 'configuration/tokens' },
						{ label: 'Cookies', slug: 'configuration/cookies' },
						{ label: 'Other Options', slug: 'configuration/misc' },
					],
				},
				{
					label: 'Events',
					items: [
						{ label: 'Event Reference', slug: 'events/reference' },
					],
				},
				{
					label: 'FAQ',
					slug: 'faq',
				},
				{ label: 'Changelog', slug: 'changelog' },
				{ label: 'Security', slug: 'security' },
				typeDocSidebarGroup,
				{
					label: 'Community',
					items: [
						{ label: 'GitHub Discussions', link: 'https://github.com/panva/node-oidc-provider/discussions', attrs: { target: '_blank', rel: 'noopener' } },
					{ label: 'Docs Site Source', link: 'https://github.com/Dahkenangnon/oidc-provider.dev', attrs: { target: '_blank', rel: 'noopener' } },
					],
				},
			],
		}),
		ogImageIntegration(),
	],
});
