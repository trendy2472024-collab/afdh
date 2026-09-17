---
name: architecture-plan
description: >
  Plan the cut. Bind capabilities not CLIs. Minimal diff. Aider-style plan/build split.
metadata:
  afdh:
    purpose: "The implement skill receives a contract, not a vibe."
    capabilities: ["catalog.read","policy.enforce"]
    triggers: ["architecture","plan the change","how should we cut"]
    anti_triggers: ["implement in the same turn as the plan without a contract"]
    inputs: ["requirements","threat model","environment"]
    outputs: ["run plan","capability map","file-level cut"]
---

# architecture-plan

Plan files, tests, capability bindings, and rollback.

Capability map example: security.sast → (unbound | semgrep@pinned). Missing bind is a later blocker, not a surprise.

Split plan from build. The planner does not write production code.

## Security

- Do not hard-code a vendor CLI into a skill. Plan security.sast, bind Semgrep later.

## Verification

- Capability map present. Reviewer identity is distinct from builder.
