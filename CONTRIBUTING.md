# Contributing to AFDH

You are adding to a **control plane**. PRs that weaken fail-closed will be rejected.

Please read the [code of conduct](CODE_OF_CONDUCT.md). Working exploits go to [SECURITY.md](SECURITY.md).

## First 15 minutes

Requires Node 22+ (see [`.nvmrc`](.nvmrc)). Zero install.

```bash
git clone https://github.com/trendy2472024-collab/afdh.git
cd afdh
node --experimental-strip-types --test src/lib/afdh/harness.test.ts
node cli/afdh.mjs scan
node cli/afdh.mjs prove
node cli/afdh.mjs eval
node cli/afdh.mjs identity
node cli/afdh.mjs runtime
```

`scan` must quarantine `speed-ship`. `identity` must deny the chat user. If either goes green, stop and file a gate bug.

## What we want

1. **Pinned scanner adapters** behind `security.sast` / `security.secrets` / `security.sca` / `security.iac`
   - See [docs/ADAPTERS.md](docs/ADAPTERS.md)
   - Open issues: [#1 Semgrep](https://github.com/trendy2472024-collab/afdh/issues/1), [#2 gitleaks](https://github.com/trendy2472024-collab/afdh/issues/2), [#4 Trivy](https://github.com/trendy2472024-collab/afdh/issues/4)
2. **Runtime adapters** behind `runtime.mux` / `runtime.node`
   - [#7 Herdr socket](https://github.com/trendy2472024-collab/afdh/issues/7)
3. **Identity adapters** that present a real SVID, not a boolean
   - [#5 SPIFFE/SPIRE](https://github.com/trendy2472024-collab/afdh/issues/5), [#6 node-root / Spooffe](https://github.com/trendy2472024-collab/afdh/issues/6)
4. **Portable skills** under `skills/bundled/<name>/SKILL.md`
   - Repeated pattern (not a one-off)
   - Description routes; body is the contract
   - Capabilities (`security.sast`), never a hardcoded vendor CLI
   - Scan-clean: no instruction-override, no pipe-to-shell, no always-approve-deploy
   - No extra top-level YAML keys
5. **Evals** that prove a gate (S suite is the release bar)
6. **Quarantine heuristics** that catch a jailbreak class without false-positiving documentation — [#3](https://github.com/trendy2472024-collab/afdh/issues/3)

## What we refuse

- YOLO skill writes / free `/learn`
- Privilege skills (“ignore the orchestrator”)
- Mega-prompt “do everything” skills
- README / AGENTS.md as policy
- Same-turn self-review
- Unpinned installs (`latest`, pipe-to-shell, `herdr.dev/install`, `nvm-sh/nvm`)
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

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (ADRs 001–015).

## PR bar

- CI green (`scan` quarantines `speed-ship`; `eval` meets the release bar)
- No new `passed = true` in evals
- New adapters come with a clean fixture and a dirty fixture
- Use an [issue template](.github/ISSUE_TEMPLATE) when you can — `adapter`, `skill`, or `gate`
- Fill the [pull request template](.github/pull_request_template.md)

## License

Contributions are under Apache-2.0, same as the project. You retain copyright; you grant the license in [LICENSE](LICENSE).
