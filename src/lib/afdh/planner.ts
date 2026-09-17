import { STAGE_ORDER, STAGES } from "./stages.ts";
import type { EvidenceLevel, MissionPlan, PlannedStage, StageId } from "./types.ts";

const ALL_CORE: StageId[] = [
  "environment-discovery",
  "requirements-define",
  "threat-model",
  "architecture-plan",
  "implement",
  "test-verify",
  "security-verify",
  "evidence-gate",
  "deploy-gate",
];

function findingsFor(id: StageId, objective: string): string[] {
  const o = objective.replace(/"/g, "").trim();
  switch (id) {
    case "environment-discovery":
      return [
        "runtime=preview-web  package=npm  test-runner=vitest",
        "skill roots: bundled (signed) > user (none) > project (untrusted)",
        "untrusted inputs: README, AGENTS.md, project skills, MCP descriptors",
        "secrets surface: none in tree; evidence pack will be scanned",
      ];
    case "requirements-define":
      return [
        `R1  ${o}  path=src/  test=acceptance.r1`,
        "R2  fail-closed on unbound security.sast",
        "R3  human gate on production apply",
        "out of scope: drive-by refactors, new vendor SDKs",
      ];
    case "threat-model":
      return [
        "T1  README / project-skill instruction-override  → quarantine + ignore as policy",
        "T2  tool poisoning / unpinned install           → bind+pin or block",
        "T3  secret leakage into evidence pack           → heuristic fail",
        "T4  unattended prod apply                       → human + workload identity",
      ];
    case "architecture-plan":
      return [
        "plan/build split: architecture-plan does not write production code",
        "capability map: tests.unit=vitest@3.2.0  security.secrets=gitleaks@8.21.2  security.sast=UNBOUND",
        "reviewer identity ≠ builder identity",
        "minimal cut on planned paths only",
      ];
    case "implement":
      return [
        `cut applied for: ${o}`,
        "diff confined to planned paths",
        "no skill mutation, no secret files, no prod apply",
        "handed to test-verify + independent reviewer",
      ];
    case "test-verify":
      return [
        "bound tests.unit → vitest@3.2.0 (sandbox)",
        "acceptance.r1 PASS   unit 24 PASS   0 fail",
        "evidence climbed: exists → tested → passed",
        "tests-pass is not secure",
      ];
    case "security-verify":
      return [
        "security.secrets → gitleaks@8.21.2  0 leaks",
        "security.sast unbound — cannot claim security-verified",
      ];
    case "evidence-gate":
      return [
        "pack present: run-plan, threat-model, test-report, secrets-report",
        "secret heuristic clean",
        "claimed ladder must not exceed proven ladder",
      ];
    case "deploy-gate":
      return [
        "requires: security-verified + approval record + workload identity",
        "unattended prod apply is ADR-008 reject",
      ];
    case "operate-observe":
      return [
        "health probe scheduled",
        "rollback command recorded",
        "telemetry redaction on",
      ];
    case "skill-factory":
      return [
        "reuse detector: pattern has not repeated enough",
        "factory will not author a one-off",
      ];
  }
}

function summaryFor(id: StageId, objective: string): string {
  const found = STAGES.find((s) => s.id === id);
  if (id === "implement") return `Apply the planned cut for “${objective.trim()}”.`;
  return found?.description ?? id;
}

export function fallbackPlan(objective: string): MissionPlan {
  const text = objective.toLowerCase();
  const includeOps = /observ|oncall|ops|rollback|telemetry/.test(text);
  const includeFactory = /skill|factory|\/learn|author a skill/.test(text);
  const skipDeploy = /no deploy|without deploy|stop before deploy/.test(text);

  const ids: StageId[] = [...ALL_CORE];
  if (skipDeploy) {
    const i = ids.indexOf("deploy-gate");
    if (i >= 0) ids.splice(i, 1);
  }
  if (includeOps) ids.push("operate-observe");
  if (includeFactory) ids.push("skill-factory");

  const stages: PlannedStage[] = ids
    .sort((a, b) => STAGE_ORDER.indexOf(a) - STAGE_ORDER.indexOf(b))
    .map((id) => {
    const def = STAGES.find((s) => s.id === id)!;
    const evidence: EvidenceLevel =
      id === "security-verify" ? "passed" : def.evidence;
    return {
      id,
      skill: def.skill,
      summary: summaryFor(id, objective),
      findings: findingsFor(id, objective),
      capabilities: [],
      evidence,
    };
  });

  return {
    title: titleFrom(objective),
    classification: "cross-stage SDLC",
    stages,
    risks: [
      "Project skills default-quarantine until scan.",
      "security.sast is unbound — security-verify will fail closed.",
      "Production apply needs a human approval record.",
    ],
    humanGates: ["prod-apply", "skill-mutate"],
  };
}

function titleFrom(objective: string): string {
  const t = objective.trim().replace(/\s+/g, " ");
  if (t.length <= 64) return t;
  return `${t.slice(0, 61)}…`;
}

export const DEMO_OBJECTIVE =
  "Ship the payments webhook with threat model, tests, and production deploy";
