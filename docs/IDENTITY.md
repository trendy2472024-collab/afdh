# Workload identity

AFDH treats production apply as a **three-key lock**: evidence + human approval + **workload identity**. Identity is a credential, not a boolean.

This kernel validates an identity *context*. It does **not** call SPIRE, Entra, AWS STS, or a cluster OIDC issuer. A green fixture is a fixture. Live federation is 1.0, same class as live Semgrep.

## What 2026 actually standardized

| Standard | Date | What it gives AFDH | What we enforce in-process |
|---|---|---|---|
| [SPIFFE](https://github.com/spiffe/spiffe) ID + SVID | living | `spiffe://trust-domain/path`. Three SVID formats: X.509 (mTLS), JWT (bearer), WIT. | URI shape, trust-domain allowlist. JWT-SVID **cannot** prod-apply. |
| SPIRE | living | Attestation (selectors) + short-lived SVIDs via Workload API. Default TTL ~1h X.509, ~5 min JWT. | `attested` must be true. No live agent. |
| [WIMSE identifier-03](https://datatracker.ietf.org/doc/html/draft-ietf-wimse-identifier-03) | 2026-07-06 | Absolute URI, no query/fragment/userinfo/port, ≤2048 bytes, schemes `spiffe` / `wimse`. Trust domain MUST NOT be an IP. | Parser fail-closes on illegal URIs and IP authorities. |
| [WIMSE WPT-02](https://datatracker.ietf.org/doc/html/draft-ietf-wimse-wpt-02) | 2026-08-27 | Workload Identity Token is **not** a bearer. WPT (`Authorization: WPT`) proves possession: `aud`, `exp`, `jti`, `wth` (SHA-256 of the WIT). Lifetimes MUST be minutes or seconds. | WIT without WPT *and* without HTTP signatures is deny. Missing `jti` / `wth` is deny. TTL > 15 min is deny. |
| [WIMSE HTTP signatures-06](https://datatracker.ietf.org/doc/html/draft-ietf-wimse-http-signature-06) | 2026-08-04 | Alternative application-layer PoP. AIMS treats WPT and HTTP Message Signatures as peer mechanisms. | `httpSigPresent` satisfies PoP for a WIT. |
| [WIMSE AIMS-00](https://datatracker.ietf.org/doc/html/draft-ietf-wimse-aims-00) | 2026-09-15 | Agents get **exactly one** WIMSE identifier (MAY be a SPIFFE ID). **The LLM MUST NOT hold credentials.** Static keys are an antipattern. Credentials MUST expire. Revoked tokens MUST NOT continue to be used. | `holder=llm` deny. `static-key` deny. `revoked` deny. Missing `exp` deny. |
| [WIMSE practices-06](https://datatracker.ietf.org/doc/html/draft-ietf-wimse-workload-identity-practices-06) | 2026-08-11 | Kubernetes SA tokens are for the **platform API**. `aud` must match. Do not reuse them as cloud credentials. | `oidc-sa` deny on prod-apply. Audience must equal `afdh://deploy-gate`. |
| Cloud federation | living | AWS IRSA, GCP WIF, Entra federated credentials: exchange a projected SA token / JWT-SVID for a **short-lived** cloud token. Dedicated `aud` per cloud (Entra: `api://AzureADTokenExchange`). | Typed as future adapter. Not implemented. |
| NIST SP 800-207 | 2020 | Policy engine decides; policy administrator issues a session credential; PEP enforces. No implicit trust. | Human is PE for prod-apply. Missing identity is deny, not skip. |
| [Unit42 Spooffe](https://unit42.paloaltonetworks.com/kubernetes-spiffe-spire-identity-spoofing/) | 2026-09-10 | Node-root can spoof cgroup selectors and harvest every SVID on the node (JWT and X.509). Trust-the-node collapses. | JWT-SVID cannot prod-apply. `nodeIsolated !== true` is deny. Runtime isolation itself is 1.0. |

## Fail closed (not fail open)

NIST zero trust does not say “fail closed” as a slogan. The operational reading for a control plane is:

- Missing scanner → **block** (do not invent a green SAST).
- Missing / expired / wrong-audience identity → **deny** (do not fail-open because SPIRE is down).
- Chat user presenting a session cookie as the deployer → **deny**.
- LLM holding the WIT private key → **deny** (prompt injection would then be production apply).
- Bearer JWT-SVID on prod-apply → **deny** (replay; Spooffe: node-root harvests SVIDs — PoP + short TTL + node isolation is what we can encode).
- Revoked credential still cached → **deny**.
- Shared node, no isolation → **deny** (the kernel cannot prove isolation; it can refuse to pretend).

Fail-open on identity outage is how you get a weekend deploy with no principal.

## Principals

```
spiffe://afdh.local/id/user
spiffe://afdh.local/ns/control/sa/orchestrator
spiffe://afdh.local/ns/control/sa/specialist
spiffe://afdh.local/ns/control/sa/reviewer
spiffe://afdh.local/ns/control/sa/factory
spiffe://afdh.local/ns/preview/sa/deploy-gate   ← only this may prod-apply
```

Reviewer ≠ builder. User intent is not a grant. The preview fixture is `WIT + WPT`, 5-minute TTL, `nodeIsolated`, labeled fixture.

## Commands

```
afdh identity
afdh whoami
```

In the TUI: `whoami` (also on the policy tab). Chat-user prod-apply must print DENY. Shared-node and revoked must print DENY. WIT+HTTP-SIG (no WPT) may print ALLOW — that is the AIMS peer PoP, not a skip.

## Not yet

- SPIRE Workload API
- JWT/X.509/WIT signature verify against a bundle
- Real WPT `wth` hash of a real WIT, `Authorization: WPT` on a real HTTP request
- IRSA / WIF / Entra token exchange
- Node-isolation against SVID theft (runtime; the kernel only refuses bearers and unisolated nodes)

See [ROADMAP.md](ROADMAP.md). Highest-leverage follow-up: a SPIFFE adapter that fetches a real SVID and still fail-closes when the agent is down ([issue #5](https://github.com/trendy2472024-collab/afdh/issues/5)).
