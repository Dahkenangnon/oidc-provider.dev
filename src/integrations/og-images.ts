import type { AstroIntegration } from 'astro';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import sharp from 'sharp';

const FONT_PATH = fileURLToPath(
	new URL('../assets/fonts/Inter-Bold.ttf', import.meta.url),
);

function walkDir(dir: string, ext: string): string[] {
	const results: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...walkDir(fullPath, ext));
		} else if (entry.name.endsWith(ext)) {
			results.push(fullPath);
		}
	}
	return results;
}

export function ogImageIntegration(): AstroIntegration {
	return {
		name: 'og-images',
		hooks: {
			'astro:build:done': async ({ dir }) => {
				const distDir = fileURLToPath(dir);
				const ogDir = join(distDir, 'og');
				mkdirSync(ogDir, { recursive: true });

				const fontData = readFileSync(FONT_PATH);

				const htmlFiles = walkDir(distDir, '.html');
				console.log(`[og-images] Processing ${htmlFiles.length} pages...`);

				let generated = 0;

				for (const htmlPath of htmlFiles) {
					const html = readFileSync(htmlPath, 'utf-8');

					// Extract title
					const titleMatch = html.match(/<title>([^<]+)<\/title>/);
					if (!titleMatch) continue;
					const title = decodeHtmlEntities(titleMatch[1])
						.replace(/ \| oidc-provider$/, '')
						.replace(/ — oidc-provider$/, '');

					// Extract description
					const descMatch = html.match(
						/<meta\s+name="description"\s+content="([^"]*)"[^>]*>/,
					);
					const description = descMatch
						? decodeHtmlEntities(descMatch[1]).slice(0, 120)
						: '';

					// Compute slug from relative path
					const rel = relative(distDir, htmlPath)
						.replace(/\/index\.html$/, '')
						.replace(/\.html$/, '');
					const slug = rel || 'index';
					const safeSlug = slug.replace(/\//g, '-');

					const svg = await satori(
						{
							type: 'div',
							props: {
								style: {
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'center',
									width: '1200px',
									height: '630px',
									background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
									padding: '60px 80px',
									fontFamily: 'Inter',
								},
								children: [
									{
										type: 'div',
										props: {
											style: {
												color: '#3b82f6',
												fontSize: '24px',
												marginBottom: '24px',
												fontWeight: 700,
											},
											children: 'oidc-provider.dev',
										},
									},
									{
										type: 'div',
										props: {
											style: {
												color: '#ffffff',
												fontSize: title.length > 40 ? '40px' : '52px',
												fontWeight: 700,
												lineHeight: 1.2,
												marginBottom: '20px',
											},
											children: title,
										},
									},
									...(description
										? [
												{
													type: 'div' as const,
													props: {
														style: {
															color: '#94a3b8',
															fontSize: '22px',
															lineHeight: 1.4,
														},
														children: description,
													},
												},
											]
										: []),
								],
							},
						},
						{
							width: 1200,
							height: 630,
							fonts: [
								{
									name: 'Inter',
									data: fontData,
									weight: 700 as const,
									style: 'normal' as const,
								},
							],
						},
					);

					const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
					const ogPath = join(ogDir, `${safeSlug}.png`);
					writeFileSync(ogPath, pngBuffer);
					generated++;

					// Rewrite og:image meta tag in this HTML file
					const ogImageUrl = `https://oidc-provider.dev/og/${safeSlug}.png`;
					const updatedHtml = html.replace(
						/<meta\s+property="og:image"\s+content="[^"]*"[^>]*>/,
						`<meta property="og:image" content="${ogImageUrl}">`,
					);
					writeFileSync(htmlPath, updatedHtml);
				}

				console.log(`[og-images] Generated ${generated} OG images`);
			},
		},
	};
}

function decodeHtmlEntities(str: string): string {
	return str
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&#x27;/g, "'")
		.replace(/&apos;/g, "'");
}
