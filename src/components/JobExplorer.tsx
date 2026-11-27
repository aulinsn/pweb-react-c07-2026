import { useEffect, useMemo, useState, type RefObject } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { fetchFallback, fetchRemotive } from '../services/jobService';
import type { Application, JobListing } from '../types';
import { isDuplicate } from '../utils/application';
import { skillMatch } from '../utils/skillMatch';
import { JobCard } from './JobCard';

type Source = 'live' | 'local';
type SortBy = 'match' | 'default';

interface JobExplorerProps {
  applications: Application[];
  kaptenSkills: string[];
  onSave: (job: JobListing) => void;
  searchRef?: RefObject<HTMLInputElement | null>;
}

export function JobExplorer({ applications, kaptenSkills, onSave, searchRef }: JobExplorerProps) {
  const [source, setSource] = useState<Source>('live');
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('match');
  const debouncedKeyword = useDebounce(keyword, 400);

  useEffect(() => {
    const controller = new AbortController();
    const request = source === 'live' ? fetchRemotive : fetchFallback;

    request(controller.signal)
      .then((data) => {
        setJobs(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [source, reloadKey]);

  const retry = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  const useLocal = () => {
    setIsLoading(true);
    setError(null);
    setSource('local');
  };

  const changeSource = (next: Source) => {
    if (next === source) return;
    setIsLoading(true);
    setError(null);
    setSource(next);
  };

  // Derived state: dihitung ulang tiap render, tidak disimpan di useState
  const categories = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.category))).sort(),
    [jobs],
  );

  const visible = useMemo(() => {
    const q = debouncedKeyword.trim().toLowerCase();
    const rows = jobs
      .filter((j) => category === 'ALL' || j.category === category)
      .filter(
        (j) =>
          q === '' ||
          j.title.toLowerCase().includes(q) ||
          j.company_name.toLowerCase().includes(q),
      )
      .map((job) => ({ job, match: skillMatch(job.tags, kaptenSkills) }));
    if (sortBy === 'match') rows.sort((a, b) => b.match.score - a.match.score);
    return rows;
  }, [jobs, category, debouncedKeyword, sortBy, kaptenSkills]);

  return (
    <section className="explorer">
      <div className="toolbar">
        <input
          ref={searchRef}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Cari posisi atau perusahaan... (tekan /)"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="ALL">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
          <option value="match">Match Tertinggi</option>
          <option value="default">Urutan Asli</option>
        </select>
      </div>

      <div className="source-toggle">
        <label>
          <input type="radio" checked={source === 'live'} onChange={() => changeSource('live')} />
          Remotive API (Live)
        </label>
        <label>
          <input type="radio" checked={source === 'local'} onChange={() => changeSource('local')} />
          Dataset Magang ID (Lokal)
        </label>
      </div>

      {isLoading && <p className="state-msg">Memuat lowongan...</p>}

      {!isLoading && error && (
        <div className="state-msg error-box">
          <p>Gagal memuat: {error}</p>
          <button onClick={retry}>Coba Lagi</button>
          {source === 'live' && <button onClick={useLocal}>Pakai Fallback Lokal</button>}
        </div>
      )}

      {!isLoading && !error && visible.length === 0 && (
        <p className="state-msg">Tidak ada lowongan yang cocok.</p>
      )}

      {!isLoading && !error && visible.length > 0 && (
        <div className="job-grid">
          {visible.map(({ job, match }) => (
            <JobCard
              key={job.id}
              job={job}
              match={match}
              alreadyApplied={isDuplicate(applications, job.company_name, job.title)}
              onSave={onSave}
            />
          ))}
        </div>
      )}
    </section>
  );
}