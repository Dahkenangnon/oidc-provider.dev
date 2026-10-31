import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { extractSpecs } from "../scripts/upstream-specs.ts";

const current = readFileSync(new URL("./fixtures/current-readme.md", import.meta.url), "utf8");
const v8 = readFileSync(new URL("./fixtures/v8-readme.md", import.meta.url), "utf8");

test("current upstream coverage keeps every specification and its experimental status", () => {
  const { specifications, accessTokenFormats } = extractSpecs(current);
  assert.equal(specifications.filter((spec) => !spec.experimental).length, 28);
  assert.equal(specifications.filter((spec) => spec.experimental).length, 4);
  assert.equal(new Set(specifications.map((spec) => spec.url)).size, 32);
  assert.deepEqual(specifications.find((spec) => spec.name.startsWith("RFC9396")), {
    name: "RFC9396 - OAuth 2.0 Rich Authorization Requests",
    url: "https://www.rfc-editor.org/info/rfc9396/",
    experimental: false,
  });
  for (const [name, suffix] of [
    ["OAuth 2.0 Attestation-Based Client Authentication - Draft 12", "draft-ietf-oauth-attestation-based-client-auth-12.html"],
    ["OAuth Client ID Metadata Document (CIMD) - Draft 02", "draft-ietf-oauth-client-id-metadata-document-02.html"],
    ["OpenID for Verifiable Credential Issuance 1.0", "openid-4-verifiable-credential-issuance-1_0-final.html"],
  ]) {
    const spec = specifications.find((entry) => entry.name === name);
    assert.ok(spec, name);
    assert.equal(spec.experimental, true);
    assert.ok(spec.url.endsWith(suffix));
  }
  assert.deepEqual(accessTokenFormats, [
    { name: "Opaque" },
    { name: "JSON Web Token (JWT) Profile for OAuth 2.0 Access Tokens", url: "https://www.rfc-editor.org/info/rfc9068/" },
  ]);
  assert.ok(!specifications.some((spec) => /Opaque|Access Tokens$/.test(spec.name)));
});

test("compound bullets and nested registration entries become individual specifications", () => {
  const { specifications } = extractSpecs(current);
  assert.deepEqual(specifications.slice(0, 4).map((entry) => entry.name), [
    "RFC6749 - OAuth 2.0", "OIDC Core 1.0", "OIDC Discovery 1.0", "RFC8414 Authorization Server Metadata",
  ]);
  assert.deepEqual(specifications.slice(4, 7).map((entry) => entry.name), [
    "OIDC Dynamic Client Registration 1.0",
    "RFC7591 - OAuth 2.0 Dynamic Client Registration Protocol",
    "RFC7592 - OAuth 2.0 Dynamic Client Registration Management Protocol",
  ]);
  assert.equal(specifications[3].url, "https://www.rfc-editor.org/info/rfc8414/");
});

test("v8 draft heading is classified as experimental without leaking formats", () => {
  const { specifications, accessTokenFormats } = extractSpecs(v8);
  assert.equal(specifications.filter((spec) => !spec.experimental).length, 23);
  assert.equal(specifications.filter((spec) => spec.experimental).length, 3);
  assert.equal(accessTokenFormats.length, 2);
  assert.ok(specifications.find((spec) => spec.name.includes("Implementer's Draft 02"))?.experimental);
});

test("a new upstream feature is included without editing the homepage", () => {
  const changed = current.replace(
    "Supported Access Token formats:",
    "- [New upstream capability](https://example.com/new-spec)\n\nSupported Access Token formats:",
  );
  assert.deepEqual(extractSpecs(changed).specifications.find((spec) => spec.name === "New upstream capability"), {
    name: "New upstream capability", url: "https://example.com/new-spec", experimental: false,
  });
});

test("reference labels are case insensitive and CRLF input is supported", () => {
  const changed = current.replace(
    "[rfc8414]: https://www.rfc-editor.org/info/rfc8414/",
    "[RFC8414]: <https://www.rfc-editor.org/info/rfc8414/>",
  ).replaceAll("\n", "\r\n");
  assert.deepEqual(extractSpecs(changed), extractSpecs(current));
});

test("the specifications section ends before certification lists", () => {
  const changed = current.replace(
    "[npm-url]:",
    "## Certification\n\n- A certification profile, not a specification\n\n[npm-url]:",
  );
  assert.deepEqual(extractSpecs(changed), extractSpecs(current));
});

for (const [description, transform, message] of [
  ["missing implemented heading", (text: string) => text.replace("## Implemented specs & features", "## Renamed"), /Missing upstream implemented/],
  ["missing token heading", (text: string) => text.replace("Supported Access Token formats:", "Token formats:"), /Unrecognized upstream specification entry/],
  ["missing experimental heading", (text: string) => text.replace("as experimental features:", "as preview features:"), /Missing upstream experimental/],
  ["unresolved reference", (text: string) => text.replace("[rar]:", "[removed]:"), /Unresolved upstream specification reference: rar/],
  ["new plain-text specification", (text: string) => text.replace("- Dynamic Client Registration", "- Unknown specification"), /Unrecognized upstream specification entry/],
  ["partially recognized bullet", (text: string) => text.replace(" & [`OIDC` Core 1.0][core]", " & Unlinked specification"), /Unrecognized upstream specification entry/],
  ["dangling registration group", (text: string) => text.replace(/  - /g, "- "), /Missing upstream dynamic registration/],
  ["unsafe URL", (text: string) => text.replace("[rar]: https://www.rfc-editor.org/info/rfc9396/", "[rar]: javascript:alert(1)"), /Unsafe upstream specification URL/],
  ["new subsection", (text: string) => text.replace("Supported Access Token formats:", "### Changed structure\n\nSupported Access Token formats:"), /Unrecognized upstream specifications structure/],
] as const) {
  test(`rejects ${description}`, () => {
    assert.throws(() => extractSpecs(transform(current)), message);
  });
}

test("empty required lists fail rather than producing an incomplete table", () => {
  assert.throws(() => extractSpecs(current.replace(/- Opaque\n- \[JSON Web Token[^\n]+/, "")), /Missing upstream access-token formats/);
  assert.throws(() => extractSpecs(current.replace(/- \[Financial-grade API:[\s\S]*?\n\nUpdates/, "Updates")), /Missing upstream experimental specifications/);
  assert.throws(() => extractSpecs(current.replace(/- \[`RFC6749`[\s\S]*?(?=Supported Access Token)/, "")), /Missing upstream stable specifications/);
});
