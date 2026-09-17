---
name: policy-enforce
description: >
  Zero-trust sidecar. Sits beside every capability binding. Identities, radius, grants that expire, fail closed.
metadata:
  afdh:
    purpose: "OpenCode-style allow/deny/ask matrix + Hermes quarantine. Not a linter you can skip."
    capabilities: ["policy.enforce"]
    triggers: ["policy","grant","radius","quarantine","allow"]
    anti_triggers: ["best-effort pass","YOLO"]
    inputs: ["requested capability","identity","stage","radius"]
    outputs: ["allow | deny | ask","grant ttl","quarantine events"]
---

# policy-enforce

Identities: user, orchestrator, specialist, reviewer, factory, workload.

Radius table: read-repo, write-repo, exec-sandbox, skill-mutate, prod-apply, secrets-read.

Default deny on skill-mutate, prod-apply, secrets-read. Ask a human.

Project skills: default-quarantine until scan + provenance.

## Security

- Grants expire next turn by default.
- Hide denied skills from the agent that requested them.

## Verification

- Every bind has a policy decision in the ledger.
