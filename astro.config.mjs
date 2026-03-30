// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import featuresSidebar from './src/data/features-sidebar.json' with { type: 'json' };

// https://astro.build/config
export default defineConfig({
	site: 'https://oidc-provider.dev',
	integrations: [
		starlight({
			title: 'oidc-provider',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/panva/node-oidc-provider',
				},
			],
			editLink: {
				baseUrl: 'https://github.com/Dahkenangnon/oidc-provider.dev/edit/main/',
			},
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
			],
		}),
	],
});
