---
name: operate-observe
description: >
  Watch the cut. Telemetry with redaction, rollback path, learn-loop into the factory.
metadata:
  afdh:
    purpose: "Production-ready is observe-live, not deploy-clicked."
    capabilities: ["telemetry.read","deploy.rollback"]
    triggers: ["observe","oncall","telemetry","rollback"]
    anti_triggers: ["ship and forget"]
    inputs: ["deploy record","slos"]
    outputs: ["observe log","evidence:production-ready","factory signals"]
---

# operate-observe

Confirm the cut is live. If error budget burns, rollback. Recurring work may signal the factory — never auto-write a skill.

## Security

- Redact tokens in spans. No PII in skill-factory training signals.

## Verification

- Health probe. Rollback command documented.
