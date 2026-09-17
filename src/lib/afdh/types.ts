export type SkillScope = "bundled" | "user" | "project";
export type SkillStatus = "active" | "quarantined" | "draft";

export type StageId =
  | "environment-discovery"
  | "requirements-define"
  | "threat-model"
  | "architecture-plan"
  | "implement"
  | "test-verify"
  | "security-verify"
  | "evidence-gate"
  | "deploy-gate"
  | "operate-observe"
  | "skill-factory";

export type StageStatus =
  | "pending"
  | "running"
  | "passed"
  | "blocked"
  | "skipped"
  | "failed";

export type EvidenceLevel =
  | "think"
  | "exists"
  | "tested"
  | "passed"
  | "security-verified"
  | "deploy-verified"
  | "production-ready";

export type LogKind =
  | "system"
  | "parser"
  | "catalog"
  | "router"
  | "policy"
  | "skill"
  | "evidence"
  | "gate"
  | "factory"
  | "error"
  | "ok"
  | "cmd";

export type MissionStatus =
  | "idle"
  | "running"
  | "blocked"
  | "passed"
  | "aborted"
  | "failed";

export type ViewId =
  | "mission"
  | "skills"
  | "policy"
  | "evidence"
  | "factory"
  | "catalog"
  | "ledger"
  | "evals"
  | "docs";

export interface Skill {
  name: string;
  description: string;
  purpose: string;
  triggers: string[];
  antiTriggers: string[];
  inputs: string[];
  outputs: string[];
  capabilities: string[];
  security: string[];
  verification: string[];
  body: string;
  scope: SkillScope;
  status: SkillStatus;
  quarantineReason?: string;
}

export interface CapabilityBinding {
  capability: string;
  tool: string | null;
  version: string | null;
  sandbox: boolean;
  granted: boolean;
}

export interface LogLine {
  id: string;
  ts: number;
  kind: LogKind;
  source: string;
  text: string;
}

export interface StageRun {
  id: StageId;
  skill: string;
  status: StageStatus;
  summary?: string;
  findings: string[];
  capabilities: string[];
  evidenceClaim?: EvidenceLevel;
  blockedReason?: string;
  startedAt?: number;
  endedAt?: number;
}

export interface Mission {
  id: string;
  objective: string;
  title: string;
  status: MissionStatus;
  stages: StageRun[];
  evidence: EvidenceLevel;
  createdAt: number;
  updatedAt: number;
  humanApproval: boolean;
  aiPlanned: boolean;
  blockedReason?: string;
}

export interface FactoryProposal {
  id: string;
  name: string;
  description: string;
  reason: string;
  overlap: string[];
  oneOff: boolean;
  privilege: boolean;
  status:
    | "contract"
    | "scanning"
    | "eval"
    | "awaiting-approval"
    | "approved"
    | "rejected";
  rejectReason?: string;
  createdAt: number;
}

export interface EvalResult {
  id: string;
  kind: "F" | "S" | "E";
  title: string;
  passed: boolean;
  detail: string;
}

export interface PlannedStage {
  id: StageId;
  skill: string;
  summary: string;
  findings: string[];
  capabilities: string[];
  evidence: EvidenceLevel;
  skip?: boolean;
}

export interface MissionPlan {
  title: string;
  classification: string;
  stages: PlannedStage[];
  risks: string[];
  humanGates: string[];
}
