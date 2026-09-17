# Scanner adapters

Skills request **capabilities**. The control plane binds a **pinned adapter**. The kernel never hardcodes `semgrep` inside a skill.

```ts
export interface ScannerAdapter {
  capability: "security.sast" | "security.sca" | "security.iac" | "security.secrets";
  name: string;
  version: string; // pinned. "latest" is refused.
  scan(files: { path: string; content: string }[]): ScanReport;
}
```

`src/lib/afdh/adapters.ts` ships two stubs:

- `afdh-stub-sast@0.1.0` — instruction-override and `curl | sh`
- `afdh-stub-secrets@0.1.0` — AKIA / `ghp_` / PEM heuristic

They exist so the contract is testable **before** a real CLI is wired.

## Landing a real adapter (the PR we want)

1. Add `src/lib/afdh/adapters/<tool>.ts` implementing `ScannerAdapter`.
2. Pin a version. Refuse `latest`. Refuse pipe-to-shell install.
3. Run in a sandbox. No network unless the capability is explicitly `network.fetch` (not granted by default).
4. Return findings. `ok: false` on `error` / `crit`. The evidence gate will not climb.
5. Register in `ADAPTER_REGISTRY`.
6. Add a harness test that:
   - a clean fixture passes
   - a known-bad fixture fails
   - unbound capability still fail-closes (F5) if the adapter is not bound
7. Document the bind: `afdh` / TUI `bind security.sast semgrep 1.80.0`

Do **not** put the CLI name in `SKILL.md` capabilities. The skill still says `security.sast`.

## Bind rules (S3)

`refuseBind(tool, version)` rejects:

- `latest`
- `curl | sh` / `curl | bash`

This lives in `policy.ts`. Adapters do not get a bypass.

## Out of scope for 0.1

- Downloading scanners at runtime
- Auto-install on missing binary
- Trusting scanner stdout without a schema
