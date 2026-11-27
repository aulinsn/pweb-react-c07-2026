import type { JobListing } from '../types';

const REMOTIVE_URL = 'https://remotive.com/api/remote-jobs?category=software-dev&limit=30';

type JobsPayload = JobListing[] | { jobs: JobListing[] };

function extractJobs(data: JobsPayload): JobListing[] {
  return Array.isArray(data) ? data : data.jobs;
}

export async function fetchRemotive(signal: AbortSignal): Promise<JobListing[]> {
  const res = await fetch(REMOTIVE_URL, { signal });
  if (!res.ok) throw new Error(`Gagal memuat (HTTP ${res.status})`);
  return extractJobs((await res.json()) as JobsPayload);
}

export async function fetchFallback(signal: AbortSignal): Promise<JobListing[]> {
  try {
    const res = await fetch('/magang-fallback.json', { signal });
    if (!res.ok) throw new Error(`Gagal memuat fallback (HTTP ${res.status})`);
    return extractJobs((await res.json()) as JobsPayload);
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    // Jika DevTools Offline memblokir fetch ke file publik lokal, fallback ke static data
    const fallbackModule = await import('../../public/magang-fallback.json');
    return extractJobs(fallbackModule.default as JobsPayload);
  }
}