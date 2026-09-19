# Security

AFDH is a fail-closed harness. Treat it like production policy, not a demo.

## Report

**Do not file a public issue** for a working jailbreak against the factory, catalog, evidence gate, identity gate, or runtime pin.

Use a [GitHub private advisory](https://github.com/trendy2472024-collab/afdh/security/advisories/new).

We will acknowledge, confirm the deny (or the miss), and credit you in the advisory unless you ask otherwise.

## Threats we already model

- Instruction-override in project skills / README
- Tool poisoning (unpinned, pipe-to-shell, vendor `install.sh`)
- Secret leakage into evidence packs (AKIA / `ghp_` / PEM)
- Over-privilege (`deploy.prod`, `skills.write`)
- Same-turn self-review
- Factory as prompt-injection persistence
- Bearer JWT-SVID and LLM-held credentials (WIMSE AIMS)
- Node-root SVID harvest on a shared node (Spooffe)
- Chat-user principal used as if it were a workload

Hostile fixture: `skills/project/speed-ship`. Catalog scan must quarantine it. If `afdh scan` does not, that is a **release blocker**.

## Scope

**In:** policy engine, catalog scan, factory gate, evidence ladder, capability bindings, identity context, runtime pin.

**Out:** the agent runtime you plug in (Claude Code, OpenCode, Hermes, Herdr, …) — report those upstream too, and send us the adapter gap.

0.1 identity and runtime gates are **structural**. They do not crypto-verify a live SVID and they do not attach to a live Herdr socket. A bypass of the *shape* of the gate is still in scope. Claiming “I have SPIRE, therefore skip the gate” is not.

## Supported versions

| Version | Supported |
| --- | --- |
| 0.1.x (main) | Yes |
| unreleased forks that strip fail-closed | No |
