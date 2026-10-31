<!-- Specifications excerpt from https://github.com/panva/node-oidc-provider/blob/7b21c6da77f61fb66adfec72e0d8247dda7248e6/README.md
     README blob: 2c5fd1bae7ff5c70c2bbd5fdda07f58849fd383d. Distributed under LICENSE.upstream. -->

## Implemented specs & features

The following specifications are implemented by oidc-provider (not exhaustive):

_Note that not all features are enabled by default, check the configuration section on how to enable them._

- [`RFC6749` - OAuth 2.0][oauth2] & [`OIDC` Core 1.0][core]
- [OIDC `Discovery 1.0`][discovery] & [`RFC8414` Authorization Server Metadata][rfc8414]
- Dynamic Client Registration
  - [OIDC `Dynamic Client Registration 1.0`][registration]
  - [`RFC7591` - OAuth 2.0 Dynamic Client Registration Protocol][oauth2-registration]
  - [`RFC7592` - OAuth 2.0 Dynamic Client Registration Management Protocol][registration-management]
- [OIDC `RP-Initiated Logout 1.0`][rpinitiated-logout]
- [OIDC `Back-Channel Logout 1.0`][backchannel-logout]
- [`RFC7009` - OAuth 2.0 Token Revocation][revocation]
- [`RFC7636` - Proof Key for Code Exchange (`PKCE`)][pkce]
- [`RFC7662` - OAuth 2.0 Token Introspection][introspection]
- [`RFC8252` - OAuth 2.0 for Native Apps BCP (`AppAuth`)][oauth-native-apps]
- [`RFC8628` - OAuth 2.0 Device Authorization Grant (`Device Flow`)][device-flow]
- [`RFC8705` - OAuth 2.0 Mutual TLS Client Authentication and Certificate Bound Access Tokens (`MTLS`)][mtls]
- [`RFC8707` - OAuth 2.0 Resource Indicators][resource-indicators]
- [`RFC9101` - OAuth 2.0 JWT-Secured Authorization Request (`JAR`)][jar]
- [`RFC9126` - OAuth 2.0 Pushed Authorization Requests (`PAR`)][par]
- [`RFC9207` - OAuth 2.0 Authorization Server Issuer Identifier in Authorization Response][iss-auth-resp]
- [`RFC9396` - OAuth 2.0 Rich Authorization Requests][rar]
- [`RFC9449` - OAuth 2.0 Demonstration of Proof-of-Possession at the Application Layer (`DPoP`)][dpop]
- [`RFC9701` - JWT Response for OAuth Token Introspection][jwt-introspection]
- [FAPI 1.0 Security Profile - Part 2: Advanced (`FAPI 1.0`)][fapi]
- [FAPI 2.0 Security Profile (`FAPI 2.0`)][fapi2sp]
- [FAPI 2.0 Message Signing (`FAPI 2.0`)][fapi2ms]
- [JWT Secured Authorization Response Mode for OAuth 2.0 (`JARM`)][jarm]
- [OIDC Client Initiated Backchannel Authentication Flow (`CIBA`)][ciba]
- [OIDC Relying Party Metadata Choices 1.0][rp-metadata-choices]

Supported Access Token formats:

- Opaque
- [JSON Web Token (JWT) Profile for OAuth 2.0 Access Tokens][jwt-at]

The following specifications and drafts are implemented as experimental features:

- [Financial-grade API: Client Initiated Backchannel Authentication Profile (`FAPI-CIBA`) - Implementers Draft 01][fapi-ciba]
- [OAuth 2.0 Attestation-Based Client Authentication - Draft 12][attestation-client-auth]
- [OAuth Client ID Metadata Document (`CIMD`) - Draft 02][cimd]
- [OpenID for Verifiable Credential Issuance 1.0][openid4vci]

Updates to experimental feature specification versions are released as MINOR library versions,
if you utilize these features consider using the tilde `~` operator in your
package.json since breaking changes may be introduced as part of these version updates. Alternatively
[acknowledge](/docs/README.md#features) the version and be notified of breaking changes as part of
your CI.


[npm-url]: https://www.npmjs.com/package/oidc-provider
[openid-certified-link]: https://openid.net/certification/
[openid-connect]: https://openid.net/connect/
[core]: https://openid.net/specs/openid-connect-core-1_0-errata2.html
[discovery]: https://openid.net/specs/openid-connect-discovery-1_0-errata2.html
[oauth2-registration]: https://www.rfc-editor.org/info/rfc7591/
[registration]: https://openid.net/specs/openid-connect-registration-1_0-errata2.html
[oauth2]: https://www.rfc-editor.org/info/rfc6749/
[oauth2-bearer]: https://www.rfc-editor.org/info/rfc6750/
[revocation]: https://www.rfc-editor.org/info/rfc7009/
[introspection]: https://www.rfc-editor.org/info/rfc7662/
[pkce]: https://www.rfc-editor.org/info/rfc7636/
[example-repo]: https://github.com/panva/node-oidc-provider-example
[backchannel-logout]: https://openid.net/specs/openid-connect-backchannel-1_0-errata1.html
[registration-management]: https://www.rfc-editor.org/info/rfc7592/
[oauth-native-apps]: https://www.rfc-editor.org/info/rfc8252/
[jar]: https://www.rfc-editor.org/info/rfc9101/
[device-flow]: https://www.rfc-editor.org/info/rfc8628/
[jwt-introspection]: https://www.rfc-editor.org/info/rfc9701/
[sponsor-auth0]: https://a0.to/signup/panva
[mtls]: https://www.rfc-editor.org/info/rfc8705/
[dpop]: https://www.rfc-editor.org/info/rfc9449/
[resource-indicators]: https://www.rfc-editor.org/info/rfc8707/
[jarm]: https://openid.net/specs/oauth-v2-jarm-errata1.html
[jwt-at]: https://www.rfc-editor.org/info/rfc9068/
[support-sponsor]: https://github.com/sponsors/panva
[par]: https://www.rfc-editor.org/info/rfc9126/
[rpinitiated-logout]: https://openid.net/specs/openid-connect-rpinitiated-1_0-final.html
[iss-auth-resp]: https://www.rfc-editor.org/info/rfc9207/
[rar]: https://www.rfc-editor.org/info/rfc9396/
[fapi]: https://openid.net/specs/openid-financial-api-part-2-1_0-final.html
[ciba]: https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0-final.html
[fapi-ciba]: https://openid.net/specs/openid-financial-api-ciba-ID1.html
[fapi2sp]: https://openid.net/specs/fapi-security-profile-2_0-final.html
[fapi2ms]: https://openid.net/specs/fapi-message-signing-2_0-final.html
[Security Policy]: https://github.com/panva/node-oidc-provider/security/policy
[rp-metadata-choices]: https://openid.net/specs/openid-connect-rp-metadata-choices-1_0-final.html
[rfc8414]: https://www.rfc-editor.org/info/rfc8414/
[attestation-client-auth]: https://www.ietf.org/archive/id/draft-ietf-oauth-attestation-based-client-auth-12.html
[cimd]: https://www.ietf.org/archive/id/draft-ietf-oauth-client-id-metadata-document-02.html
[openid4vci]: https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0-final.html
