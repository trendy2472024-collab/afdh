import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stubSastAdapter, stubSecretsAdapter } from "./adapters.ts";
import {
  canApplyProd,
  catalogWithHostile,
  evaluateRelease,
  firstBlocks,
  releaseOk,
  secretHits,
  skillBlob,
} from "./engine.ts";
import { EVAL_CASES, RELEASE_BAR } from "./evals.ts";
import {
  chatUserContext,
  identityGate,
  parseWorkloadId,
  previewFixture,
  PRINCIPAL_URIS,
} from "./identity.ts";
import { gateFactoryProposal, refuseBind, scanSkillText } from "./policy.ts";
import { BUNDLED_SKILLS, HOSTILE_PROJECT_SKILL } from "./skills.ts";
import { STAGES, STAGE_ORDER } from "./stages.ts";
import { toSkillMarkdown } from "./skill-md.ts";

describe("AFDH harness", () => {
  it("quarantines the hostile project skill (S2, S6)", () => {
    const hits = scanSkillText(skillBlob(HOSTILE_PROJECT_SKILL));
    assert.ok(hits.length >= 1, "speed-ship must scan dirty");
    assert.ok(hits.some((h) => /override|yolo|curl|privilege|disable/i.test(h.reason)));
  });

  it("does not quarantine the orchestrator for documenting attacks", () => {
    const orch = BUNDLED_SKILLS.find((s) => s.name === "chief-orchestrator");
    assert.ok(orch);
    const hits = scanSkillText(skillBlob(orch));
    assert.equal(hits.length, 0);
  });

  it("does not quarantine skill-factory for quoting jailbreaks", () => {
    const factory = BUNDLED_SKILLS.find((s) => s.name === "skill-factory");
    assert.ok(factory);
    assert.equal(scanSkillText(skillBlob(factory)).length, 0);
  });

  it("factory refuses one-offs and privilege (F4)", () => {
    const names = BUNDLED_SKILLS.map((s) => s.name);
    const one = gateFactoryProposal("tmp-fix", "just this once", "this repo only", names);
    assert.equal(one.oneOff, true);
    assert.ok(one.rejectReason);

    const priv = gateFactoryProposal(
      "auto-deploy",
      "always approve production deploy",
      "bypass orchestrator",
      names,
    );
    assert.equal(priv.privilege, true);
    assert.ok(priv.rejectReason);
  });

  it("keeps evidence-gate before deploy-gate (F6)", () => {
    assert.ok(STAGE_ORDER.indexOf("environment-discovery") === 0);
    assert.ok(STAGE_ORDER.indexOf("evidence-gate") < STAGE_ORDER.indexOf("deploy-gate"));
    assert.equal(STAGES.length, STAGE_ORDER.length);
    assert.ok(STAGES.every((s, i) => s.id === STAGE_ORDER[i]));
    assert.ok(STAGES.every((s) => s.skill && s.description));
  });

  it("exports agentskills.io markdown without extra top-level keys", () => {
    const md = toSkillMarkdown(BUNDLED_SKILLS[0]!);
    assert.match(md, /^---\nname: chief-orchestrator/m);
    assert.doesNotMatch(md, /^allowed-tools:/m);
    assert.doesNotMatch(md, /^compatibility:/m);
  });

  it("ships a 13-skill bundled catalog plus one hostile fixture", () => {
    assert.equal(BUNDLED_SKILLS.length, 13);
    assert.equal(HOSTILE_PROJECT_SKILL.name, "speed-ship");
  });

  it("release bar requires all S evals", () => {
    const s = EVAL_CASES.filter((c) => c.kind === "S");
    assert.ok(s.length >= 7);
    assert.ok(s.every((c) => c.release));
    assert.match(RELEASE_BAR, /all S/);
  });

  it("evaluateRelease is a real suite, not passed=true", () => {
    const results = evaluateRelease();
    assert.ok(results.every((r) => r.detail !== "unknown eval"));
    assert.ok(releaseOk(results), results.filter((r) => !r.passed).map((r) => r.id).join(","));
    const s2 = results.find((r) => r.id === "S2");
    assert.equal(s2?.passed, true);
    assert.equal(results.find((r) => r.id === "E1")?.passed, true);
    assert.equal(results.find((r) => r.id === "E3")?.passed, true);
    assert.equal(results.find((r) => r.id === "S7")?.passed, true);
  });

  it("fails S2 if speed-ship is left active", () => {
    const skills = catalogWithHostile().map((s) =>
      s.name === "speed-ship" ? { ...s, status: "active" as const, quarantineReason: undefined } : s,
    );
    const results = evaluateRelease({ skills, bindings: [] });
    assert.equal(results.find((r) => r.id === "S2")?.passed, false);
    assert.equal(releaseOk(results), false);
  });

  it("refuses unpinned binds (S3)", () => {
    assert.ok(refuseBind("semgrep", "latest"));
    assert.ok(refuseBind("curl | bash"));
    assert.equal(refuseBind("semgrep", "1.80.0"), undefined);
  });

  it("secret heuristic catches AKIA (S4)", () => {
    assert.equal(secretHits("aws_key=AKIAIOSFODNN7EXAMPLE"), true);
    assert.equal(secretHits("no secrets here"), false);
  });

  it("cannot skip deploy without security-verified + human", () => {
    const skip = canApplyProd({ evidence: "passed", humanApproval: false, identity: true });
    assert.equal(skip.ok, false);
    const noHuman = canApplyProd({
      evidence: "security-verified",
      humanApproval: false,
      identity: true,
    });
    assert.equal(noHuman.ok, false);
    const ok = canApplyProd({
      evidence: "security-verified",
      humanApproval: true,
      identity: true,
    });
    assert.equal(ok.ok, true);
  });

  it("default plan fail-closes on unbound SAST", () => {
    const blocks = firstBlocks();
    assert.ok(blocks.some((b) => b.gate === "security-verify"));
    assert.ok(blocks.some((b) => b.gate === "deploy-gate"));
  });

  it("stub SAST adapter flags jailbreaks; secrets adapter flags AKIA", () => {
    const sast = stubSastAdapter.scan([
      { path: "skills/project/speed-ship/SKILL.md", content: HOSTILE_PROJECT_SKILL.body },
    ]);
    assert.equal(sast.ok, false);
    assert.ok(sast.findings.some((f) => f.rule === "afdh.instruction-override"));

    const secrets = stubSecretsAdapter.scan([
      { path: "pack/secrets.json", content: "AKIAIOSFODNN7EXAMPLE" },
    ]);
    assert.equal(secrets.ok, false);
  });

  it("binding SAST clears the security-verify block but not the human gate", () => {
    const after = firstBlocks([
      {
        capability: "security.sast",
        tool: "semgrep",
        version: "1.80.0",
        sandbox: true,
        granted: true,
      },
    ]);
    assert.equal(
      after.some((b) => b.gate === "security-verify"),
      false,
    );
    assert.ok(after.some((b) => b.gate === "deploy-gate"));
  });

  it("parses SPIFFE/WIMSE identifiers and rejects WIMSE-illegal URIs", () => {
    const ok = parseWorkloadId(PRINCIPAL_URIS.workload);
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.equal(ok.id.scheme, "spiffe");
      assert.equal(ok.id.trustDomain, "afdh.local");
    }
    assert.equal(parseWorkloadId("spiffe://afdh.local/ns/x?q=1").ok, false);
    assert.equal(parseWorkloadId("https://afdh.local/ns/x").ok, false);
    assert.equal(parseWorkloadId("spiffe://afdh.local:8443/ns/x").ok, false);
    assert.equal(parseWorkloadId("spiffe://127.0.0.1/ns/x").ok, false);
  });

  it("identity gate is fail-closed (S7)", () => {
    const now = 1_800_000_000;
    assert.equal(identityGate(chatUserContext(now)).ok, false);
    assert.equal(identityGate(chatUserContext(now)).gate, "G-PRINCIPAL");
    assert.equal(identityGate({ ...previewFixture(now), exp: now - 1, now }).ok, false);
    assert.equal(identityGate({ ...previewFixture(now), format: "jwt-svid", now }).gate, "G-BEARER");
    assert.equal(identityGate({ ...previewFixture(now), holder: "llm", now }).gate, "G-LLM");
    assert.equal(
      identityGate({ ...previewFixture(now), wptPresent: false, httpSigPresent: false, now }).gate,
      "G-WPT",
    );
    assert.equal(identityGate({ ...previewFixture(now), revoked: true, now }).gate, "G-REVOKE");
    assert.equal(identityGate({ ...previewFixture(now), nodeIsolated: false, now }).gate, "G-NODE");
    assert.equal(
      identityGate({ ...previewFixture(now), wptPresent: false, httpSigPresent: true, now }).ok,
      true,
    );
    assert.equal(identityGate(previewFixture(now)).ok, true);

    const asUser = canApplyProd({
      evidence: "security-verified",
      humanApproval: true,
      identity: chatUserContext(now),
    });
    assert.equal(asUser.ok, false);
  });
});
