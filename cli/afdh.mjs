#!/usr/bin/env node
/**
 * AFDH — Agentic Framework DevSecOps Harness
 * Headless control plane. Same kernel as the TUI.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const self = fileURLToPath(import.meta.url);
if (!process.execArgv.includes("--experimental-strip-types")) {
  const r = spawnSync(
    process.execPath,
    ["--experimental-strip-types", self, ...process.argv.slice(2)],
    { stdio: "inherit", env: process.env },
  );
  process.exit(r.status ?? 1);
}

const { BUNDLED_SKILLS, HOSTILE_PROJECT_SKILL, SKILL_INSTALL_TARGETS } = await import(
  "../src/lib/afdh/skills.ts"
);
const { scanSkillText, gateFactoryProposal, refuseBind, DEFAULT_BINDINGS } = await import(
  "../src/lib/afdh/policy.ts"
);
const { RELEASE_BAR } = await import("../src/lib/afdh/evals.ts");
const { toSkillMarkdown } = await import("../src/lib/afdh/skill-md.ts");
const { evaluateRelease, releaseOk, firstBlocks, planObjective, formatPlan, canApplyProd, VERSION, LICENSE, REPO, skillBlob } =
  await import("../src/lib/afdh/engine.ts");
const { mkdir, writeFile } = await import("node:fs/promises");
const { join } = await import("node:path");

const cmd = (process.argv[2] ?? "help").toLowerCase();
const args = process.argv.slice(3);

function log(kind, msg) {
  const tag = kind.padEnd(7);
  process.stdout.write(`${tag}  ${msg}\n`);
}

async function main() {
  switch (cmd) {
    case "help":
    case "--help":
    case "-h":
      process.stdout.write(`AFDH ${VERSION} — a control plane, not a bigger prompt.

Usage:
  afdh catalog              list portable skills
  afdh scan                 quarantine scan (project skills default-deny)
  afdh eval                 F/S/E suite (release bar: all S; F1–F3; E2)
  afdh plan [objective]     SDLC plan; intent is not a grant
  afdh prove                show fail-closed gates without running agents
  afdh export [dir]         write SKILL.md tree (agentskills.io)
  afdh factory <name> <why> gated skill proposal
  afdh version

${REPO}
Same kernel as the TUI. Fail closed. Intent is not a grant.
`);
      return;
    case "version":
    case "--version":
    case "-v":
      log("ok", `AFDH ${VERSION}  ${LICENSE}`);
      log("system", REPO);
      return;
    case "catalog":
      log("catalog", `${BUNDLED_SKILLS.length} bundled  disclosure=name→body→files`);
      for (const s of BUNDLED_SKILLS) {
        log("skill", `${s.name.padEnd(24)} ${(s.capabilities[0] ?? "")}`);
      }
      log("system", `install targets: ${SKILL_INSTALL_TARGETS.map((t) => t.runtime).join(" · ")}`);
      return;
    case "scan": {
      const hits = scanSkillText(skillBlob(HOSTILE_PROJECT_SKILL));
      log("catalog", "scan  project > user > bundled");
      if (hits.length) {
        log("error", `QUARANTINE  speed-ship  ${hits[0].reason}`);
      }
      let dirty = 0;
      for (const s of BUNDLED_SKILLS) {
        const h = scanSkillText(skillBlob(s));
        if (h.length) {
          dirty += 1;
          log("error", `${s.name}  ${h[0].reason}`);
        }
      }
      log(dirty ? "error" : "ok", `bundled dirty=${dirty}  hostile=${hits.length ? "quarantined" : "missed"}`);
      if (!hits.length) process.exitCode = 2;
      return;
    }
    case "eval": {
      const results = evaluateRelease();
      for (const r of results) {
        log(r.passed ? "ok" : "error", `${r.id.padEnd(4)} ${r.kind}  ${r.title}  ${r.detail}`);
      }
      log("ok", RELEASE_BAR);
      if (!releaseOk(results)) process.exitCode = 1;
      return;
    }
    case "plan": {
      const objective = args.join(" ") || "Ship the payments webhook with tests and production deploy";
      const plan = planObjective(objective);
      log("parser", `intent  “${objective}”`);
      log("parser", "intent is not a permission grant");
      log("ok", formatPlan(plan));
      for (const b of firstBlocks()) {
        log("error", `${b.gate}  ${b.reason}`);
      }
      log("system", "fail closed. bind a pinned scanner, then a human on prod-apply.");
      return;
    }
    case "prove": {
      const results = evaluateRelease();
      const sFail = results.filter((r) => r.kind === "S" && !r.passed);
      log("prove", "kernel — not a story");
      for (const b of firstBlocks(DEFAULT_BINDINGS)) {
        log("error", `${b.gate}  ${b.reason}`);
      }
      const skip = canApplyProd({ evidence: "passed", humanApproval: false, identity: true });
      log(skip.ok ? "error" : "ok", `skip-deploy  ${skip.reason}`);
      const latest = refuseBind("semgrep", "latest");
      log(latest ? "ok" : "error", `pin  ${latest ?? "latest was accepted"}`);
      log(sFail.length ? "error" : "ok", `S-suite  ${results.filter((r) => r.kind === "S" && r.passed).length}/${results.filter((r) => r.kind === "S").length}`);
      if (!releaseOk(results) || skip.ok || !latest) process.exitCode = 1;
      return;
    }
    case "export": {
      const dir = args[0] ?? "skills";
      for (const s of BUNDLED_SKILLS) {
        const dest = join(dir, "bundled", s.name);
        await mkdir(dest, { recursive: true });
        await writeFile(join(dest, "SKILL.md"), toSkillMarkdown(s));
      }
      const q = join(dir, "project", "speed-ship");
      await mkdir(q, { recursive: true });
      await writeFile(join(q, "SKILL.md"), toSkillMarkdown(HOSTILE_PROJECT_SKILL));
      log("ok", `wrote ${BUNDLED_SKILLS.length + 1} skills → ${dir}/`);
      return;
    }
    case "factory": {
      const name = args[0];
      const why = args.slice(1).join(" ");
      if (!name) {
        log("error", "usage: afdh factory <name> <reason>");
        process.exitCode = 2;
        return;
      }
      const r = gateFactoryProposal(
        name,
        `Specialist for ${name}`,
        why || "repeated pattern",
        BUNDLED_SKILLS.map((s) => s.name),
      );
      if (r.rejectReason) {
        log("error", `${name}  ${r.rejectReason}`);
        process.exitCode = 1;
        return;
      }
      log("factory", `contract ${name}  overlap=[${r.overlap.join(",") || "none"}]  awaiting human`);
      return;
    }
    default:
      log("error", `unknown command “${cmd}”. try afdh help`);
      process.exitCode = 2;
  }
}

await main();
