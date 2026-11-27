import type { JobListing } from '../types';
import type { SkillMatchResult } from '../utils/skillMatch';

interface JobCardProps {
  job: JobListing;
  match: SkillMatchResult;
  alreadyApplied: boolean;
  onSave: (job: JobListing) => void;
}

const AVATAR_COLORS = ['#1e293b', '#0f766e', '#1e40af', '#6b21a8', '#831843', '#374151'];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getAvatarBg(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function matchLevel(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 70) return 'green';
  if (score >= 40) return 'yellow';
  return 'red';
}

export function JobCard({ job, match, alreadyApplied, onSave }: JobCardProps) {
  return (
    <article className="card job-card">
      <div className="job-head">
        <div className="who">
          <div className="avatar" style={{ backgroundColor: getAvatarBg(job.company_name) }}>
            {getInitials(job.company_name)}
          </div>
          <div>
            <strong>{job.company_name}</strong>
            <small>{job.candidate_required_location}</small>
          </div>
        </div>
        <span className={`badge ${matchLevel(match.score)}`}>{match.score}% Match</span>
      </div>
      <h3>{job.title}</h3>
      <div className="chips">
        {match.matched.map((s) => (
          <span key={s} className="chip matched">{s}</span>
        ))}
        {match.missing.map((s) => (
          <span key={s} className="chip missing">{s}</span>
        ))}
      </div>
      <div className="job-foot">
        <span>{job.salary || 'Gaji tidak disebutkan'}</span>
        <button disabled={alreadyApplied} onClick={() => onSave(job)}>
          {alreadyApplied ? 'Sudah Dilamar' : 'Simpan ke Wishlist'}
        </button>
      </div>
    </article>
  );
}