import type { Application } from '../types';

export interface Conflict { a: Application; b: Application }

export function findConflicts(apps: Application[]): Conflict[] {
  const items = apps
    .flatMap((a) =>
      a.status === 'INTERVIEW' && a.interviewDateTime
        ? [{ app: a, t: new Date(a.interviewDateTime).getTime() }]
        : [],
    )
    .sort((x, y) => x.t - y.t);

  const result: Conflict[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (items[j].t - items[i].t < 60 * 60 * 1000) result.push({ a: items[i].app, b: items[j].app });
      else break;
    }
  }
  return result;
}