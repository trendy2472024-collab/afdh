# Contributing to AFDH

You are adding to a **control plane**. PRs that weaken fail-closed will be rejected.

## What we want

1. **Portable skills** under `skills/bundled/<name>/SKILL.md`
   - Repeated pattern (not a one-off)
   - Description routes; body is the contract
   - Capabilities (`security.sast`), never a hardcoded vendor CLI
   - Scan-clean: no instruction-override, no curl|sh, no always-approve-deploy
   - No extra top-level YAML keys
2. **Evals** that prove a gate (S suite is the release bar)
3. **Adapters** that copy the same skill tree into another runtime
4. **Real scanner bindings** (pinned Semgrep, gitleaks) behind capabilities

## What we refuse

- YOLO skill writes / free `/learn`
- Privilege skills
- Mega-prompt skills
- README / AGENTS.md as policy
- Same-turn self-review
- Unpinned installs

```bash
node --experimental-strip-types --test src/lib/afdh/harness.test.ts
node cli/afdh.mjs scan
node cli/afdh.mjs eval
```
