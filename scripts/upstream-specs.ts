export interface Specification {
  name: string;
  url: string;
  experimental: boolean;
}

export interface AccessTokenFormat {
  name: string;
  url?: string;
}

export interface SpecificationData {
  specifications: Specification[];
  accessTokenFormats: AccessTokenFormat[];
}

// This intentionally recognizes the README's structure rather than guessing when
// it changes. A failed build preserves the last deployed, complete table.
export function extractSpecs(readme: string): SpecificationData {
  const markdown = readme.replace(/\r\n/g, "\n");
  const section = markdown.match(
    /^## Implemented specs & features[ \t]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m,
  )?.[1];
  if (!section) throw new Error("Missing upstream implemented specifications section");

  const normalizeReference = (label: string) => label.trim().replace(/\s+/g, " ").toLowerCase();
  const references = new Map<string, string>();
  for (const match of markdown.matchAll(/^ {0,3}\[([^\]]+)\]:[ \t]+(\S+)/gm)) {
    references.set(normalizeReference(match[1]), match[2].replace(/^<|>$/g, ""));
  }

  const data: SpecificationData = { specifications: [], accessTokenFormats: [] };
  let mode: "stable" | "formats" | "experimental" = "stable";
  let sawFormats = false;
  let sawExperimental = false;
  const lines = section.split("\n");

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();
    if (line === "Supported Access Token formats:") {
      if (mode !== "stable") throw new Error("Unexpected upstream access-token formats section");
      mode = "formats";
      sawFormats = true;
      continue;
    }
    if (/^The following (?:specifications and drafts are implemented as experimental features|draft specifications are implemented by oidc-provider):$/.test(line)) {
      if (mode !== "formats") throw new Error("Unexpected upstream experimental specifications section");
      mode = "experimental";
      sawExperimental = true;
      continue;
    }
    if (/^#|^\d+[.)]\s/.test(line)) {
      throw new Error(`Unrecognized upstream specifications structure: ${line}`);
    }
    const bullet = line.match(/^[-*+]\s+(.+)$/)?.[1];
    if (!bullet) continue;

    if (mode === "stable" && bullet === "Dynamic Client Registration") {
      const next = lines.slice(index + 1).find((candidate) => candidate.trim());
      if (!next || !/^\s+[-*+]\s+\[/.test(next)) {
        throw new Error("Missing upstream dynamic registration specifications");
      }
      continue;
    }
    if (mode === "formats" && bullet === "Opaque") {
      data.accessTokenFormats.push({ name: bullet });
      continue;
    }

    const links = [...bullet.matchAll(/\[([^\]\n]+)\](?:\[([^\]\n]+)\]|\(([^\s)]+)\))/g)];
    // All of a bullet must consist of links, optionally joined by '&'. This
    // catches new plain-text entries and partially recognized Markdown alike.
    let end = 0;
    for (const [position, link] of links.entries()) {
      const separator = bullet.slice(end, link.index).trim();
      if (separator !== (position === 0 ? "" : "&")) {
        throw new Error(`Unrecognized upstream specification entry: ${bullet}`);
      }
      end = link.index + link[0].length;
    }
    if (!links.length || bullet.slice(end).trim()) {
      throw new Error(`Unrecognized upstream specification entry: ${bullet}`);
    }

    for (const link of links) {
      const name = link[1].replace(/`/g, "").trim();
      const url = link[3] ?? references.get(normalizeReference(link[2]));
      if (!url) throw new Error(`Unresolved upstream specification reference: ${link[2]}`);
      if (!/^https?:$/.test(new URL(url).protocol)) {
        throw new Error(`Unsafe upstream specification URL: ${url}`);
      }
      if (!name) throw new Error("Empty upstream specification name");
      if (mode === "formats") data.accessTokenFormats.push({ name, url });
      else data.specifications.push({ name, url, experimental: mode === "experimental" });
    }
  }

  if (!sawFormats || !data.accessTokenFormats.length) {
    throw new Error("Missing upstream access-token formats");
  }
  if (!sawExperimental || !data.specifications.some((entry) => entry.experimental)) {
    throw new Error("Missing upstream experimental specifications");
  }
  if (!data.specifications.some((entry) => !entry.experimental)) {
    throw new Error("Missing upstream stable specifications");
  }
  return data;
}
