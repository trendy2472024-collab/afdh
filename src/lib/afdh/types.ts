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
export type EvidenceLevel =
  | "think" | "exists" | "tested" | "passed"
  | "security-verified" | "deploy-verified" | "production-ready";
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
