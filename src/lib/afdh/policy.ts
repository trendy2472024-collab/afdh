import type { CapabilityBinding } from "./types";

export const IDENTITIES = [
  { id: "user", label: "User", trust: "intent only — never a grant" },
  { id: "orchestrator", label: "Orchestrator", trust: "control plane, allowlisted skills" },
  { id: "specialist", label: "Specialist", trust: "per-agent skill + tool allowlist" },
  { id: "reviewer", label: "Reviewer", trust: "read + evidence, never builder tools" },
  { id: "factory", label: "Factory", trust: "skills.write only with human approve" },
  { id: "workload", label: "Workload", trust: "prod apply identity — not the chat user" },
] as const;

export const RADIUS = [
  { id: "read-repo", default: "allow", note: "Sandbox read of classified files" },
  { id: "write-repo", default: "ask", note: "Planned paths only" },
  { id: "exec-sandbox", default: "ask", note: "Bound runners, no curl|sh" },
  { id: "skill-mutate", default: "deny", note: "Human gate + factory pipeline" },
  { id: "secrets-read", default: "deny", note: "Human gate" },
  { id: "prod-apply", default: "deny", note: "Human gate + workload identity" },
] as const;

export const DEFAULT_BINDINGS: CapabilityBinding[] = [
  { capability: "filesystem.read", tool: "sandbox-fs", version: "1.0.0", sandbox: true, granted: true },
  { capability: "filesystem.write", tool: "sandbox-fs", version: "1.0.0", sandbox: true, granted: true },
  { capability: "catalog.read", tool: "afdh-catalog", version: "0.1.0", sandbox: true, granted: true },
  { capability: "policy.enforce", tool: "afdh-policy", version: "0.1.0", sandbox: true, granted: true },
  { capability: "ledger.read", tool: "afdh-ledger", version: "0.1.0", sandbox: true, granted: true },
  { capability: "ledger.write", tool: "afdh-ledger", version: "0.1.0", sandbox: true, granted: true },
  { capability: "evidence.validate", tool: "afdh-evidence", version: "0.1.0", sandbox: true, granted: true },
  { capability: "tests.unit", tool: "vitest", version: "3.2.0", sandbox: true, granted: true },
  { capability: "tests.integration", tool: "vitest", version: "3.2.0", sandbox: true, granted: true },
  { capability: "security.secrets", tool: "gitleaks", version: "8.21.2", sandbox: true, granted: true },
  { capability: "security.sast", tool: null, version: null, sandbox: true, granted: false },
  { capability: "security.sca", tool: null, version: null, sandbox: true, granted: false },
  { capability: "security.iac", tool: null, version: null, sandbox: true, granted: false },
  { capability: "deploy.prod", tool: "afdh-deploy", version: "0.1.0", sandbox: false, granted: false },
  { capability: "skills.write", tool: "afdh-factory", version: "0.1.0", sandbox: true, granted: false },
  { capability: "telemetry.read", tool: "afdh-otel", version: "0.1.0", sandbox: true, granted: true },
  { capability: "deploy.rollback", tool: "afdh-deploy", version: "0.1.0", sandbox: false, granted: false },
  { capability: "subagent.delegate", tool: "afdh-delegate", version: "0.1.0", sandbox: true, granted: true },
  { capability: "process.exec", tool: "sandbox-exec", version: "1.0.0", sandbox: true, granted: true },
];

export const QUARANTINE_PATTERNS: { id: string; re: RegExp; reason: string }[] = [
  {
    id: "instruction-override",
    re: /ignore\s+(previous|all)\s+instructions/i,
    reason: "Imperative instruction-override (jailbreak persistence)",
  },
  {
    id: "yolo-deploy",
    re: /always\s+approve\s+(production\s+)?deploy/i,
    reason: "Privilege: forced production approve",
  },
  {
    id: "disable-policy",
    re: /disable\s+policy|yolo\s+mode/i,
    reason: "Attempts to disable the control plane",
  },
  {
    id: "unpinned-curl",
    re: /curl[^\n]*\|\s*(ba)?sh/i,
    reason: "Unpinned pipe-to-shell install",
  },
];

export function scanSkillText(text: string): { id: string; reason: string }[] {
  const documented = text
    .replace(/do\s+not\s+[^\n]*/gi, "")
    .replace(/["'`][^"'`]{0,120}["'`]/g, "");
  return QUARANTINE_PATTERNS.filter((p) => p.re.test(documented)).map((p) => ({
    id: p.id,
    reason: p.reason,
  }));
}

export function gateFactoryProposal(
  name: string,
  description: string,
  reason: string,
  existing: string[],
): { overlap: string[]; oneOff: boolean; privilege: boolean; rejectReason?: string } {
  const blob = `${name} ${description} ${reason}`;
  const overlap = existing.filter(
    (n) =>
      n === name ||
      description.toLowerCase().includes(n.toLowerCase()) ||
      name.toLowerCase().includes(n.split("-")[0] ?? ""),
  );
  const oneOff = /once|one-off|one off|this repo only/i.test(blob);
  const privilege =
    scanSkillText(blob).length > 0 ||
    /always approve|bypass|ignore orchestrator|privilege/i.test(blob);
  const rejectReason = privilege
    ? "Refuse: privilege / instruction-override / YOLO deploy"
    : oneOff
      ? "Refuse: factory never authors one-offs"
      : undefined;
  return { overlap, oneOff, privilege, rejectReason };
}

export function refuseBind(tool: string, version?: string | null): string | undefined {
  const t = tool.trim();
  if (!t) return "empty tool name";
  if (/curl|\|\s*(ba)?sh/i.test(t)) return "unpinned / pipe-to-shell bind refused (S3/S6)";
  if (version === "latest" || /@latest$/i.test(t)) return "unpinned bind refused — pin a version (S3)";
  return undefined;
}

export const ADRS = [
  { id: "001", decision: "Control plane + specialists", rejected: "Mega-prompt" },
  { id: "002", decision: "agentskills.io core + adapters", rejected: "Hermes-only / Claude-only" },
  { id: "003", decision: "Capability map", rejected: "Hard-coded semgrep in every skill" },
  { id: "004", decision: "Evidence contracts", rejected: "Looks good / tests-pass = secure" },
  { id: "005", decision: "Repo and skills untrusted", rejected: "Auto-trust project instructions" },
  { id: "006", decision: "Gated skill factory", rejected: "Free /learn writes" },
  { id: "007", decision: "Reviewer ≠ builder", rejected: "Same-turn self-review" },
  { id: "008", decision: "Human gates on prod/secrets/IAM/skill mutate", rejected: "Unattended prod apply" },
  { id: "009", decision: "Fail closed", rejected: "Best-effort pass" },
  { id: "010", decision: "Per-agent allowlists", rejected: "Every agent sees every skill" },
] as const;
