---
name: implement
description: >
  Execute the architecture plan inside the granted radius. Builder is not the reviewer.
metadata:
  afdh:
    purpose: "Make the smallest correct change. No drive-by refactors."
    capabilities: ["filesystem.write","process.exec"]
    triggers: ["implement","write the code","apply the plan"]
    anti_triggers: ["plan and review yourself","expand scope"]
    inputs: ["run plan","capability grants"]
    outputs: ["diff","notes for verifier"]
---

# implement

Follow the plan. If the plan is wrong, stop and return to architecture-plan.

Do not: rewrite adjacent modules, add SDKs, or install unpinned tools.

Hand the diff to test-verify and an independent reviewer.

## Security

- Write radius = repo unless granted otherwise.
- No secret files. No skill mutation. No prod apply.

## Verification

- Diff stays on planned paths.
- No grant elevation.
