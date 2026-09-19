# Roadmap

Honest. Dates are intent, not promises.

## 0.1 — kernel (this tag)

In-process control plane. CI is the contract.

- Catalog scan + quarantine (`speed-ship` must stay dirty)
- Factory refuse one-off / privilege
- Bind pin (`latest`, `curl | sh` denied)
- Evidence ladder + SDLC order (F6)
- Secret heuristic (AKIA / ghp_ / PEM)
- 13 portable skills + hostile fixture
- Stub `ScannerAdapter` so the contract is testable
- SPIFFE/WIMSE identity *context* (URI, WIT+WPT or HTTP-SIG, revocation, node isolation, fail-closed catalog). Fixture, not SPIRE.
- nvm Node 22 pin (`.nvmrc`) + Herdr mux as `runtime.mux` (unbound; curl\|sh refused). Fixture, not a live Herdr socket.

Not in 0.1: live Semgrep / gitleaks / Trivy processes, signed catalog, live SPIRE / IRSA / WIF / Entra federation, live Herdr socket / nvm use, OTel export, npm publish.

## 0.2 — real scanners

Highest-leverage work. See [ADAPTERS.md](ADAPTERS.md) and issues labelled `adapter`.

- Pinned Semgrep behind `security.sast`
- Pinned gitleaks behind `security.secrets`
- Pinned Trivy behind `security.sca`
- Missing binary = block, never a green story

## 0.3 — provenance

- Signed bundled catalog
- Break-glass with a ledgered human + expiry
- Skill watch / invalidate on hash change

## 1.0 — production bar

Release bar already written: **all S pass; F1–F3 and E2 pass.** 1.0 additionally requires:

- Live adapters on the default bind map (F5 flips: SAST is bound, still fail-closed on findings)
- Workload identity is a real principal (SPIRE or cloud federation), not a fixture
- Human gate cannot be auto-clicked by the same process that built the diff

Do not ship 1.0 because the TUI looks finished.
