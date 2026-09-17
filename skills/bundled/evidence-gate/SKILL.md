---
name: evidence-gate
description: >
  Validate the evidence pack. Narrative is not a pass. Secret heuristic on the pack itself.
metadata:
  afdh:
    purpose: "The last machine gate before deploy. Illegal done claims die here."
    capabilities: ["ledger.read","evidence.validate"]
    triggers: ["evidence","pack","can we ship","done?"]
    anti_triggers: ["trust the agent's summary"]
    inputs: ["stage ledger","test report","scanner reports"]
    outputs: ["gate decision","pack","redactions"]
---

# evidence-gate

Check: pack files exist, stage ledger is reproducible, claimed evidence ≤ proven evidence, no AKIA/token patterns, no done if tests or scanners missing.

## Security

- Scan the pack for secrets. A leaked token in evidence is a fail.

## Verification

- Pack present. Ladder rank matches claims. No secrets.
