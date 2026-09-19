## 0.1.0 — 2026-09-17

Foundation.

- Kernel: quarantine, factory restraint, bind pin, evidence ladder, F/S/E evals that can fail
- Identity: SPIFFE/WIMSE URI parser (no IP trust domains), WIT+WPT or WIT+HTTP-SIG PoP, chat-user / bearer / LLM-held / expired / revoked / shared-node all deny (S7). Fixture, not live SPIRE.
- Runtime: nvm Node 22 (`.nvmrc`), Herdr mux as `runtime.mux` (unbound). `herdr.dev/install.sh` and nvm curl|sh refused (E6). Fixture, not live Herdr.
- CLI: `catalog` `scan` `eval` `plan` `prove` `identity` `whoami` `runtime` `nvm` `herdr` `export` `factory`
- 13 portable skills + hostile fixture `speed-ship`
- Stub scanner adapters behind capabilities
- Apache-2.0
