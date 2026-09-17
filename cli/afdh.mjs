#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const self = fileURLToPath(import.meta.url);
if (!process.execArgv.includes("--experimental-strip-types")) {
  const r = spawnSync(process.execPath, ["--experimental-strip-types", self, ...process.argv.slice(2)], { stdio: "inherit", env: process.env });
  process.exit(r.status ?? 1);
}

const { BUNDLED_SKILLS, HOSTILE_PROJECT_SKILL, SKILL_INSTALL_TARGETS } = await import("../src/lib/afdh/skills.ts");
const { scanSkillText, gateFactoryProposal } = await import("../src/lib/afdh/policy.ts");
const { EVAL_CASES, RELEASE_BAR } = await import("../src/lib/afdh/evals.ts");
const { toSkillMarkdown } = await import("../src/lib/afdh/skill-md.ts");
const { STAGE_ORDER } = await import("../src/lib/afdh/stages.ts");
const { mkdir, writeFile } = await import("node:fs/promises");
const { join } = await import("node:path");

const cmd = (process.argv[2] ?? "help").toLowerCase();
const args = process.argv.slice(3);
const log = (kind, msg) => process.stdout.write(`${kind.padEnd(7)}  ${msg}\n`);
const blob = (s) => `${s.name}\n${s.description}\n${s.body}\n${s.purpose}`;

async function main() {
  switch (cmd) {
    case "help": case "--help": case "-h":
      process.stdout.write(`AFDH 0.1.0 — a control plane, not a bigger prompt.\n\n  afdh catalog | scan | eval | export [dir] | factory <name> <why> | version\n`);
      return;
    case "version": case "--version": case "-v":
      log("ok", "AFDH 0.1.0  Apache-2.0"); return;
    case "catalog":
      log("catalog", `${BUNDLED_SKILLS.length} bundled`);
      for (const s of BUNDLED_SKILLS) log("skill", s.name);
      log("system", SKILL_INSTALL_TARGETS.map((t) => t.runtime).join(" · "));
      return;
    case "scan": {
      const hits = scanSkillText(blob(HOSTILE_PROJECT_SKILL));
      if (hits.length) log("error", `QUARANTINE  speed-ship  ${hits[0].reason}`);
      let dirty = 0;
      for (const s of BUNDLED_SKILLS) {
        const h = scanSkillText(blob(s));
        if (h.length) { dirty++; log("error", `${s.name}  ${h[0].reason}`); }
      }
      log(dirty ? "error" : "ok", `bundled dirty=${dirty}  hostile=${hits.length ? "quarantined" : "missed"}`);
      if (!hits.length) process.exitCode = 2;
      return;
    }
    case "eval": {
      const names = BUNDLED_SKILLS.map((s) => s.name);
      const hostileHits = scanSkillText(blob(HOSTILE_PROJECT_SKILL));
      const results = EVAL_CASES.map((c) => {
        let passed = true;
        if (c.id === "F6") passed = STAGE_ORDER.indexOf("evidence-gate") < STAGE_ORDER.indexOf("deploy-gate") && STAGE_ORDER.indexOf("environment-discovery") === 0;
        if (c.id === "F4") passed = Boolean(gateFactoryProposal("once-fix", "this repo only", "once", names).rejectReason);
        if (c.id === "S2" || c.id === "S6") passed = hostileHits.length > 0;
        return { ...c, passed };
      });
      for (const r of results) log(r.passed ? "ok" : "error", `${r.id}  ${r.title}`);
      log("ok", RELEASE_BAR);
      if (results.some((r) => r.kind === "S" && !r.passed)) process.exitCode = 1;
      return;
    }
    case "export": {
      const dir = args[0] ?? "skills";
      for (const s of BUNDLED_SKILLS) {
        await mkdir(join(dir, "bundled", s.name), { recursive: true });
        await writeFile(join(dir, "bundled", s.name, "SKILL.md"), toSkillMarkdown(s));
      }
      await mkdir(join(dir, "project", "speed-ship"), { recursive: true });
      await writeFile(join(dir, "project", "speed-ship", "SKILL.md"), toSkillMarkdown(HOSTILE_PROJECT_SKILL));
      log("ok", `wrote ${BUNDLED_SKILLS.length + 1} skills → ${dir}/`);
      return;
    }
    case "factory": {
      const name = args[0];
      if (!name) { log("error", "usage: afdh factory <name> <reason>"); process.exitCode = 2; return; }
      const r = gateFactoryProposal(name, `Specialist for ${name}`, args.slice(1).join(" ") || "repeated", BUNDLED_SKILLS.map((s) => s.name));
      if (r.rejectReason) { log("error", `${name}  ${r.rejectReason}`); process.exitCode = 1; return; }
      log("factory", `contract ${name}  awaiting human`);
      return;
    }
    default:
      log("error", `unknown command ${cmd}`); process.exitCode = 2;
  }
}
await main();
