---
name: deploy-gate
description: >
  Production apply. Requires security-verified evidence, workload identity, and a human approval record.
metadata:
  afdh:
    purpose: "Unattended prod apply is an ADR reject. This skill is the gate, not the CD button."
    capabilities: ["deploy.prod"]
    triggers: ["deploy","production","release","apply"]
    anti_triggers: ["deploy without evidence","auto-approve because tests passed"]
    inputs: ["evidence pack","approval record","workload identity"]
    outputs: ["deploy decision","evidence:deploy-verified"]
---

# deploy-gate

Refuse when: security-verified missing, scanner unbound, no approval, no identity, secrets in pack.

On pass: record deploy-verified and hand off to operate-observe.

## Security

- Human gate on prod / secrets / IAM.
- Identity must be workload, not the chat user.

## Verification

- Approval id present. Identity present. Security-verified on the pack.
