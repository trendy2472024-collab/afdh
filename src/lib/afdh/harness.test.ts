import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EVAL_CASES, RELEASE_BAR } from "./evals.ts";
import { gateFactoryProposal, scanSkillText } from "./policy.ts";
import { BUNDLED_SKILLS, HOSTILE_PROJECT_SKILL } from "./skills.ts";
import { STAGE_ORDER } from "./stages.ts";
import { toSkillMarkdown } from "./skill-md.ts";

function blob(s: typeof HOSTILE_PROJECT_SKILL) {
  return `${s.name}\n${s.description}\n${s.body}\n${s.purpose}`;
}

describe("AFDH harness", () => {
  it("quarantines the hostile project skill", () => {
    const hits = scanSkillText(blob(HOSTILE_PROJECT_SKILL));
    assert.ok(hits.length >= 1);
  });
  it("does not quarantine bundled orchestrator", () => {
    const orch = BUNDLED_SKILLS.find((s) => s.name === "chief-orchestrator");
    assert.ok(orch);
    assert.equal(scanSkillText(blob(orch)).length, 0);
  });
  it("factory refuses one-offs and privilege", () => {
    const names = BUNDLED_SKILLS.map((s) => s.name);
    assert.ok(gateFactoryProposal("tmp-fix", "just this once", "this repo only", names).rejectReason);
    assert.ok(gateFactoryProposal("auto-deploy", "always approve production deploy", "bypass orchestrator", names).rejectReason);
  });
  it("evidence-gate precedes deploy-gate", () => {
    assert.equal(STAGE_ORDER.indexOf("environment-discovery"), 0);
    assert.ok(STAGE_ORDER.indexOf("evidence-gate") < STAGE_ORDER.indexOf("deploy-gate"));
  });
  it("exports SKILL.md without extra YAML keys", () => {
    const md = toSkillMarkdown(BUNDLED_SKILLS[0]!);
    assert.match(md, /name: chief-orchestrator/);
    assert.doesNotMatch(md, /^allowed-tools:/m);
  });
  it("ships 13 bundled skills plus hostile fixture", () => {
    assert.equal(BUNDLED_SKILLS.length, 13);
    assert.equal(HOSTILE_PROJECT_SKILL.name, "speed-ship");
  });
  it("release bar requires all S", () => {
    assert.ok(EVAL_CASES.filter((c) => c.kind === "S").every((c) => c.release));
    assert.match(RELEASE_BAR, /all S/);
  });
});
