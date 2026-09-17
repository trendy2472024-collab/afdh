# AFDH

**A control plane for agents. Not a bigger prompt.**

[![ci](https://github.com/trendy2472024-collab/afdh/actions/workflows/ci.yml/badge.svg)](https://github.com/trendy2472024-collab/afdh/actions)

Agents today ship on stories. AFDH makes them ship on evidence.

- Portable skills (agentskills.io)
- Capability bindings, not vendor CLIs
- Fail-closed policy (unbound SAST blocks deploy)
- Evidence ladder (narrative is not a pass)
- Gated skill factory (no YOLO /learn)
- Human gate on production

Repo: https://github.com/trendy2472024-collab/afdh

```bash
node cli/afdh.mjs catalog
node cli/afdh.mjs scan
node cli/afdh.mjs eval
```

Requires Node 22+. Apache-2.0. See CONTRIBUTING.md.
