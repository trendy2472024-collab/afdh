# Architecture

AFDH is a **control plane**, not a mega-prompt.

User intent → orchestrator → specialists → capability bindings → policy + quarantine → evidence pack → deploy (human + workload identity) → observe → gated factory.

Identities: user · orchestrator · specialist · reviewer · factory · workload

Radius default deny: skill-mutate, secrets-read, prod-apply.

Evidence ladder: think → exists → tested → passed → security-verified → deploy-verified → production-ready.

F6: deploy-gate cannot run before evidence-gate.

ADRs 001–010: control plane not mega-prompt; agentskills.io core; capability map; evidence contracts; untrusted repo/skills; gated factory; reviewer ≠ builder; human on prod; fail closed; per-agent allowlists.
