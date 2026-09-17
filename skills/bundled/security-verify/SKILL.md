---
name: security-verify
description: >
  Run SAST/SCA/secrets/IaC through bound capabilities. Missing scanner ⇒ blocked. Fail closed.
metadata:
  afdh:
    purpose: "The difference between tests-pass and security-verified."
    capabilities: ["security.sast","security.sca","security.secrets","security.iac"]
    triggers: ["sast","security scan","secrets scan","sca"]
    anti_triggers: ["grep the repo and call it SAST","skip because no scanner installed"]
    inputs: ["diff","threat model","capability map"]
    outputs: ["scanner reports","evidence:security-verified or BLOCKED"]
---

# security-verify

Required on any mission that may deploy: security.sast and security.secrets.

If security.sast is unbound, emit BLOCKED with bind instructions. Never invent a green scan.

## Security

- Unbound capability is a hard block, not a warning.
- Do not auto-install scanners. Pin + sandbox + human if new.

## Verification

- Each required capability either produced a report or blocked the gate.
