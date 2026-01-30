import { Project, Phase } from "../types";

export const mockProjects: Project[] = [
  { id: "1", name: "Anthropic" },
  { id: "2", name: "Vercel" },
  { id: "3", name: "Stripe" },
  { id: "4", name: "Linear" },
  { id: "5", name: "Figma" },
];

export const mockPhases: Phase[] = [
  // Anthropic phases
  { id: "1-1", projectId: "1", name: "Development Claude Code" },
  { id: "1-2", projectId: "1", name: "Design Review" },
  { id: "1-3", projectId: "1", name: "Testing & QA" },
  // Vercel phases
  { id: "2-1", projectId: "2", name: "Frontend Development" },
  { id: "2-2", projectId: "2", name: "Infrastructure" },
  { id: "2-3", projectId: "2", name: "Documentation" },
  // Stripe phases
  { id: "3-1", projectId: "3", name: "API Integration" },
  { id: "3-2", projectId: "3", name: "Payment Flow Design" },
  { id: "3-3", projectId: "3", name: "Security Audit" },
  // Linear phases
  { id: "4-1", projectId: "4", name: "Feature Development" },
  { id: "4-2", projectId: "4", name: "Bug Fixes" },
  // Figma phases
  { id: "5-1", projectId: "5", name: "Design System" },
  { id: "5-2", projectId: "5", name: "Prototyping" },
  { id: "5-3", projectId: "5", name: "User Research" },
];

export function getPhasesForProject(projectId: string): Phase[] {
  return mockPhases.filter((phase) => phase.projectId === projectId);
}
