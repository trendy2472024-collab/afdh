import { secretHits } from "./engine.ts";

/**
 * Scanner adapters sit *behind* a capability.
 * Skills request `security.sast`. The control plane binds a pinned adapter.
 * Contributors implement this interface — the kernel never hardcodes a CLI.
 *
 * v0.1 ships a stub that proves the contract (secrets + jailbreak markers).
 * Real Semgrep / gitleaks / Trivy adapters are the highest-leverage PRs.
 */
export type AdapterCapability =
  | "security.sast"
  | "security.sca"
  | "security.iac"
  | "security.secrets";

export interface ScanFile {
  path: string;
  content: string;
}

export interface ScanFinding {
  path: string;
  rule: string;
  severity: "info" | "warn" | "error" | "crit";
  message: string;
}

export interface ScanReport {
  tool: string;
  version: string;
  capability: AdapterCapability;
  findings: ScanFinding[];
  ok: boolean;
}

export interface ScannerAdapter {
  capability: AdapterCapability;
  name: string;
  version: string;
  scan(files: ScanFile[]): ScanReport;
}

const OVERRIDE = /ignore\s+(previous|all)\s+instructions/i;
const CURL_SH = /curl[^\n]*\|\s*(ba)?sh/i;

export const stubSastAdapter: ScannerAdapter = {
  capability: "security.sast",
  name: "afdh-stub-sast",
  version: "0.1.0",
  scan(files) {
    const findings: ScanFinding[] = [];
    for (const f of files) {
      if (OVERRIDE.test(f.content)) {
        findings.push({
          path: f.path,
          rule: "afdh.instruction-override",
          severity: "crit",
          message: "Imperative instruction-override in scanned text",
        });
      }
      if (CURL_SH.test(f.content)) {
        findings.push({
          path: f.path,
          rule: "afdh.unpinned-install",
          severity: "error",
          message: "Pipe-to-shell install",
        });
      }
    }
    return {
      tool: this.name,
      version: this.version,
      capability: this.capability,
      findings,
      ok: findings.every((x) => x.severity !== "crit" && x.severity !== "error"),
    };
  },
};

export const stubSecretsAdapter: ScannerAdapter = {
  capability: "security.secrets",
  name: "afdh-stub-secrets",
  version: "0.1.0",
  scan(files) {
    const findings: ScanFinding[] = [];
    for (const f of files) {
      if (secretHits(f.content)) {
        findings.push({
          path: f.path,
          rule: "afdh.secret-heuristic",
          severity: "crit",
          message: "AKIA / ghp_ / private-key pattern in pack",
        });
      }
    }
    return {
      tool: this.name,
      version: this.version,
      capability: this.capability,
      findings,
      ok: findings.length === 0,
    };
  },
};

export const ADAPTER_REGISTRY: ScannerAdapter[] = [stubSastAdapter, stubSecretsAdapter];

export function findAdapter(capability: AdapterCapability, name?: string): ScannerAdapter | undefined {
  return ADAPTER_REGISTRY.find((a) => a.capability === capability && (!name || a.name === name));
}
