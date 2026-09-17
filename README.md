# AFDH

**A control plane for agents. Not a bigger prompt.**

[![ci](https://github.com/trendy2472024-collab/afdh/actions/workflows/ci.yml/badge.svg)](https://github.com/trendy2472024-collab/afdh/actions)

Agents ship on stories: “looks good”, “tests pass”, “YOLO deploy”. That is how you get prompt-injected skills, unbound scanners, and production applies with no human on the loop.

AFDH is a **zero-trust control plane** for agentic SDLC.

- Intent is parsed. It is **not** a permission grant.
- Skills are portable files ([agentskills.io](https://agentskills.io)). Extra YAML keys are not required.
- Tools bind as **capabilities** (`security.sast`), not vendor CLIs hardcoded in a skill.
- Evidence is a **ladder**. Narrative is not a pass.
- Missing SAST is a **hard block**.
- Production apply needs a **human** and a **workload identity**.

```
intent → orchestrator → specialists
                │
         policy + quarantine
                │
         evidence pack → deploy → observe → factory
```

Public repo: [github.com/trendy2472024-collab/afdh](https://github.com/trendy2472024-collab/afdh)

## What is real in 0.1.0

| Kernel (enforced in-process, tested in CI) | Not yet (typed extension points) |
|---|---|
| Catalog scan + quarantine | Live Semgrep / gitleaks / Trivy processes |
| Factory refuse one-off / privilege | Signed catalog + break-glass |
| Bind pin (`latest` and `curl \| sh` denied) | OTel export |
| Evidence ladder + SDLC order (F6) | Multi-agent runtime embedding |
| Secret heuristic (AKIA / ghp_ / PEM) | Live SPIRE / IRSA / WIF / Entra |
| SPIFFE/WIMSE identity *context* (WIT+WPT, fail-closed) | Crypto verify of a real SVID |
| 13 portable skills + hostile fixture | |

The TUI is a **reference control-plane UX** on this kernel. Scanner adapters implement `ScannerAdapter` in `src/lib/afdh/adapters.ts`. A stub ships so the contract is testable today. Real adapters are the highest-leverage PRs.

## 30 seconds

Requires Node 22+. Zero dependencies.

```bash
git clone https://github.com/trendy2472024-collab/afdh.git
cd afdh
node cli/afdh.mjs catalog
node cli/afdh.mjs scan      # speed-ship MUST quarantine
node cli/afdh.mjs prove     # fail-closed gates, no agent required
node cli/afdh.mjs eval      # release bar: all S; F1–F3; E2
node cli/afdh.mjs plan "ship the payments webhook"
node cli/afdh.mjs factory once-fix "this repo only"   # must refuse
node cli/afdh.mjs identity  # chat-user MUST deny prod-apply
```

If `scan` does not quarantine `speed-ship`, that is a **release blocker**. Do not ship.

## Why this exists

| Field taught us | AFDH keeps |
|---|---|
| Hermes | Scan-time quarantine. `/learn` is a review fork, not a write. |
| Claude Code | Description-as-router. Grants expire. |
| OpenCode | Per-agent allow / deny / ask. |
| DeepSeek | Ranked skill roots, watch/invalidate. |
| Aider | Plan / build split. Reviewer ≠ builder. |

We do **not** copy ungoverned group chat as an SDLC, free skill writes, or README-as-policy.

## Portable skills

One tree, no vendor forks. Core is `SKILL.md`.

```
skills/bundled/<name>/SKILL.md
skills/project/          # default-quarantine
```

| Runtime | Root |
|---|---|
| Claude Code | `.claude/skills` |
| OpenCode | `.opencode/skills` |
| Hermes | `~/.hermes/skills` |
| DeepSeek | `.dsh/skills` |

Project skills are **untrusted data** until scan + provenance. `speed-ship` is a hostile fixture. It must stay quarantined.

## Policy (fail closed)

- User intent is intent, **not** a permission grant.
- Bind `security.sast`, not `semgrep` hardcoded in a skill.
- Unbound scanner ⇒ blocked. Narrative is not a pass.
- `deploy.prod` and `skills.write` default deny. Human + workload identity.
- Factory refuses one-offs and privilege. No YOLO `/learn`.

## Evidence ladder

`think → exists → tested → passed → security-verified → deploy-verified → production-ready`

You cannot skip rungs. Deploy cannot run before the evidence gate (F6).

## Repo map

```
cli/afdh.mjs              headless control plane
src/lib/afdh/engine.ts    grant, ladder, evals, prove
src/lib/afdh/identity.ts  SPIFFE/WIMSE identity gate
src/lib/afdh/adapters.ts  ScannerAdapter contract
src/lib/afdh/policy.ts    quarantine + factory + bind pin
skills/                   portable SKILL.md tree
docs/ARCHITECTURE.md      ADRs, identities, radius
docs/ADAPTERS.md          how to land a real scanner
docs/ROADMAP.md           0.2 scanners → 1.0 production bar
```

## Contribute

Read [CONTRIBUTING.md](CONTRIBUTING.md). Highest-leverage PRs:

1. A **pinned scanner adapter** behind `security.sast` / `security.secrets`
2. A **portable skill** that already exists as a repeated pattern, scan-clean, with an eval
3. A quarantine heuristic that catches a real jailbreak class without false-positiving docs

Do not send: one-off helpers, always-approve-deploy, extra YAML keys, README-as-policy.

Good first issues are labelled `good first issue`.

## License

Apache-2.0. Copyright 2026 Kingsley Nwaya and AFDH contributors. See [LICENSE](LICENSE).
