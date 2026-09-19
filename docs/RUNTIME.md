# Runtime — nvm and Herdr

AFDH does not install tools with `curl | sh`. Node is pinned. Herdr is a **capability**.

This kernel validates pins and maps mission stages to Herdr pane states. It does **not** exec `nvm`, and it does **not** open the Herdr Unix socket. A green fixture is a fixture.

## nvm

| What | Enforcement |
|---|---|
| `.nvmrc` = `22` | File in the repo. `nodeGate` fail-closes on major < 22. |
| `runtime.node` → `node@22` | Default-granted. The control plane runs on Node 22. |
| `nvm-sh/nvm/install.sh` | **Refuse** (S3). Pin Node via nvm/fnm/mise from a versioned installer, not a pipe. |

The browser preview is not nvm. The CLI and CI are.

## Herdr

[Herdr](https://herdr.dev) is a terminal multiplexer for coding agents. Panes stay up when you detach. Agents are `working` / `blocked` / `idle` / `done`. The CLI and socket API are the same surface.

| What | Enforcement |
|---|---|
| `runtime.mux` → `herdr@0.9.1` | Default **unbound**. Missing mux is a fixture, not a green Herdr. |
| `https://herdr.dev/install.sh` | **Refuse**. Pin via `brew install herdr`, `mise use -g herdr`, or a GitHub release. |
| `HERDR_ENV=1` | Required to drive panes. Preview does not set it. |
| Skill export | `afdh install herdr` writes portable `SKILL.md` to `.herdr/skills` so agents **inside** Herdr panes can load AFDH. Herdr is not a skill host; the agent in the pane is. |

Do not vendor Herdr's own skill. Agents that need it: `npx skills add herdrdev/herdr --skill herdr -g`.

## Commands

```
afdh runtime
afdh nvm
afdh herdr
```

In the TUI: `runtime` (catalog tab + pane rail). `curl|sh` must print DENY.

## Not yet

- Live `herdr` binary / socket
- Live `nvm use`
- Restoring Herdr layouts after a host restart

See [ROADMAP.md](ROADMAP.md). Follow-up: a Herdr adapter that fail-closes when the socket is down.
