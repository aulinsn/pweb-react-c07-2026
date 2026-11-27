export interface SkillMatchResult { score: number; matched: string[]; missing: string[] }

export function skillMatch(required: string[], mine: string[]): SkillMatchResult {
  const mineSet = new Set(mine.map((s) => s.trim().toLowerCase()));
  const matched = required.filter((s) => mineSet.has(s.trim().toLowerCase()));
  const missing = required.filter((s) => !mineSet.has(s.trim().toLowerCase()));
  const score = required.length === 0 ? 0 : Math.round((matched.length / required.length) * 100);
  return { score, matched, missing };
}