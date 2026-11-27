import type { Application, ApplicationStatus } from '../types';
import { isGhostingRisk } from '../utils/ghosting';

const RESPONDED: ApplicationStatus[] = ['SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED'];
const INTERVIEWED: ApplicationStatus[] = ['INTERVIEW', 'OFFER'];
const ACTIVE: ApplicationStatus[] = ['APPLIED', 'SCREENING', 'INTERVIEW'];

const pct = (n: number, d: number): number => (d === 0 ? 0 : Math.round((n / d) * 100));

export function StatsCards({ applications }: { applications: Application[] }) {
  const total = applications.length;
  const active = applications.filter((a) => ACTIVE.includes(a.status)).length;
  const responded = applications.filter((a) => RESPONDED.includes(a.status)).length;
  const interviewed = applications.filter((a) => INTERVIEWED.includes(a.status)).length;
  const ghosting = applications.filter((a) => isGhostingRisk(a)).length;
  const offers = applications.filter((a) => a.status === 'OFFER').length;

  const cards: { label: string; value: string; sub: string }[] = [
    { label: 'Total Lamaran', value: String(total), sub: `${active} aktif di pipeline` },
    { label: 'Response Rate', value: `${pct(responded, total)}%`, sub: `${responded} dari ${total} diproses` },
    { label: 'Interview Rate', value: `${pct(interviewed, total)}%`, sub: `${interviewed} masuk wawancara` },
    { label: 'Rawan Ghosting', value: String(ghosting), sub: '> 14 hari tanpa kabar' },
    { label: 'Offer Diterima', value: String(offers), sub: 'Siap dibandingkan' },
  ];

  return (
    <div className="stats">
      {cards.map((c) => (
        <div key={c.label} className="card stat">
          <small>{c.label}</small>
          <strong>{c.value}</strong>
          <small>{c.sub}</small>
        </div>
      ))}
    </div>
  );
}