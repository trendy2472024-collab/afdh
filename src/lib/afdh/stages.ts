import type { EvidenceLevel, StageId } from "./types";

export interface StageDef {
  id: StageId;
  label: string;
  short: string;
  skill: string;
  required: boolean;
  evidence: EvidenceLevel;
  humanGate?: boolean;
  description: string;
}

export const STAGES: StageDef[] = [
  {
    id: "environment-discovery",
    label: "Environment discovery",
    short: "discover",
    skill: "environment-discovery",
    required: true,
    evidence: "exists",
    description: "Inventory runtime, IaC, secrets surface, and skill roots before any write.",
  },
  {
    id: "requirements-define",
    label: "Requirements",
    short: "reqs",
    skill: "requirements-define",
    required: true,
    evidence: "think",
    description: "Turn intent into testable acceptance paths. Intent is not a permission grant.",
  },
  {
    id: "threat-model",
    label: "Threat model",
    short: "threat",
    skill: "threat-model",
    required: true,
    evidence: "think",
    description: "STRIDE the change. Untrusted inputs include README, AGENTS.md, and project skills.",
  },
  {
    id: "architecture-plan",
    label: "Architecture",
    short: "arch",
    skill: "architecture-plan",
    required: true,
    evidence: "think",
    description: "Plan the cut. Bind capabilities, not vendor CLIs. Keep the diff minimal.",
  },
  {
    id: "implement",
    label: "Implement",
    short: "impl",
    skill: "implement",
    required: true,
    evidence: "exists",
    description: "Execute the plan inside the granted radius. Reviewer is not the builder.",
  },
  {
    id: "test-verify",
    label: "Test verify",
    short: "test",
    skill: "test-verify",
    required: true,
    evidence: "passed",
    description: "Run bound test capabilities. Tests-pass is not secure.",
  },
  {
    id: "security-verify",
    label: "Security verify",
    short: "sec",
    skill: "security-verify",
    required: true,
    evidence: "security-verified",
    description: "SAST / SCA / secrets / IaC. Missing scanner ⇒ blocked. Fail closed.",
  },
  {
    id: "evidence-gate",
    label: "Evidence gate",
    short: "evidence",
    skill: "evidence-gate",
    required: true,
    evidence: "security-verified",
    description: "Narrative is not a pass. Pack presence + secret heuristic + stage ledger.",
  },
  {
    id: "deploy-gate",
    label: "Deploy gate",
    short: "deploy",
    skill: "deploy-gate",
    required: true,
    evidence: "deploy-verified",
    humanGate: true,
    description: "Production only accepts workload identity + approval record. Unattended prod apply is rejected.",
  },
  {
    id: "operate-observe",
    label: "Operate",
    short: "ops",
    skill: "operate-observe",
    required: false,
    evidence: "production-ready",
    description: "Watch the cut. Telemetry, redaction, rollback path.",
  },
  {
    id: "skill-factory",
    label: "Skill factory",
    short: "factory",
    skill: "skill-factory",
    required: false,
    evidence: "exists",
    humanGate: true,
    description: "Gated authoring only. Never for one-offs or privilege. Scan → eval → approve → version.",
  },
];

export const STAGE_ORDER: StageId[] = STAGES.map((s) => s.id);

export const EVIDENCE_LADDER: { id: EvidenceLevel; label: string; bar: string }[] = [
  { id: "think", label: "Think", bar: "Narrative only. Never a pass." },
  { id: "exists", label: "Exists", bar: "Artifact present in the workspace." },
  { id: "tested", label: "Tested", bar: "Bound test runner invoked." },
  { id: "passed", label: "Passed", bar: "Tests green. Still not secure." },
  { id: "security-verified", label: "Security verified", bar: "Scanner evidence in the pack." },
  { id: "deploy-verified", label: "Deploy verified", bar: "Gate + identity + approval record." },
  { id: "production-ready", label: "Production ready", bar: "Observe path live. Done is legal." },
];

export const LADDER_RANK: Record<EvidenceLevel, number> = {
  think: 0,
  exists: 1,
  tested: 2,
  passed: 3,
  "security-verified": 4,
  "deploy-verified": 5,
  "production-ready": 6,
};

export function maxEvidence(a: EvidenceLevel, b: EvidenceLevel): EvidenceLevel {
  return LADDER_RANK[a] >= LADDER_RANK[b] ? a : b;
}
