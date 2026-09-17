---
name: test-verify
description: >
  Invoke the bound test runner. Tests-pass is necessary and not sufficient for done.
metadata:
  afdh:
    purpose: "Climb the evidence ladder through tested → passed."
    capabilities: ["tests.unit","tests.integration"]
    triggers: ["test","verify behavior","acceptance"]
    anti_triggers: ["skip tests","screenshot equals tested"]
    inputs: ["diff","requirement test matrix"]
    outputs: ["test report","evidence:tested|passed"]
---

# test-verify

Bind tests.unit (vitest, pytest, go test, …) from the environment record.

No runner ⇒ blocked, do not skip. Narrative "looks good" is think-level only.

## Security

- Do not mark passed if the runner was not bound or did not execute.

## Verification

- Runner invoked. Report in the evidence pack.
