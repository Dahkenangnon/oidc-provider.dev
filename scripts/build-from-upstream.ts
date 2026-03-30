/**
 * build-from-upstream.ts
 *
 * Fetches upstream panva/node-oidc-provider docs, parses them into sections,
 * and generates Starlight-compatible MDX pages.
 *
 * Usage:
 *   tsx scripts/build-from-upstream.ts            # uses cache if available
 *   UPSTREAM_REFRESH=1 tsx scripts/build-from-upstream.ts  # fetches fresh
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT = new URL("..", import.meta.url).pathname;
const CACHE_DIR = join(ROOT, "upstream-cache");
const DOCS_DIR = join(ROOT, "src/content/docs");
const DATA_DIR = join(ROOT, "src/data");

const REFRESH =
  process.env.UPSTREAM_REFRESH === "1" || process.argv.includes("--refresh");

const UPSTREAM_BASE =
  "https://raw.githubusercontent.com/panva/node-oidc-provider/main";

const SOURCES = {
  docsReadme: { url: `${UPSTREAM_BASE}/docs/README.md`, cache: "docs-readme.md" },
  events: { url: `${UPSTREAM_BASE}/docs/events.md`, cache: "events.md" },
  readme: { url: `${UPSTREAM_BASE}/README.md`, cache: "readme.md" },
} as const;

// ---------------------------------------------------------------------------
// Fetch / cache helpers
// ---------------------------------------------------------------------------

async function fetchOrCache(
  url: string,
  cacheFile: string,
): Promise<string> {
  const cachePath = join(CACHE_DIR, cacheFile);

  if (!REFRESH && existsSync(cachePath)) {
    console.log(`  [cache] ${cacheFile}`);
    return readFileSync(cachePath, "utf-8");
  }

  console.log(`  [fetch] ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const text = await res.text();

  mkdirSync(dirname(cachePath), { recursive: true });
  writeFileSync(cachePath, text);
  return text;
}

function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
}

function writeOutput(relPath: string, content: string) {
  const full = join(DOCS_DIR, relPath);
  ensureDir(dirname(full));
  writeFileSync(full, content);
  console.log(`  [write] src/content/docs/${relPath}`);
}

function writeData(relPath: string, content: string) {
  const full = join(DATA_DIR, relPath);
  ensureDir(dirname(full));
  writeFileSync(full, content);
  console.log(`  [write] src/data/${relPath}`);
}

// ---------------------------------------------------------------------------
// Slugify (matches GitHub anchor generation)
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

// ---------------------------------------------------------------------------
// Feature slug → filename (e.g. "features.deviceFlow" → "device-flow")
// ---------------------------------------------------------------------------

const FEATURE_FILENAME_OVERRIDES: Record<string, string> = {
  dPoP: "dpop",
  mTLS: "mtls",
};

function featureSlugToFilename(sectionTitle: string): string {
  const name = sectionTitle.replace("features.", "");
  if (FEATURE_FILENAME_OVERRIDES[name]) return FEATURE_FILENAME_OVERRIDES[name];
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

// ---------------------------------------------------------------------------
// Markdown heading parser (code-block aware)
// ---------------------------------------------------------------------------

interface Section {
  level: number; // 2, 3, or 4
  title: string; // raw heading text (without #)
  slug: string;
  content: string; // body content after heading, before next heading
  children: Section[];
}

function parseHeadings(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const root: Section[] = [];
  const stack: { level: number; sections: Section[] }[] = [
    { level: 1, sections: root },
  ];

  let inFencedBlock = false;
  let currentContent: string[] = [];
  let currentSection: Section | null = null;

  function flushContent() {
    if (currentSection) {
      currentSection.content = currentContent.join("\n");
    }
    currentContent = [];
  }

  for (const line of lines) {
    // Track fenced code blocks
    if (/^```/.test(line.trimStart())) {
      inFencedBlock = !inFencedBlock;
      currentContent.push(line);
      continue;
    }

    if (inFencedBlock) {
      currentContent.push(line);
      continue;
    }

    // Check for heading
    const headingMatch = line.match(/^(#{2,4})\s+(.+)$/);
    if (headingMatch) {
      flushContent();

      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      const slug = slugify(title);

      const section: Section = {
        level,
        title,
        slug,
        content: "",
        children: [],
      };

      // Find parent: pop stack until we find a level < current
      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      const parent = stack[stack.length - 1];
      parent.sections.push(section);

      stack.push({ level, sections: section.children });
      currentSection = section;
    } else {
      currentContent.push(line);
    }
  }

  // Flush last section
  flushContent();

  return root;
}

// ---------------------------------------------------------------------------
// Strip TOC block
// ---------------------------------------------------------------------------

function stripTocBlock(content: string): string {
  // The structure is:
  //   ## Configuration options
  //   <!-- DO NOT EDIT ... -->
  //   <!-- START CONF OPTIONS -->
  //   **Table of Contents**
  //   ... TOC list items ...
  //   ### adapter    <-- first actual config section
  //   ...
  //   <!-- END CONF OPTIONS -->
  //
  // We strip from <!-- START CONF OPTIONS --> up to (but not including) the first ### heading.
  // This removes the TOC while keeping the actual config sections.
  // Also strip the <!-- END CONF OPTIONS --> marker and the "DO NOT EDIT" comment.
  return content
    .replace(/<!-- DO NOT EDIT[^>]*-->\s*\n/, "")
    .replace(
      /<!-- START CONF OPTIONS -->\s*\n[\s\S]*?(?=\n###\s)/,
      "",
    )
    .replace(/<!-- END CONF OPTIONS -->\s*/, "");
}

// ---------------------------------------------------------------------------
// Frontmatter builder
// ---------------------------------------------------------------------------

function frontmatter(title: string, extra: Record<string, string> = {}): string {
  // Escape YAML special chars in title
  const safeTitle = title.includes(":") || title.includes("`")
    ? `"${title.replace(/"/g, '\\"')}"`
    : title;

  const lines = [`---`, `title: ${safeTitle}`];
  for (const [k, v] of Object.entries(extra)) {
    lines.push(`${k}: ${v}`);
  }
  lines.push(`---`, ``);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Section finders
// ---------------------------------------------------------------------------

function findSection(sections: Section[], title: string): Section | undefined {
  for (const s of sections) {
    if (s.title === title) return s;
    const found = findSection(s.children, title);
    if (found) return found;
  }
  return undefined;
}

function findSectionBySlug(sections: Section[], slug: string): Section | undefined {
  for (const s of sections) {
    if (s.slug === slug) return s;
    const found = findSectionBySlug(s.children, slug);
    if (found) return found;
  }
  return undefined;
}

function findSections(sections: Section[], titles: string[]): Section[] {
  return titles
    .map((t) => findSection(sections, t))
    .filter((s): s is Section => s !== undefined);
}

function findSectionsByPrefix(sections: Section[], prefix: string): Section[] {
  const result: Section[] = [];
  for (const s of sections) {
    if (s.title.startsWith(prefix)) result.push(s);
    result.push(...findSectionsByPrefix(s.children, prefix));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Render section to markdown (adjusting heading levels)
// ---------------------------------------------------------------------------

function renderSection(
  section: Section,
  targetLevel: number = 2,
): string {
  const heading = "#".repeat(targetLevel);
  const parts: string[] = [];

  parts.push(`${heading} ${section.title}\n`);
  if (section.content.trim()) {
    parts.push(section.content.trim());
  }

  for (const child of section.children) {
    parts.push("");
    parts.push(renderSection(child, targetLevel + 1));
  }

  return parts.join("\n");
}

function renderSections(
  sections: Section[],
  startLevel: number = 2,
): string {
  return sections.map((s) => renderSection(s, startLevel)).join("\n\n");
}

// Render section content only (without its heading, since title goes in frontmatter)
function renderSectionBody(section: Section, childLevel: number = 2): string {
  const parts: string[] = [];

  if (section.content.trim()) {
    parts.push(section.content.trim());
  }

  for (const child of section.children) {
    parts.push("");
    parts.push(renderSection(child, childLevel));
  }

  return parts.join("\n");
}

// Render multiple top-level sections, each with its heading
function renderMultipleSections(
  sections: Section[],
  topLevel: number = 2,
): string {
  return sections
    .map((s) => renderSection(s, topLevel))
    .join("\n\n");
}

// ---------------------------------------------------------------------------
// Link rewriting
// ---------------------------------------------------------------------------

interface PageMapping {
  slug: string; // anchor slug from original doc
  page: string; // target page path e.g. "/configuration/features/"
}

function buildLinkMap(
  sections: Section[],
  pageAssignments: Map<string, string>,
): Map<string, string> {
  const map = new Map<string, string>();

  function walk(secs: Section[]) {
    for (const s of secs) {
      const page = pageAssignments.get(s.slug);
      if (page) {
        map.set(s.slug, page);
      }
      walk(s.children);
    }
  }

  walk(sections);
  return map;
}

function rewriteLinks(content: string, linkMap: Map<string, string>): string {
  // Match markdown links like [text](#slug) or [text](#slug-text)
  return content.replace(
    /\[([^\]]*)\]\(#([^)]+)\)/g,
    (match, text, slug) => {
      const target = linkMap.get(slug);
      if (target) {
        return `[${text}](${target})`;
      }
      return match;
    },
  );
}

// ---------------------------------------------------------------------------
// Spec data extractor
// ---------------------------------------------------------------------------

interface SpecEntry {
  name: string;
  rfc?: string;
  children?: SpecEntry[];
  experimental?: boolean;
}

function extractSpecs(readmeContent: string): SpecEntry[] {
  const specs: SpecEntry[] = [];

  // Find the "## Implemented specs & features" section
  const specMatch = readmeContent.match(
    /## Implemented specs & features\s*\n([\s\S]*?)(?=\n## )/,
  );
  if (!specMatch) return specs;

  const specBlock = specMatch[1];
  const lines = specBlock.split("\n");

  let inExperimental = false;

  for (const line of lines) {
    if (line.includes("experimental features")) {
      inExperimental = true;
      continue;
    }

    if (line.includes("Supported Access Token formats")) {
      // Skip this sub-section
      continue;
    }

    // Top-level bullet: "- text"
    const topMatch = line.match(/^- (.+)$/);
    if (topMatch) {
      const entry = parseSpecLine(topMatch[1], inExperimental);
      if (entry) specs.push(entry);
      continue;
    }

    // Child bullet: "  - text"
    const childMatch = line.match(/^\s{2,}- (.+)$/);
    if (childMatch && specs.length > 0) {
      const parent = specs[specs.length - 1];
      if (!parent.children) parent.children = [];
      const entry = parseSpecLine(childMatch[1], inExperimental);
      if (entry) parent.children.push(entry);
    }
  }

  return specs;
}

function parseSpecLine(
  text: string,
  experimental: boolean,
): SpecEntry | null {
  // Strip markdown link syntax: [`RFC6749` - OAuth 2.0][oauth2] → `RFC6749` - OAuth 2.0
  const cleaned = text.replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1");

  // Extract RFC identifier if present
  const rfcMatch = cleaned.match(/`(RFC\d+)`/);
  // Clean display name: remove backticks
  const name = cleaned.replace(/`/g, "").trim();

  const entry: SpecEntry = { name };
  if (rfcMatch) entry.rfc = rfcMatch[1];
  if (experimental) entry.experimental = true;

  return entry;
}

// ---------------------------------------------------------------------------
// Page generation
// ---------------------------------------------------------------------------

interface PageDef {
  outputPath: string;
  title: string;
  sectionTitles?: string[]; // exact ## or ### titles to include
  sectionSlugs?: string[]; // alternative: match by slug
  sectionPrefixes?: string[]; // match by prefix
  extraContent?: string; // additional content to append
}

function generatePage(
  pageDef: PageDef,
  allSections: Section[],
  linkMap: Map<string, string>,
) {
  const sections: Section[] = [];

  if (pageDef.sectionTitles) {
    sections.push(...findSections(allSections, pageDef.sectionTitles));
  }

  if (pageDef.sectionSlugs) {
    for (const slug of pageDef.sectionSlugs) {
      const s = findSectionBySlug(allSections, slug);
      if (s) sections.push(s);
    }
  }

  if (pageDef.sectionPrefixes) {
    for (const prefix of pageDef.sectionPrefixes) {
      sections.push(...findSectionsByPrefix(allSections, prefix));
    }
  }

  if (sections.length === 0 && !pageDef.extraContent) {
    console.warn(`  [warn] No content found for ${pageDef.outputPath}`);
    return;
  }

  let body: string;
  if (sections.length === 1) {
    // Single section: title goes in frontmatter, body starts at content
    body = renderSectionBody(sections[0], 2);
  } else {
    // Multiple sections: each gets its heading
    body = renderMultipleSections(sections, 2);
  }

  if (pageDef.extraContent) {
    body += "\n\n" + pageDef.extraContent;
  }

  // Rewrite internal links
  body = rewriteLinks(body, linkMap);

  const page = frontmatter(pageDef.title) + body.trim() + "\n";
  writeOutput(pageDef.outputPath, page);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("build-from-upstream: starting...");
  console.log(`  refresh: ${REFRESH}`);

  // 1. Fetch/cache upstream files
  console.log("\nFetching upstream files:");
  const [docsReadme, eventsRaw, readmeRaw] = await Promise.all([
    fetchOrCache(SOURCES.docsReadme.url, SOURCES.docsReadme.cache),
    fetchOrCache(SOURCES.events.url, SOURCES.events.cache),
    fetchOrCache(SOURCES.readme.url, SOURCES.readme.cache),
  ]);

  // 2. Parse docs/README.md
  console.log("\nParsing docs/README.md...");
  const cleaned = stripTocBlock(docsReadme);
  const allSections = parseHeadings(cleaned);

  console.log(
    `  Found ${allSections.length} top-level sections:`,
    allSections.map((s) => s.title),
  );

  // Find the Configuration options section and flatten its children to top-level for lookup
  const configSection = findSection(allSections, "Configuration options");
  const configOptions = configSection?.children ?? [];
  console.log(`  Found ${configOptions.length} config options`);

  // All searchable sections: top-level + config options
  const searchable = [...allSections, ...configOptions];

  // 3. Build page assignment map (slug → page path)
  const pageAssignments = new Map<string, string>();

  // Helper to assign all slugs from sections to a page
  function assignSections(sections: Section[], pagePath: string) {
    for (const s of sections) {
      pageAssignments.set(s.slug, `${pagePath}#${s.slug}`);
      assignChildren(s, pagePath);
    }
  }

  function assignChildren(section: Section, pagePath: string) {
    for (const child of section.children) {
      pageAssignments.set(child.slug, `${pagePath}#${child.slug}`);
      assignChildren(child, pagePath);
    }
  }

  function assignSection(title: string, pagePath: string) {
    const s = findSection(searchable, title);
    if (s) {
      pageAssignments.set(s.slug, pagePath);
      assignChildren(s, pagePath);
    }
  }

  // Assign sections to pages
  assignSection("Basic configuration example", "/getting-started/quick-start/");
  assignSection("Accounts", "/getting-started/accounts/");
  const findAccountSec = findSection(configOptions, "findAccount");
  if (findAccountSec) {
    pageAssignments.set(findAccountSec.slug, "/getting-started/accounts/#findaccount");
    assignChildren(findAccountSec, "/getting-started/accounts/");
  }
  assignSection("Mounting oidc-provider", "/getting-started/mounting/");
  assignSection("User flows", "/guides/user-flows/");
  assignSection("Custom Grant Types", "/guides/custom-grant-types/");
  assignSection("General access to `ctx`", "/guides/context-access/");
  assignSection(
    "Registering module middlewares (helmet, ip-filters, rate-limiters, etc)",
    "/guides/middleware/",
  );
  assignSection("Pre- and post-middlewares", "/guides/middleware/");
  assignSection("Trusting TLS offloading proxies", "/guides/proxy/");

  // Config pages
  assignSection("adapter", "/configuration/adapter/");
  assignSection("claims", "/configuration/claims/");

  for (const t of ["clients", "clientBasedCORS", "clientDefaults", "clientAuthMethods"]) {
    assignSection(t, "/configuration/clients/");
  }
  // extraClientMetadata sections
  for (const s of configOptions) {
    if (s.title.startsWith("extraClientMetadata")) {
      pageAssignments.set(s.slug, "/configuration/clients/");
      assignChildren(s, "/configuration/clients/");
    }
  }

  assignSection("features", "/configuration/features/");
  // features.* sub-options → individual sub-pages
  for (const s of configOptions) {
    if (s.title.startsWith("features.")) {
      const filename = featureSlugToFilename(s.title);
      const pagePath = `/configuration/features/${filename}/`;
      pageAssignments.set(s.slug, pagePath);
      assignChildren(s, pagePath);
    }
  }

  for (const t of ["interactions"]) {
    assignSection(t, "/configuration/interactions/");
  }
  // interactions.* sub-options
  for (const s of configOptions) {
    if (s.title.startsWith("interactions.") || s.title === "interactions") {
      pageAssignments.set(s.slug, "/configuration/interactions/");
      assignChildren(s, "/configuration/interactions/");
    }
  }

  assignSection("jwks", "/configuration/jwks/");
  for (const s of configOptions) {
    if (s.title.startsWith("enabledJWA")) {
      pageAssignments.set(s.slug, "/configuration/jwks/");
      assignChildren(s, "/configuration/jwks/");
    }
  }

  assignSection("pkce", "/configuration/pkce/");
  for (const s of configOptions) {
    if (s.title.startsWith("pkce.") || s.title === "pkce") {
      pageAssignments.set(s.slug, "/configuration/pkce/");
      assignChildren(s, "/configuration/pkce/");
    }
  }

  // Tokens page: ttl + token-related options
  const tokenOptions = [
    "ttl",
    "expiresWithSession",
    "issueRefreshToken",
    "rotateRefreshToken",
    "extraTokenClaims",
  ];
  for (const t of tokenOptions) {
    assignSection(t, "/configuration/tokens/");
  }
  // formats.* options
  for (const s of configOptions) {
    if (s.title.startsWith("formats")) {
      pageAssignments.set(s.slug, "/configuration/tokens/");
      assignChildren(s, "/configuration/tokens/");
    }
  }

  assignSection("cookies", "/configuration/cookies/");
  for (const s of configOptions) {
    if (s.title.startsWith("cookies.")) {
      pageAssignments.set(s.slug, "/configuration/cookies/");
      assignChildren(s, "/configuration/cookies/");
    }
  }

  // FAQ
  assignSection("FAQ", "/faq/");
  // Also try with emoji
  const faqSection =
    findSection(allSections, "FAQ") ??
    allSections.find((s) => s.title.startsWith("FAQ"));
  if (faqSection) {
    pageAssignments.set(faqSection.slug, "/faq/");
  }

  // Track which config options are already assigned
  const assignedConfigSlugs = new Set<string>();
  for (const s of configOptions) {
    if (pageAssignments.has(s.slug)) {
      assignedConfigSlugs.add(s.slug);
    }
  }

  // Remaining config options → misc page
  const miscOptions = configOptions.filter(
    (s) => !assignedConfigSlugs.has(s.slug),
  );
  for (const s of miscOptions) {
    pageAssignments.set(s.slug, "/configuration/misc/");
    assignChildren(s, "/configuration/misc/");
  }

  const linkMap = new Map<string, string>();
  for (const [slug, page] of pageAssignments) {
    linkMap.set(slug, page);
  }

  // 4. Clean generated directories (leave index.md alone)
  console.log("\nCleaning generated directories...");
  for (const dir of [
    "getting-started",
    "guides",
    "configuration",
    "events",
  ]) {
    const dirPath = join(DOCS_DIR, dir);
    if (existsSync(dirPath)) {
      rmSync(dirPath, { recursive: true });
    }
  }
  // Remove faq.md if exists
  const faqPath = join(DOCS_DIR, "faq.md");
  if (existsSync(faqPath)) rmSync(faqPath);

  // 5. Generate pages
  console.log("\nGenerating pages:");

  // --- Getting Started ---

  // Quick Start
  const quickStartSec = findSection(allSections, "Basic configuration example");
  if (quickStartSec) {
    const page =
      frontmatter("Quick Start") +
      renderSectionBody(quickStartSec, 2).trim() +
      "\n";
    writeOutput("getting-started/quick-start.md", rewriteLinks(page, linkMap));
  }

  // Accounts (## Accounts + ### findAccount)
  const accountsSec = findSection(allSections, "Accounts");
  const findAccountSection = findSection(configOptions, "findAccount");
  {
    let body = "";
    if (accountsSec) body += renderSectionBody(accountsSec, 2);
    if (findAccountSection) {
      body += "\n\n" + renderSection(findAccountSection, 2);
    }
    const page = frontmatter("Accounts") + rewriteLinks(body.trim(), linkMap) + "\n";
    writeOutput("getting-started/accounts.md", page);
  }

  // Mounting
  const mountingSec = findSection(allSections, "Mounting oidc-provider");
  if (mountingSec) {
    const page =
      frontmatter("Mounting oidc-provider") +
      rewriteLinks(renderSectionBody(mountingSec, 2).trim(), linkMap) +
      "\n";
    writeOutput("getting-started/mounting.md", page);
  }

  // --- Guides ---

  // User flows
  const userFlowsSec = findSection(allSections, "User flows");
  if (userFlowsSec) {
    const page =
      frontmatter("User Flows") +
      rewriteLinks(renderSectionBody(userFlowsSec, 2).trim(), linkMap) +
      "\n";
    writeOutput("guides/user-flows.md", page);
  }

  // Custom Grant Types
  const customGrantsSec = findSection(allSections, "Custom Grant Types");
  if (customGrantsSec) {
    const page =
      frontmatter("Custom Grant Types") +
      rewriteLinks(renderSectionBody(customGrantsSec, 2).trim(), linkMap) +
      "\n";
    writeOutput("guides/custom-grant-types.md", page);
  }

  // Context Access
  const ctxSec = findSection(allSections, "General access to `ctx`");
  if (ctxSec) {
    const page =
      frontmatter("Context Access", {}) +
      rewriteLinks(renderSectionBody(ctxSec, 2).trim(), linkMap) +
      "\n";
    writeOutput("guides/context-access.md", page);
  }

  // Middleware (two sections combined)
  const middlewareSec1 = findSection(
    allSections,
    "Registering module middlewares (helmet, ip-filters, rate-limiters, etc)",
  );
  const middlewareSec2 = findSection(allSections, "Pre- and post-middlewares");
  {
    let body = "";
    if (middlewareSec1) body += renderSection(middlewareSec1, 2);
    if (middlewareSec2) body += "\n\n" + renderSection(middlewareSec2, 2);
    if (body) {
      const page =
        frontmatter("Middleware") + rewriteLinks(body.trim(), linkMap) + "\n";
      writeOutput("guides/middleware.md", page);
    }
  }

  // Proxy
  const proxySec = findSection(
    allSections,
    "Trusting TLS offloading proxies",
  );
  if (proxySec) {
    const page =
      frontmatter("Proxy Configuration") +
      rewriteLinks(renderSectionBody(proxySec, 2).trim(), linkMap) +
      "\n";
    writeOutput("guides/proxy.md", page);
  }

  // --- Configuration ---

  // Adapter
  generateConfigPage("adapter", "Adapter", "/configuration/adapter/", configOptions, linkMap);

  // Claims
  generateConfigPage("claims", "Claims", "/configuration/claims/", configOptions, linkMap);

  // Clients (multiple sections)
  {
    const clientSections = ["clients", "clientBasedCORS", "clientDefaults", "clientAuthMethods"];
    const sections = findSections(configOptions, clientSections);
    // Add extraClientMetadata sections
    for (const s of configOptions) {
      if (s.title.startsWith("extraClientMetadata") && !sections.includes(s)) {
        sections.push(s);
      }
    }
    const body = renderMultipleSections(sections, 2);
    const page =
      frontmatter("Clients") + rewriteLinks(body.trim(), linkMap) + "\n";
    writeOutput("configuration/clients.md", page);
  }

  // Features → overview index page + individual sub-feature pages
  {
    const featuresIntro = findSection(configOptions, "features");
    const featureSubSections: Section[] = configOptions.filter(
      (s) => s.title.startsWith("features."),
    );

    // Build sidebar entries for the generated features-sidebar.json
    const sidebarEntries: { label: string; slug: string }[] = [
      { label: "Features Overview", slug: "configuration/features" },
    ];

    // Build link list for overview page
    const linkListItems: string[] = [];

    for (const s of featureSubSections) {
      const filename = featureSlugToFilename(s.title);
      const label = s.title.replace("features.", "");
      sidebarEntries.push({
        label,
        slug: `configuration/features/${filename}`,
      });
      linkListItems.push(`- [**${s.title}**](/configuration/features/${filename}/)`);

      // Generate individual sub-feature page
      const body = renderSectionBody(s, 2);
      const page =
        frontmatter(s.title) + rewriteLinks(body.trim(), linkMap) + "\n";
      writeOutput(`configuration/features/${filename}.md`, page);
    }

    // Generate overview index page
    {
      let overviewBody = "";
      if (featuresIntro) {
        overviewBody += renderSectionBody(featuresIntro, 2).trim();
      }
      overviewBody += "\n\n## All Feature Options\n\n" + linkListItems.join("\n") + "\n";
      const page =
        frontmatter("Features") +
        rewriteLinks(overviewBody.trim(), linkMap) +
        "\n";
      writeOutput("configuration/features/index.md", page);
    }

    // Write sidebar JSON
    writeData(
      "features-sidebar.json",
      JSON.stringify(sidebarEntries, null, 2),
    );
    console.log(`  Generated ${featureSubSections.length} feature sub-pages + overview`);
  }

  // Interactions
  {
    const interactionSections: Section[] = [];
    for (const s of configOptions) {
      if (s.title === "interactions" || s.title.startsWith("interactions.")) {
        interactionSections.push(s);
      }
    }
    const body = renderMultipleSections(interactionSections, 2);
    const page =
      frontmatter("Interactions") +
      rewriteLinks(body.trim(), linkMap) +
      "\n";
    writeOutput("configuration/interactions.md", page);
  }

  // JWKS (jwks + enabledJWA*)
  {
    const jwksSections: Section[] = [];
    const jwksSec = findSection(configOptions, "jwks");
    if (jwksSec) jwksSections.push(jwksSec);
    for (const s of configOptions) {
      if (s.title.startsWith("enabledJWA")) {
        jwksSections.push(s);
      }
    }
    const body = renderMultipleSections(jwksSections, 2);
    const page =
      frontmatter("JWKS & JWA") + rewriteLinks(body.trim(), linkMap) + "\n";
    writeOutput("configuration/jwks.md", page);
  }

  // PKCE
  {
    const pkceSections: Section[] = [];
    for (const s of configOptions) {
      if (s.title === "pkce" || s.title.startsWith("pkce.")) {
        pkceSections.push(s);
      }
    }
    const body = renderMultipleSections(pkceSections, 2);
    const page =
      frontmatter("PKCE") + rewriteLinks(body.trim(), linkMap) + "\n";
    writeOutput("configuration/pkce.md", page);
  }

  // Tokens (ttl + related options)
  {
    const tokenSections: Section[] = [];
    for (const name of tokenOptions) {
      const s = findSection(configOptions, name);
      if (s) tokenSections.push(s);
    }
    // formats.*
    for (const s of configOptions) {
      if (s.title.startsWith("formats")) {
        tokenSections.push(s);
      }
    }
    const body = renderMultipleSections(tokenSections, 2);
    const page =
      frontmatter("Tokens & TTL") +
      rewriteLinks(body.trim(), linkMap) +
      "\n";
    writeOutput("configuration/tokens.md", page);
  }

  // Cookies
  {
    const cookieSections: Section[] = [];
    for (const s of configOptions) {
      if (s.title === "cookies" || s.title.startsWith("cookies.")) {
        cookieSections.push(s);
      }
    }
    const body = renderMultipleSections(cookieSections, 2);
    const page =
      frontmatter("Cookies") + rewriteLinks(body.trim(), linkMap) + "\n";
    writeOutput("configuration/cookies.md", page);
  }

  // Misc (remaining config options)
  if (miscOptions.length > 0) {
    const body = renderMultipleSections(miscOptions, 2);
    const page =
      frontmatter("Other Options") +
      rewriteLinks(body.trim(), linkMap) +
      "\n";
    writeOutput("configuration/misc.md", page);
  }

  // --- FAQ ---
  if (faqSection) {
    // Strip emoji from title if present
    const faqTitle = "FAQ";
    const body = renderSectionBody(faqSection, 2);
    const page =
      frontmatter(faqTitle) + rewriteLinks(body.trim(), linkMap) + "\n";
    writeOutput("faq.md", page);
  }

  // --- Events ---
  console.log("\nGenerating events page:");
  {
    // Strip # Events heading
    const eventsBody = eventsRaw.replace(/^# Events\s*\n/, "").trim();
    const page = frontmatter("Events Reference") + eventsBody + "\n";
    writeOutput("events/reference.md", page);
  }

  // --- Spec data ---
  console.log("\nExtracting spec data:");
  const specs = extractSpecs(readmeRaw);
  writeData("specs.json", JSON.stringify(specs, null, 2));
  console.log(`  Extracted ${specs.length} spec entries`);

  console.log("\nbuild-from-upstream: done!");
}

function generateConfigPage(
  sectionTitle: string,
  pageTitle: string,
  _pagePath: string,
  configOptions: Section[],
  linkMap: Map<string, string>,
) {
  const section = findSection(configOptions, sectionTitle);
  if (!section) {
    console.warn(`  [warn] Config section "${sectionTitle}" not found`);
    return;
  }
  const body = renderSectionBody(section, 2);
  const page =
    frontmatter(pageTitle) + rewriteLinks(body.trim(), linkMap) + "\n";
  writeOutput(
    `configuration/${sectionTitle}.md`,
    page,
  );
}

main().catch((err) => {
  console.error("build-from-upstream failed:", err);
  process.exit(1);
});
