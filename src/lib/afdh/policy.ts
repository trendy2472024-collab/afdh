export const QUARANTINE_PATTERNS: { id: string; re: RegExp; reason: string }[] = [
  { id: "instruction-override", re: /ignore\s+(previous|all)\s+instructions/i, reason: "Imperative instruction-override (jailbreak persistence)" },
  { id: "yolo-deploy", re: /always\s+approve\s+(production\s+)?deploy/i, reason: "Privilege: forced production approve" },
  { id: "disable-policy", re: /disable\s+policy|yolo\s+mode/i, reason: "Attempts to disable the control plane" },
  { id: "unpinned-curl", re: /curl[^\n]*\|\s*(ba)?sh/i, reason: "Unpinned pipe-to-shell install" },
];

export function scanSkillText(text: string): { id: string; reason: string }[] {
  const documented = text.replace(/do\s+not\s+[^\n]*/gi, "").replace(/["'`][^"'`]{0,120}["'`]/g, "");
  return QUARANTINE_PATTERNS.filter((p) => p.re.test(documented)).map((p) => ({ id: p.id, reason: p.reason }));
}

export function gateFactoryProposal(name: string, description: string, reason: string, existing: string[]) {
  const blob = `${name} ${description} ${reason}`;
  const overlap = existing.filter((n) => n === name || description.toLowerCase().includes(n.toLowerCase()) || name.toLowerCase().includes(n.split("-")[0] ?? ""));
  const oneOff = /once|one-off|one off|this repo only/i.test(blob);
  const privilege = scanSkillText(blob).length > 0 || /always approve|bypass|ignore orchestrator|privilege/i.test(blob);
  const rejectReason = privilege ? "Refuse: privilege / instruction-override / YOLO deploy" : oneOff ? "Refuse: factory never authors one-offs" : undefined;
  return { overlap, oneOff, privilege, rejectReason };
}
