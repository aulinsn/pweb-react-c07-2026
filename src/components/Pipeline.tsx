import { useState, type RefObject } from 'react';
import type { Application, ApplicationStatus } from '../types';
import type { NewApplicationInput } from '../utils/application';
import { isGhostingRisk } from '../utils/ghosting';
import { ALL_STATUSES } from '../utils/stateMachine';
import { ApplicationCard } from './ApplicationCard';
import { ApplicationForm } from './ApplicationForm';

type SortKey = 'latest' | 'interview' | 'offer';
type StatusFilter = 'ALL' | ApplicationStatus;

interface PipelineProps {
  applications: Application[];
  kaptenSkills: string[];
  onAdd: (input: NewApplicationInput) => void;
  onSimulate: (id: string) => void;
  onOpen: (id: string) => void;
  searchRef?: RefObject<HTMLInputElement | null>;
}

function sortApps(rows: Application[], sortBy: SortKey): Application[] {
  const copy = [...rows]; // jangan mutasi array asli, karena .sort() memutasi
  if (sortBy === 'interview') {
    const time = (a: Application): number =>
      a.status === 'INTERVIEW' && a.interviewDateTime
        ? new Date(a.interviewDateTime).getTime()
        : Number.POSITIVE_INFINITY;
    return copy.sort((a, b) => {
      const ta = time(a);
      const tb = time(b);
      return ta === tb ? 0 : ta < tb ? -1 : 1; // hindari Infinity - Infinity = NaN
    });
  }
  if (sortBy === 'offer') {
    return copy.sort((a, b) => (b.salaryOffer ?? 0) - (a.salaryOffer ?? 0));
  }
  return copy; // 'latest': lamaran baru selalu ditaruh di depan array
}

export function Pipeline({
  applications,
  kaptenSkills,
  onAdd,
  onSimulate,
  onOpen,
  searchRef,
}: PipelineProps) {
  const [showForm, setShowForm] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [onlyGhosting, setOnlyGhosting] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('latest');

  // Derived state: dihitung saat render, tidak disimpan di useState
  const q = keyword.trim().toLowerCase();
  const filtered = applications.filter(
    (a) =>
      (statusFilter === 'ALL' || a.status === statusFilter) &&
      (!onlyGhosting || isGhostingRisk(a)) &&
      (q === '' || a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)),
  );
  const visible = sortApps(filtered, sortBy);

  return (
    <section>
      <div className="toolbar">
        <input
          ref={searchRef}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Cari perusahaan atau posisi... (tekan /)"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="ALL">Semua Status</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}>
          <option value="latest">Terbaru</option>
          <option value="interview">Jadwal Interview Terdekat</option>
          <option value="offer">Offer Tertinggi</option>
        </select>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={onlyGhosting}
            onChange={(e) => setOnlyGhosting(e.target.checked)}
          />
          Hanya Rawan Ghosting
        </label>
        <button onClick={() => setShowForm((v) => !v)}>+ Catat Lamaran</button>
      </div>

      {showForm && (
        <ApplicationForm
          applications={applications}
          onAdd={onAdd}
          onDone={() => setShowForm(false)}
        />
      )}

      {applications.length === 0 && (
        <p className="state-msg">Belum ada lamaran. Simpan dari Eksplorasi atau catat manual.</p>
      )}
      {applications.length > 0 && visible.length === 0 && (
        <p className="state-msg">Tidak ada lamaran yang cocok dengan filter.</p>
      )}

      <div className="job-grid">
        {visible.map((app) => (
          <ApplicationCard
            key={app.id}
            app={app}
            kaptenSkills={kaptenSkills}
            onSimulate={onSimulate}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  );
}