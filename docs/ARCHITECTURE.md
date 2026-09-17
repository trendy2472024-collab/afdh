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
| `engine.ts` | grant, ladder, evals, `prove`, `canApplyProd` |
| `identity.ts` | SPIFFE/WIMSE URI, WIT+WPT gate, fail-closed catalog |
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

See [IDENTITY.md](IDENTITY.md). SPIFFE IDs are assigned; JWT-SVID is bearer and cannot prod-apply; WIT requires WPT or HTTP Message Signatures. The LLM MUST NOT hold the credential (WIMSE AIMS-00, 2026-09-15). Node-root is identity compromise (Spooffe, 2026-09-10). Live SPIRE is not in 0.1.

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
| 011 | Workload identity is a SPIFFE/WIMSE credential | Boolean flag / chat-user-as-workload |
| 012 | Fail closed on identity outage | Fail-open when SPIRE/OIDC is down |
| 013 | WIT is not a bearer; PoP is WPT or HTTP signatures | JWT-SVID / WIT as `Authorization: Bearer` |
| 014 | Node-root is identity compromise (Spooffe) | Trust every SVID from a shared node |

## Honest scope (v0.1)

Enforced: policy, quarantine, factory, bind pin, ladder order, secret heuristic, eval suite.

Stubbed: live scanner processes (interface is real; binaries are PRs).

Roadmap: 1 Catalog dir · 2 Ledger + subagent contracts · 3 Sandbox bindings · 4 Real SAST adapters · 5 OTel · 6 Factory pipeline · 7 Multi-agent allowlists · 8 Signing + break-glass
