import type { WorkMode } from '../types';

const MODE_SCORE: Record<WorkMode, number> = { Remote: 100, Hybrid: 75, Onsite: 50 };

export interface OfferScore {
  salaryPart: number;
  modePart: number;
  skillPart: number;
  total: number;
}

export function scoreOffer(
  salary: number,
  maxSalary: number,
  mode: WorkMode,
  skillMatchPct: number,
): OfferScore {
  const salaryPart = maxSalary > 0 ? (salary / maxSalary) * 100 * 0.5 : 0;
  const modePart = MODE_SCORE[mode] * 0.25;
  const skillPart = skillMatchPct * 0.25;
  return { salaryPart, modePart, skillPart, total: salaryPart + modePart + skillPart };
}