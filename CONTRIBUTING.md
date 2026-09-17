# Contributing to AFDH

You are adding to a **control plane**. PRs that weaken fail-closed will be rejected.

## What we want

1. **Pinned scanner adapters** behind `security.sast` / `security.secrets` / `security.sca` / `security.iac`
   - See [docs/ADAPTERS.md](docs/ADAPTERS.md)
2. **Portable skills** under `skills/bundled/<name>/SKILL.md`
   - Repeated pattern (not a one-off)
   - Description routes; body is the contract
   - Capabilities (`security.sast`), never a hardcoded vendor CLI
   - Scan-clean: no instruction-override, no curl|sh, no always-approve-deploy
   - No extra top-level YAML keys
3. **Evals** that prove a gate (S suite is the release bar)
4. **Quarantine heuristics** that catch a jailbreak class without false-positiving documentation

## What we refuse

- YOLO skill writes / free `/learn`
- Privilege skills (“ignore the orchestrator”)
- Mega-prompt “do everything” skills
- README / AGENTS.md as policy
- Same-turn self-review
- Unpinned installs (`latest`, `curl | sh`)
- Evals that `passed = true`

## Loop

```bash
node --experimental-strip-types --test src/lib/afdh/harness.test.ts
node cli/afdh.mjs scan
node cli/afdh.mjs prove
node cli/afdh.mjs eval
```

Factory check for a new skill name:

```bash
node cli/afdh.mjs factory my-skill "seen on 4 missions, same contract"
```

If the factory refuses, do not open a PR to bypass it.

## Skill contract

Every bundled skill must answer:

- What trigger fires it — and what must not
- Which capabilities it may request
- What evidence it owes
- How it fails closed

See `docs/ARCHITECTURE.md` (ADRs 001–010).

## PR bar

- CI green (`scan` quarantines `speed-ship`; `eval` meets the release bar)
- No new `passed = true` in evals
- New adapters come with a clean fixture and a dirty fixture
