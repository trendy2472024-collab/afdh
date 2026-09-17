import type { Skill } from "./types";

export function toSkillMarkdown(skill: Skill): string {
  const yaml = [
    "---",
    `name: ${skill.name}`,
    "description: >",
    `  ${skill.description}`,
    "metadata:",
    `  afdh:`,
    `    purpose: ${JSON.stringify(skill.purpose)}`,
    `    capabilities: ${JSON.stringify(skill.capabilities)}`,
    "---",
    "",
    `# ${skill.name}`,
    "",
    skill.body.trim(),
    "",
  ];
  return yaml.join("\n");
}
