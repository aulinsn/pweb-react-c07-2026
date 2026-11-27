import type { Application, ApplicationStatus, WorkMode } from '../types';

export const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  WISHLIST: ['APPLIED', 'REJECTED'],
  APPLIED: ['SCREENING', 'REJECTED', 'GHOSTED'],
  SCREENING: ['INTERVIEW', 'REJECTED', 'GHOSTED'],
  INTERVIEW: ['OFFER', 'REJECTED', 'GHOSTED'],
  OFFER: [],
  REJECTED: [],
  GHOSTED: ['SCREENING'],
};

export interface TransitionInput {
  cvVersion?: string;
  appliedDate?: string;
  interviewDateTime?: string;
  salaryOffer?: number;
  workMode?: WorkMode;
}

export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

// return pesan error, atau null kalau valid
export function validateTransition(
  app: Application,
  to: ApplicationStatus,
  input: TransitionInput,
): string | null {
  if (!canTransition(app.status, to)) return `Tidak boleh pindah dari ${app.status} ke ${to}`;
  if (to === 'APPLIED' && (!input.cvVersion?.trim() || !input.appliedDate))
    return 'cvVersion dan appliedDate wajib diisi';
  if (to === 'INTERVIEW' && !input.interviewDateTime)
    return 'Jadwal interview wajib diisi';
  if (to === 'OFFER' && (!input.salaryOffer || input.salaryOffer <= 0 || !input.workMode))
    return 'Gaji (> 0) dan mode kerja wajib diisi';
  return null;
}
export const ALL_STATUSES: ApplicationStatus[] = [
  'WISHLIST', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED',
];