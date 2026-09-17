---
name: requirements-define
description: >
  Turn an objective into testable acceptance paths. Maps requirement → code path → test. Intent is not a grant.
metadata:
  afdh:
    purpose: "Stop the orchestrator from building the wrong thing, and give evidence-gate a contract."
    capabilities: ["catalog.read"]
    triggers: ["requirements","acceptance","define the change","scope"]
    anti_triggers: ["start coding","deploy now"]
    inputs: ["objective","environment record"]
    outputs: ["requirement cards","out-of-scope list","test matrix"]
---

# requirements-define

For each requirement: id, statement, path, test, blast radius, human-gate flag.

Reject hidden work: "also make it auto-deploy" is a separate gated requirement.

Keep the set small. Empty shells rot ecosystems; empty requirements rot missions.

## Security

- Do not promote a user sentence into a production permission.

## Verification

- Every requirement has a path and a test name.
