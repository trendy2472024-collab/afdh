# Architecture

AFDH is a **control plane**, not a mega-prompt.

```
User intent
    ↓
Chief orchestrator        (parse, route, bind, ledger)
    ↓
Specialists               (13 portable skills)
    ↓
Capability bindings       (security.sast → pinned adapter)
    ↓
Policy + quarantine       (allow / deny / ask, grants expire)
    ↓
Evidence pack             (ladder; narrative ≠ pass)
    ↓
Deploy gate               (human + workload identity)
    ↓
Operate / observe
    ↓
Skill factory             (gated; never one-off / privilege)
```

Kernel modules (`src/lib/afdh/`):

| File | Owns |
|---|---|
| `engine.ts` | grant/ladder/evals/`prove`/`canApplyProd` |
| `policy.ts` | identities, radius, quarantine, factory, bind pin |
| `adapters.ts` | `ScannerAdapter` contract + stubs |
| `planner.ts` | fail-closed local plan (intent ≠ grant) |
| `skills.ts` | 13 bundled + hostile fixture |
| `stages.ts` | SDLC order + evidence ladder |
| `evals.ts` | F / S / E cases |

The TUI (`src/components/tui`) and CLI (`cli/afdh.mjs`) are two faces of this kernel.

## Identities

user · orchestrator · specialist · reviewer · factory · workload

User intent is **not** a grant. Workload identity applies prod, not the chat user.

## Blast radius

| Radius | Default |
|---|---|
| read-repo | allow |
| write-repo | ask |
| exec-sandbox | ask |
| skill-mutate | deny |
| secrets-read | deny |
| prod-apply | deny |

## Evidence ladder

think → exists → tested → passed → security-verified → deploy-verified → production-ready

F6: deploy-gate cannot run before evidence-gate.

## ADRs

| ID | Decision | Rejected |
|---|---|---|
| 001 | Control plane + specialists | Mega-prompt |
| 002 | agentskills.io core + adapters | Vendor-only skills |
| 003 | Capability map | Hard-coded CLIs in skills |
| 004 | Evidence contracts | Looks-good / tests-pass = secure |
| 005 | Repo and skills untrusted | Auto-trust project instructions |
| 006 | Gated skill factory | Free /learn writes |
| 007 | Reviewer ≠ builder | Same-turn self-review |
| 008 | Human on prod / secrets / IAM / skill mutate | Unattended prod apply |
| 009 | Fail closed | Best-effort pass |
| 010 | Per-agent allowlists | Every agent sees every skill |

## Honest scope (v0.1)

Enforced: policy, quarantine, factory, bind pin, ladder order, secret heuristic, eval suite.

Stubbed: live scanner processes (interface is real; binaries are PRs).

Roadmap: 1 Catalog dir · 2 Ledger + subagent contracts · 3 Sandbox bindings · 4 Real SAST adapters · 5 OTel · 6 Factory pipeline · 7 Multi-agent allowlists · 8 Signing + break-glass
