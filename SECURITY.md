# Security

AFDH is a fail-closed harness. Treat it like production policy, not a demo.

## Report

Email or GitHub private advisory. Do not file a public issue for a working jailbreak against the factory, catalog, or evidence gate.

## Threats we already model

- Instruction-override in project skills / README
- Tool poisoning (unpinned, `curl | sh`)
- Secret leakage into evidence packs
- Over-privilege (`deploy.prod`, `skills.write`)
- Same-turn self-review
- Factory as prompt-injection persistence

Hostile fixture: `skills/project/speed-ship`. Catalog scan must quarantine it. If `afdh scan` does not, that is a **release blocker**.

## Scope

In: policy engine, catalog scan, factory gate, evidence ladder, capability bindings.
Out: the agent runtime you plug in (Claude Code, OpenCode, Hermes, …) — report those upstream too, and send us the adapter gap.
