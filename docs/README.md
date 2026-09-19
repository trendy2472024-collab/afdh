# AFDH docs

Kernel first. The CLI is the contract. These notes explain *why* a gate exists; they are not policy — the engine is.

| Doc | Read when |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | You need the control-plane picture, identities, blast radius, ADRs |
| [ADAPTERS.md](ADAPTERS.md) | You are landing a pinned scanner or runtime behind a capability |
| [IDENTITY.md](IDENTITY.md) | Prod-apply, SPIFFE/WIMSE, Spooffe, what 0.1 actually verifies |
| [RUNTIME.md](RUNTIME.md) | Node 22 pin, Herdr as `runtime.mux`, why install scripts are denied |
| [ROADMAP.md](ROADMAP.md) | What 0.2 / 0.3 / 1.0 still owe |

Brand assets live in [`assets/`](assets/). Mark, banner, and the CLI capture used on the README.

## Start here

```bash
node cli/afdh.mjs prove      # gates, no agent
node cli/afdh.mjs identity   # chat-user MUST deny
node cli/afdh.mjs runtime    # nvm 22; herdr pipe-to-shell MUST deny
node cli/afdh.mjs scan       # speed-ship MUST quarantine
```

A deny is a pass. If those go green for the hostile cases, the kernel is wrong.

## What this repo is not

- Not a bigger prompt.
- Not live Semgrep / gitleaks / Trivy. Those are [adapter issues](https://github.com/trendy2472024-collab/afdh/labels/adapter).
- Not live SPIRE. Identity is a fail-closed *context* — see [IDENTITY.md](IDENTITY.md).
- Not a live Herdr socket. Pane mapping is a fixture until [issue #7](https://github.com/trendy2472024-collab/afdh/issues/7).
