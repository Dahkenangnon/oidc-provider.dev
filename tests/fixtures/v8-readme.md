<!-- Specifications excerpt from https://github.com/panva/node-oidc-provider/blob/v8.x/README.md
     README blob: aa83aef6c77898398b83a95a0d428a535286abd1. Distributed under LICENSE.upstream. -->

## Implemented specs & features

The following specifications are implemented by oidc-provider (not exhaustive):

_Note that not all features are enabled by default, check the configuration section on how to enable them._

- [`RFC6749` - OAuth 2.0][oauth2] & [`OIDC` Core 1.0][core]
- [OIDC `Discovery 1.0`][discovery]
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
- [`RFC9449` - OAuth 2.0 Demonstration of Proof-of-Possession at the Application Layer (`DPoP`)][dpop]
- [`RFC9701` - JWT Response for OAuth Token Introspection][jwt-introspection]
- [Financial-grade API Security Profile 1.0 - Part 2: Advanced (`FAPI 1.0`)][fapi]
- [JWT Secured Authorization Response Mode for OAuth 2.0 (`JARM`)][jarm]
- [OIDC Client Initiated Backchannel Authentication Flow (`CIBA`)][ciba]

Supported Access Token formats:

- Opaque
- [JSON Web Token (JWT) Profile for OAuth 2.0 Access Tokens][jwt-at]

The following draft specifications are implemented by oidc-provider:

- [Financial-grade API: Client Initiated Backchannel Authentication Profile (`FAPI-CIBA`) - Implementer's Draft 01][fapi-ciba]
- [FAPI 2.0 Security Profile (`FAPI 2.0`) - Implementer's Draft 02][fapi2sp-id2]
- [FAPI 2.0 Message Signing (`FAPI 2.0`) - Implementer's Draft 01][fapi2ms-id1]

Updates to draft specification versions are released as MINOR library versions,
if you utilize these specification implementations consider using the tilde `~` operator in your
package.json since breaking changes may be introduced as part of these version updates. Alternatively
[acknowledge](/docs/README.md#features) the version and be notified of breaking changes as part of
your CI.


[npm-url]: https://www.npmjs.com/package/oidc-provider
[openid-certified-link]: https://openid.net/certification/
[openid-connect]: https://openid.net/connect/
[core]: https://openid.net/specs/openid-connect-core-1_0-errata2.html
[discovery]: https://openid.net/specs/openid-connect-discovery-1_0-errata2.html
[oauth2-registration]: https://www.rfc-editor.org/rfc/rfc7591.html
[registration]: https://openid.net/specs/openid-connect-registration-1_0-errata2.html
[oauth2]: https://www.rfc-editor.org/rfc/rfc6749.html
[oauth2-bearer]: https://www.rfc-editor.org/rfc/rfc6750.html
[revocation]: https://www.rfc-editor.org/rfc/rfc7009.html
[introspection]: https://www.rfc-editor.org/rfc/rfc7662.html
[pkce]: https://www.rfc-editor.org/rfc/rfc7636.html
[example-repo]: https://github.com/panva/node-oidc-provider-example
[backchannel-logout]: https://openid.net/specs/openid-connect-backchannel-1_0-errata1.html
[registration-management]: https://www.rfc-editor.org/rfc/rfc7592.html
[oauth-native-apps]: https://www.rfc-editor.org/rfc/rfc8252.html
[jar]: https://www.rfc-editor.org/rfc/rfc9101.html
[device-flow]: https://www.rfc-editor.org/rfc/rfc8628.html
[jwt-introspection]: https://www.rfc-editor.org/rfc/rfc9701.html
[sponsor-auth0]: https://a0.to/signup/panva
[mtls]: https://www.rfc-editor.org/rfc/rfc8705.html
[dpop]: https://www.rfc-editor.org/rfc/rfc9449.html
[resource-indicators]: https://www.rfc-editor.org/rfc/rfc8707.html
[jarm]: https://openid.net/specs/oauth-v2-jarm-final.html
[jwt-at]: https://www.rfc-editor.org/rfc/rfc9068.html
[support-sponsor]: https://github.com/sponsors/panva
[par]: https://www.rfc-editor.org/rfc/rfc9126.html
[rpinitiated-logout]: https://openid.net/specs/openid-connect-rpinitiated-1_0-final.html
[iss-auth-resp]: https://www.rfc-editor.org/rfc/rfc9207.html
[fapi]: https://openid.net/specs/openid-financial-api-part-2-1_0-final.html
[ciba]: https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0-final.html
[fapi-ciba]: https://openid.net/specs/openid-financial-api-ciba-ID1.html
[fapi2sp-id2]: https://openid.net/specs/fapi-2_0-security-profile-ID2.html
[fapi2ms-id1]: https://openid.net/specs/fapi-2_0-message-signing-ID1.html
[Security Policy]: https://github.com/panva/node-oidc-provider/security/policy
