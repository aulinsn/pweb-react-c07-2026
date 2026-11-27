import type { ActivityLog, Application, WorkMode } from '../types';

export function createLog(message: string): ActivityLog {
  return { id: crypto.randomUUID(), timestamp: new Date().toISOString(), message };
}

export interface NewApplicationInput {
  company: string;
  role: string;
  workMode: WorkMode;
  status: 'WISHLIST' | 'APPLIED';
  requiredSkills: string[];
  cvVersion?: string;
  appliedDate?: string;
}

export function createApplication(input: NewApplicationInput): Application {
  return {
    id: crypto.randomUUID(),
    company: input.company.trim(),
    role: input.role.trim(),
    workMode: input.workMode,
    status: input.status,
    requiredSkills: input.requiredSkills,
    cvVersion: input.cvVersion,
    appliedDate: input.appliedDate,
    lastUpdatedAt: new Date().toISOString(),
    checklist: [],
    activityLogs: [createLog(`Lamaran dibuat dengan status ${input.status}`)],
  };
}

const normalize = (s: string): string => s.trim().toLowerCase();

export function isDuplicate(apps: Application[], company: string, role: string): boolean {
  return apps.some(
    (a) => normalize(a.company) === normalize(company) && normalize(a.role) === normalize(role),
  );
}

export function parseWorkMode(location: string): WorkMode {
  const text = location.toLowerCase();
  if (text.includes('hybrid')) return 'Hybrid';
  if (text.includes('onsite')) return 'Onsite';
  return 'Remote';
}