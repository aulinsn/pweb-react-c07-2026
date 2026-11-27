import type { Application } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function isGhostingRisk(app: Application, now: number = Date.now()): boolean {
  if (app.status !== 'APPLIED' && app.status !== 'SCREENING') return false;
  return now - new Date(app.lastUpdatedAt).getTime() > 14 * DAY_MS;
}