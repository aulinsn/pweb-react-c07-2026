import type { Application } from '../types';
import { isGhostingRisk } from '../utils/ghosting';
import { skillMatch } from '../utils/skillMatch';

interface ApplicationCardProps {
  app: Application;
  kaptenSkills: string[];
  onSimulate: (id: string) => void;
  onOpen: (id: string) => void;
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

export function ApplicationCard({ app, kaptenSkills, onSimulate, onOpen }: ApplicationCardProps) {
  const match = skillMatch(app.requiredSkills, kaptenSkills);
  const done = app.checklist.filter((item) => item.done).length;
  const canSimulate = app.status === 'APPLIED' || app.status === 'SCREENING';

  return (
    <article className="card app-card">
      <div className="job-head">
        <div className="who">
          <div className="avatar" style={{ backgroundColor: getAvatarBg(app.company) }}>
            {getInitials(app.company)}
          </div>
          <div>
            <strong>{app.company}</strong>
            <small>{app.role} • {app.workMode}</small>
          </div>
        </div>
        <span className={`status status-${app.status.toLowerCase()}`}>{app.status}</span>
      </div>

      <div className="meta">
        <span>CV: {app.cvVersion ?? '-'}</span>
        <span>Checklist: {done}/{app.checklist.length}</span>
        <span>Match: {match.score}%</span>
      </div>

      {isGhostingRisk(app) && <span className="badge red">Rawan Ghosting</span>}

      <div className="form-actions">
        <button onClick={() => onOpen(app.id)}>Detail</button>
        {canSimulate && <button onClick={() => onSimulate(app.id)}>Simulasi +15 Hari</button>}
      </div>
    </article>
  );
}