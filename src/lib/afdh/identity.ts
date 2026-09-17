/**
 * Workload identity — SPIFFE / WIMSE shaped, fail closed.
 *
 * Structural validation of an identity *context*. Does not talk to SPIRE,
 * Entra, STS, or a cluster OIDC issuer. A passing fixture is a fixture.
 * Crypto verification of SVIDs is a 1.0 adapter, same class as live Semgrep.
 *
 * Standards this encodes (see docs/IDENTITY.md):
 *   SPIFFE ID + SVID (X.509 / JWT / WIT)
 *   draft-ietf-wimse-identifier-03
 *   draft-ietf-wimse-wpt-02
 *   draft-ietf-wimse-http-signature-06
 *   draft-ietf-wimse-aims-00 (2026-09-15)
 *   draft-ietf-wimse-workload-identity-practices-06
 *   Unit42 Spooffe (2026-09-10): node-root = every SVID on the node
 */

export type PrincipalKind =
  | "user"
  | "orchestrator"
  | "specialist"
  | "reviewer"
  | "factory"
  | "workload";

export type CredentialFormat =
  | "none"
  | "static-key"
  | "jwt-svid"
  | "x509-svid"
  | "wit"
  | "wic"
  | "oidc-sa";

export type CredentialHolder = "agent-runtime" | "llm" | "human" | "unknown";

export type IdentityAction = "prod-apply" | "secrets-read" | "skill-mutate";

export interface WorkloadId {
  uri: string;
  scheme: "spiffe" | "wimse";
  trustDomain: string;
  path: string;
}

export interface IdentityContext {
  principal: PrincipalKind;
  uri: string | null;
  format: CredentialFormat;
  audience: string | null;
  exp: number | null;
  /** Workload Proof Token present (draft-ietf-wimse-wpt). */
  wptPresent: boolean;
  /** HTTP Message Signatures as alternative PoP (draft-ietf-wimse-http-signature). */
  httpSigPresent?: boolean;
  /** WPT `jti` — unique, collision-resistant. Required when WPT is the PoP. */
  wptJti?: string | null;
  /** WPT `wth` — SHA-256 of the WIT. Required when WPT is the PoP. */
  wptWth?: boolean;
  /** Node isolation. False after Spooffe-class node-root. */
  nodeIsolated?: boolean;
  /** AIMS: revoked tokens MUST NOT continue to be used. */
  revoked?: boolean;
  attested: boolean;
  holder: CredentialHolder;
  now?: number;
}

export interface IdentityDecision {
  ok: boolean;
  reason: string;
  gate: string;
}

export const TRUST_DOMAIN = "afdh.local";
export const DEPLOY_AUDIENCE = "afdh://deploy-gate";
export const TRUSTED_DOMAINS: readonly string[] = [TRUST_DOMAIN];

/** WPT lifetimes MUST be minutes or seconds (wpt-02). JWT-SVID default ~5 min. */
export const WIT_MAX_TTL_SEC = 15 * 60;
/** SPIRE default X.509-SVID TTL is one hour. */
export const X509_MAX_TTL_SEC = 60 * 60;

export const PRINCIPAL_URIS: Record<PrincipalKind, string> = {
  user: `spiffe://${TRUST_DOMAIN}/id/user`,
  orchestrator: `spiffe://${TRUST_DOMAIN}/ns/control/sa/orchestrator`,
  specialist: `spiffe://${TRUST_DOMAIN}/ns/control/sa/specialist`,
  reviewer: `spiffe://${TRUST_DOMAIN}/ns/control/sa/reviewer`,
  factory: `spiffe://${TRUST_DOMAIN}/ns/control/sa/factory`,
  workload: `spiffe://${TRUST_DOMAIN}/ns/preview/sa/deploy-gate`,
};

/** Catalog of fail-closed gates. Missing input is a deny, never a skip. */
export const FAIL_CLOSED_GATES = [
  {
    id: "G-SAST",
    when: "security.sast unbound or unpinned",
    effect: "block security-verify (F5)",
    standard: "AFDH ADR-003 / ADR-009",
  },
  {
    id: "G-EVIDENCE",
    when: "deploy-gate before evidence-gate",
    effect: "block deploy (F6)",
    standard: "AFDH evidence ladder",
  },
  {
    id: "G-HUMAN",
    when: "prod-apply without an approval record",
    effect: "block deploy (ADR-008)",
    standard: "NIST SP 800-207 PE/PA split",
  },
  {
    id: "G-PRINCIPAL",
    when: "chat user / orchestrator / specialist presents as the deployer",
    effect: "deny prod-apply",
    standard: "WIMSE AIMS — agent identifier ≠ user session",
  },
  {
    id: "G-IDENTITY",
    when: "no workload credential",
    effect: "deny prod-apply",
    standard: "SPIFFE SVID / WIMSE WIT",
  },
  {
    id: "G-STATIC",
    when: "static API key / long-lived secret",
    effect: "deny",
    standard: "WIMSE AIMS — static keys are an antipattern",
  },
  {
    id: "G-BEARER",
    when: "JWT-SVID used as a bearer for prod-apply",
    effect: "deny",
    standard: "WIMSE WPT — WIT is proof-of-possession, not bearer; Spooffe harvests JWT-SVIDs",
  },
  {
    id: "G-WPT",
    when: "WIT without WPT and without HTTP Message Signatures",
    effect: "deny",
    standard: "draft-ietf-wimse-wpt-02; draft-ietf-wimse-http-signature-06",
  },
  {
    id: "G-AUD",
    when: "audience mismatch, or platform SA token reused off-platform",
    effect: "deny",
    standard: "WIMSE practices — aud MUST match; K8s tokens stay on the API",
  },
  {
    id: "G-EXP",
    when: "expired or missing exp",
    effect: "deny (fail closed on identity outage)",
    standard: "AIMS — credentials MUST include explicit expiration",
  },
  {
    id: "G-TTL",
    when: "remaining lifetime longer than WPT/JWT (15m) or X.509 (1h)",
    effect: "deny",
    standard: "wpt-02 lifetimes MUST be minutes or seconds",
  },
  {
    id: "G-ATTEST",
    when: "unattested process (no SPIRE selectors / no posture)",
    effect: "deny",
    standard: "SPIRE attestation; WIMSE AIMS posture assessment",
  },
  {
    id: "G-LLM",
    when: "LLM runtime holds the agent credential",
    effect: "deny",
    standard: "WIMSE AIMS — the model MUST NOT see credentials",
  },
  {
    id: "G-URI",
    when: "identifier is not a WIMSE/SPIFFE URI (or uses an IP trust domain)",
    effect: "deny",
    standard: "draft-ietf-wimse-identifier-03",
  },
  {
    id: "G-DOMAIN",
    when: "trust domain not in the local bundle",
    effect: "deny",
    standard: "SPIFFE federation / WIMSE trust domain",
  },
  {
    id: "G-REVOKE",
    when: "revoked or downgraded credential still presented",
    effect: "deny",
    standard: "WIMSE AIMS — cached tokens MUST NOT continue after revocation",
  },
  {
    id: "G-NODE",
    when: "workload shares a node without isolation (Spooffe-class)",
    effect: "deny prod-apply",
    standard: "Unit42 Spooffe 2026-09 — node-root = every SVID on the node",
  },
  {
    id: "G-FACTORY",
    when: "one-off or privilege skill proposal",
    effect: "refuse",
    standard: "AFDH ADR-006",
  },
  {
    id: "G-PIN",
    when: "latest or curl | sh bind",
    effect: "refuse bind (S3)",
    standard: "AFDH ADR-009",
  },
  {
    id: "G-QUARANTINE",
    when: "instruction-override in a project skill",
    effect: "hide from specialists",
    standard: "AFDH ADR-005",
  },
] as const;

function isIpTrustDomain(host: string): boolean {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  if (host.includes(":")) return true;
  return false;
}

export function parseWorkloadId(uri: string): { ok: true; id: WorkloadId } | { ok: false; reason: string } {
  const t = uri.trim();
  if (!t) return { ok: false, reason: "empty workload identifier" };
  if (t.length > 2048) return { ok: false, reason: "identifier exceeds 2048 bytes (WIMSE)" };
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return { ok: false, reason: "identifier is not an absolute URI" };
  }
  if (u.protocol !== "spiffe:" && u.protocol !== "wimse:") {
    return { ok: false, reason: `scheme ${u.protocol.replace(":", "")} is not spiffe or wimse` };
  }
  if (u.username || u.password) {
    return { ok: false, reason: "identifier MUST NOT contain userinfo (WIMSE)" };
  }
  if (u.port) return { ok: false, reason: "identifier MUST NOT contain a port (WIMSE)" };
  if (u.search) return { ok: false, reason: "identifier MUST NOT contain a query (WIMSE)" };
  if (u.hash) return { ok: false, reason: "identifier MUST NOT contain a fragment (WIMSE)" };
  if (!u.hostname) return { ok: false, reason: "trust domain (authority) is empty" };
  if (isIpTrustDomain(u.hostname)) {
    return { ok: false, reason: "trust domain MUST NOT be an IP address (WIMSE identifier-03)" };
  }
  return {
    ok: true,
    id: {
      uri: t,
      scheme: u.protocol === "spiffe:" ? "spiffe" : "wimse",
      trustDomain: u.hostname.toLowerCase(),
      path: u.pathname || "/",
    },
  };
}

function hasPop(ctx: IdentityContext): boolean {
  if (ctx.format === "x509-svid") return true;
  if (ctx.httpSigPresent) return true;
  if (ctx.wptPresent) return true;
  return false;
}

export function identityGate(
  ctx: IdentityContext,
  opts: { action?: IdentityAction; audience?: string } = {},
): IdentityDecision {
  const action = opts.action ?? "prod-apply";
  const expectedAud = opts.audience ?? DEPLOY_AUDIENCE;
  const now = ctx.now ?? Math.floor(Date.now() / 1000);

  if (ctx.holder === "llm") {
    return {
      ok: false,
      reason: "LLM MUST NOT hold agent credentials (WIMSE AIMS)",
      gate: "G-LLM",
    };
  }

  if (ctx.revoked) {
    return {
      ok: false,
      reason: "revoked credential MUST NOT continue to be used (WIMSE AIMS)",
      gate: "G-REVOKE",
    };
  }

  if (action === "prod-apply" && ctx.principal !== "workload") {
    return {
      ok: false,
      reason: `principal=${ctx.principal} cannot prod-apply — the chat session is not the workload`,
      gate: "G-PRINCIPAL",
    };
  }

  if (ctx.format === "none" || !ctx.uri) {
    return { ok: false, reason: "workload identity missing", gate: "G-IDENTITY" };
  }

  if (ctx.format === "static-key") {
    return {
      ok: false,
      reason: "static API keys are an antipattern (WIMSE AIMS)",
      gate: "G-STATIC",
    };
  }

  const parsed = parseWorkloadId(ctx.uri);
  if (!parsed.ok) return { ok: false, reason: parsed.reason, gate: "G-URI" };

  if (!TRUSTED_DOMAINS.includes(parsed.id.trustDomain)) {
    return {
      ok: false,
      reason: `trust domain ${parsed.id.trustDomain} is not in the bundle`,
      gate: "G-DOMAIN",
    };
  }

  if (ctx.format === "oidc-sa") {
    return {
      ok: false,
      reason: "platform SA tokens MUST NOT be used beyond the platform API (WIMSE practices)",
      gate: "G-AUD",
    };
  }

  if (ctx.format === "jwt-svid") {
    return {
      ok: false,
      reason: "JWT-SVID is bearer; prod-apply requires WIT+WPT/HTTP-SIG or X.509-SVID (WIMSE WPT; Spooffe)",
      gate: "G-BEARER",
    };
  }

  if (ctx.format === "wit" && !hasPop(ctx)) {
    return {
      ok: false,
      reason: "WIT is not a bearer — require WPT or HTTP Message Signatures (WIMSE WPT / http-signature)",
      gate: "G-WPT",
    };
  }

  if (ctx.wptPresent && (ctx.wptWth === false || ctx.wptJti === "")) {
    return {
      ok: false,
      reason: "WPT missing wth (WIT hash) or jti — not request-bound",
      gate: "G-WPT",
    };
  }

  if (ctx.audience !== expectedAud) {
    return {
      ok: false,
      reason: `audience mismatch: got ${ctx.audience ?? "none"} want ${expectedAud}`,
      gate: "G-AUD",
    };
  }

  if (ctx.exp == null || ctx.exp <= now) {
    return {
      ok: false,
      reason: "SVID/WIT expired or missing exp — fail closed",
      gate: "G-EXP",
    };
  }

  const remaining = ctx.exp - now;
  const maxTtl = ctx.format === "x509-svid" ? X509_MAX_TTL_SEC : WIT_MAX_TTL_SEC;
  if (remaining > maxTtl) {
    return {
      ok: false,
      reason: `credential TTL ${remaining}s exceeds ${maxTtl}s for ${ctx.format}`,
      gate: "G-TTL",
    };
  }

  if (action === "prod-apply" && ctx.nodeIsolated !== true) {
    return {
      ok: false,
      reason: "node not isolated — node-root harvests co-located SVIDs (Spooffe)",
      gate: "G-NODE",
    };
  }

  if (!ctx.attested) {
    return {
      ok: false,
      reason: "workload unattested — no posture, no grant",
      gate: "G-ATTEST",
    };
  }

  const pop = ctx.wptPresent ? "wpt" : ctx.httpSigPresent ? "http-sig" : ctx.format === "x509-svid" ? "mTLS" : "n/a";
  return {
    ok: true,
    reason: `${parsed.id.uri}  format=${ctx.format}  pop=${pop}  aud=${ctx.audience}`,
    gate: "G-IDENTITY",
  };
}

/** Local preview fixture. Labeled. Not a live SPIRE SVID. */
export function previewFixture(now = Math.floor(Date.now() / 1000)): IdentityContext {
  return {
    principal: "workload",
    uri: PRINCIPAL_URIS.workload,
    format: "wit",
    audience: DEPLOY_AUDIENCE,
    exp: now + 300,
    wptPresent: true,
    httpSigPresent: false,
    wptJti: "fixture-jti",
    wptWth: true,
    nodeIsolated: true,
    revoked: false,
    attested: true,
    holder: "agent-runtime",
    now,
  };
}

export function chatUserContext(now = Math.floor(Date.now() / 1000)): IdentityContext {
  return {
    principal: "user",
    uri: PRINCIPAL_URIS.user,
    format: "oidc-sa",
    audience: "chat",
    exp: now + 3600,
    wptPresent: false,
    httpSigPresent: false,
    nodeIsolated: false,
    revoked: false,
    attested: false,
    holder: "human",
    now,
  };
}

/** Shared deny/allow table for CLI, TUI, and evals. */
export function demoGateCases(now = Math.floor(Date.now() / 1000)): { label: string; ctx: IdentityContext }[] {
  const base = previewFixture(now);
  return [
    { label: "WIT+WPT fixture", ctx: base },
    { label: "WIT+HTTP-SIG", ctx: { ...base, wptPresent: false, httpSigPresent: true } },
    { label: "chat user", ctx: chatUserContext(now) },
    { label: "JWT-SVID bearer", ctx: { ...base, format: "jwt-svid" } },
    { label: "LLM-held key", ctx: { ...base, holder: "llm" } },
    { label: "WIT without PoP", ctx: { ...base, wptPresent: false, httpSigPresent: false } },
    { label: "expired WIT", ctx: { ...base, exp: now - 1 } },
    { label: "revoked WIT", ctx: { ...base, revoked: true } },
    { label: "shared node (Spooffe)", ctx: { ...base, nodeIsolated: false } },
  ];
}

export function resolveIdentity(identity: boolean | IdentityContext): IdentityDecision {
  if (typeof identity === "boolean") {
    if (!identity) return { ok: false, reason: "workload identity missing", gate: "G-IDENTITY" };
    return identityGate(previewFixture());
  }
  return identityGate(identity);
}

export function formatIdentity(ctx: IdentityContext): string {
  const parsed = ctx.uri ? parseWorkloadId(ctx.uri) : null;
  const uri = parsed && parsed.ok ? parsed.id.uri : ctx.uri ?? "none";
  const pop = ctx.wptPresent ? "wpt" : ctx.httpSigPresent ? "http-sig" : "none";
  return `${ctx.principal}  ${uri}  ${ctx.format}  holder=${ctx.holder}  pop=${pop}  node=${ctx.nodeIsolated ? "isolated" : "shared"}  attested=${ctx.attested}`;
}
