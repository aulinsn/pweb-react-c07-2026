import type { Conflict } from '../utils/conflict';

function formatTime(iso: string | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = d.getDate();
  const month = months[d.getMonth()] ?? '';
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${month}, ${hours}:${minutes}`;
}

export function ConflictBanner({ conflicts }: { conflicts: Conflict[] }) {
  if (conflicts.length === 0) return null;
  return (
    <div className="conflict-banner" role="alert">
      <strong>Jadwal Interview Bentrok:</strong>
      <ul>
        {conflicts.map(({ a, b }) => (
          <li key={`${a.id}-${b.id}`}>
            {a.company} ({formatTime(a.interviewDateTime)}) dan {b.company} (
            {formatTime(b.interviewDateTime)}) berselisih kurang dari 60 menit.
          </li>
        ))}
      </ul>
    </div>
  );
}