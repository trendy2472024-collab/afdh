/**
 * Runtime pin — nvm (Node 22) and Herdr (agent multiplexer).
 *
 * Structural. Does not exec `nvm`, does not open the Herdr socket.
 * A green fixture is a fixture. Live binaries are 1.0 adapters.
 *
 * Herdr (https://herdr.dev) owns agent terminals: working / blocked / idle / done.
 * Its advertised install is `curl | sh` — AFDH refuses that (S3). Pin via brew / mise / gh release.
 * nvm is how contributors pin Node. The kernel cares about the major, not the installer.
 */

import type { Mission, StageStatus } from "./types.ts";

export const PINNED_NODE_MAJOR = 22;
export const NVMRC = "22";
export const PINNED_HERDR = "0.9.1";
export const HERDR_SKILL_ROOT = ".herdr/skills";

export type HerdrPaneState = "working" | "blocked" | "idle" | "done" | "unknown";

export interface HerdrPane {
  id: string;
  name: string;
  kind: "control-plane" | "specialist" | "reviewer";
  state: HerdrPaneState;
}

export interface RuntimeDecision {
  ok: boolean;
  reason: string;
  gate: string;
}

export const RUNTIME_GATES = [
  {
    id: "G-NODE-VER",
    when: "Node major < 22",
    effect: "block environment-discovery",
    standard: "AFDH nvm pin / engines.node",
  },
  {
    id: "G-NVM-CURL",
    when: "nvm installed via curl | bash",
    effect: "refuse bind (S3)",
    standard: "AFDH ADR-009 / ADR-015",
  },
  {
    id: "G-HERDR-CURL",
    when: "herdr.dev/install.sh or irm | iex",
    effect: "refuse bind (S3)",
    standard: "AFDH ADR-015 — pin brew/mise/gh release",
  },
  {
    id: "G-HERDR-ENV",
    when: "drive Herdr CLI without HERDR_ENV=1",
    effect: "deny pane control",
    standard: "Herdr skill — only from inside a Herdr pane",
  },
  {
    id: "G-MUX",
    when: "runtime.mux unbound and a caller assumes live panes",
    effect: "fixture only — do not invent a green multiplexer",
    standard: "AFDH ADR-003 / ADR-015",
  },
] as const;

export function parseNodeMajor(version: string): number {
  const m = version.trim().replace(/^v/i, "").split(".")[0];
  const n = Number(m);
  return Number.isFinite(n) ? n : 0;
}

/** Browser has no process. Default to the pin so the preview does not crash. */
export function detectNodeMajor(): number {
  const fromProc =
    typeof process !== "undefined" && typeof process.versions?.node === "string"
      ? process.versions.node
      : null;
  return parseNodeMajor(fromProc ?? `${PINNED_NODE_MAJOR}.0.0`);
}

export function nodeGate(major = detectNodeMajor()): RuntimeDecision {
  if (major < PINNED_NODE_MAJOR) {
    return {
      ok: false,
      reason: `node ${major} < ${PINNED_NODE_MAJOR} — fail closed (nvm pin)`,
      gate: "G-NODE-VER",
    };
  }
  return {
    ok: true,
    reason: `node ${major}  nvmrc=${NVMRC}`,
    gate: "G-NODE-VER",
  };
}

export function herdrEnvGate(env: { HERDR_ENV?: string } | undefined): RuntimeDecision {
  if (env?.HERDR_ENV === "1") {
    return { ok: true, reason: "HERDR_ENV=1  inside a Herdr pane", gate: "G-HERDR-ENV" };
  }
  return {
    ok: false,
    reason: "not inside Herdr (HERDR_ENV≠1) — pane control is a fixture",
    gate: "G-HERDR-ENV",
  };
}

/** Preview / CLI fixture. Labeled. Not a live Herdr socket. */
export function previewHerdrEnv(): { HERDR_ENV: "1" } {
  return { HERDR_ENV: "1" };
}

export function stageToHerdr(status: StageStatus): HerdrPaneState {
  switch (status) {
    case "running":
      return "working";
    case "blocked":
      return "blocked";
    case "passed":
      return "done";
    case "pending":
    case "skipped":
      return "idle";
    case "failed":
      return "blocked";
    default:
      return "unknown";
  }
}

export function missionToPanes(mission: Mission | null): HerdrPane[] {
  const control: HerdrPane = {
    id: "afdh",
    name: "control-plane",
    kind: "control-plane",
    state: mission
      ? mission.status === "running"
        ? "working"
        : mission.status === "blocked"
          ? "blocked"
          : mission.status === "passed"
            ? "done"
            : "idle"
      : "idle",
  };
  if (!mission) return [control];
  const specialists: HerdrPane[] = mission.stages.map((s) => ({
    id: s.id,
    name: s.skill,
    kind: s.skill.includes("review") || s.id === "evidence-gate" ? "reviewer" : "specialist",
    state: stageToHerdr(s.status),
  }));
  return [control, ...specialists];
}

export function formatPanes(panes: HerdrPane[]): string {
  return panes.map((p) => `${p.state.padEnd(8)} ${p.name}`).join("\n");
}

export function formatRuntime(opts?: { herdrBound?: boolean; herdrEnv?: boolean }): string {
  const node = nodeGate();
  const mux = opts?.herdrBound ? `herdr@${PINNED_HERDR}` : "herdr UNBOUND";
  const env = opts?.herdrEnv ? "HERDR_ENV=1" : "HERDR_ENV=fixture";
  return `${node.reason}  ${mux}  ${env}  (not live nvm/herdr)`;
}
