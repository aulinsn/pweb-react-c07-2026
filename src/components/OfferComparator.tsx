import { useState } from 'react';
import type { Application, WorkMode } from '../types';
import { scoreOffer, type OfferScore } from '../utils/offerScore';
import { skillMatch, type SkillMatchResult } from '../utils/skillMatch';

const MODE_VALUES: Record<WorkMode, number> = { Remote: 100, Hybrid: 75, Onsite: 50 };

interface ColumnProps {
  app: Application;
  score: OfferScore;
  match: SkillMatchResult;
  isBest: boolean;
}

function OfferColumn({ app, score, match, isBest }: ColumnProps) {
  return (
    <div className={`card offer-col ${isBest ? 'best' : ''}`}>
      <div className="job-head">
        <div>
          <strong>{app.company}</strong>
          <small>{app.role}</small>
        </div>
        {isBest && <span className="badge green">Rekomendasi Terbaik</span>}
      </div>
      <dl>
        <dt>Uang Saku / Bulan</dt>
        <dd>
          Rp {(app.salaryOffer ?? 0).toLocaleString('id-ID')} <em>{score.salaryPart.toFixed(1)} / 50</em>
        </dd>
        <dt>Mode Kerja</dt>
        <dd>
          {app.workMode} ({MODE_VALUES[app.workMode]}) <em>{score.modePart.toFixed(1)} / 25</em>
        </dd>
        <dt>Kecocokan Skill</dt>
        <dd>
          {match.score}% ({match.matched.length} dari {app.requiredSkills.length} skill){' '}
          <em>{score.skillPart.toFixed(1)} / 25</em>
        </dd>
      </dl>
      <div className="total">
        <small>TOTAL SKOR BERBOBOT</small>
        <strong>{score.total.toFixed(1)}</strong>
      </div>
    </div>
  );
}

export function OfferComparator({
  applications,
  kaptenSkills,
}: {
  applications: Application[];
  kaptenSkills: string[];
}) {
  const offers = applications.filter((a) => a.status === 'OFFER');
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');

  if (offers.length < 2) {
    return (
      <p className="state-msg">
        Offer Comparator butuh minimal 2 lamaran berstatus OFFER. Saat ini baru ada {offers.length}.
      </p>
    );
  }

  const a = offers.find((o) => o.id === idA) ?? offers[0];
  const b = offers.find((o) => o.id === idB) ?? offers[1] ?? offers[0];

  const handleSelectA = (val: string) => setIdA(val);
  const handleSelectB = (val: string) => setIdB(val);

  if (a.id === b.id) {
    return (
      <section>
        <div className="compare-header">
          <div>
            <h3>Bandingkan Offer Magang</h3>
            <p className="hint">Bobot penilaian: Uang Saku 50% • Mode Kerja 25% • Kecocokan Skill 25%</p>
          </div>
          <OfferSelectors offers={offers} aId={a.id} bId={b.id} onA={handleSelectA} onB={handleSelectB} />
        </div>
        <p className="state-msg">Pilih dua offer yang berbeda untuk membandingkan.</p>
      </section>
    );
  }

  const maxSalary = Math.max(a.salaryOffer ?? 0, b.salaryOffer ?? 0);
  const matchA = skillMatch(a.requiredSkills, kaptenSkills);
  const matchB = skillMatch(b.requiredSkills, kaptenSkills);
  const scoreA = scoreOffer(a.salaryOffer ?? 0, maxSalary, a.workMode, matchA.score);
  const scoreB = scoreOffer(b.salaryOffer ?? 0, maxSalary, b.workMode, matchB.score);
  const bestId = scoreA.total === scoreB.total ? null : scoreA.total > scoreB.total ? a.id : b.id;

  return (
    <section>
      <div className="compare-header">
        <div>
          <h3>Bandingkan Offer Magang</h3>
          <p className="hint">Bobot penilaian: Uang Saku 50% • Mode Kerja 25% • Kecocokan Skill 25%</p>
        </div>
        <OfferSelectors offers={offers} aId={a.id} bId={b.id} onA={handleSelectA} onB={handleSelectB} />
      </div>

      <div className="compare-grid">
        <OfferColumn app={a} score={scoreA} match={matchA} isBest={bestId === a.id} />
        <OfferColumn app={b} score={scoreB} match={matchB} isBest={bestId === b.id} />
      </div>
      {bestId === null && <p className="state-msg">Skor kedua offer seimbang.</p>}
    </section>
  );
}

interface SelectorsProps {
  offers: Application[];
  aId: string;
  bId: string;
  onA: (id: string) => void;
  onB: (id: string) => void;
}

function OfferSelectors({ offers, aId, bId, onA, onB }: SelectorsProps) {
  return (
    <div className="compare-selectors">
      <select value={aId} onChange={(e) => onA(e.target.value)}>
        {offers.map((o) => (
          <option key={o.id} value={o.id}>Offer A: {o.company}</option>
        ))}
      </select>
      <span className="vs-badge">vs</span>
      <select value={bId} onChange={(e) => onB(e.target.value)}>
        {offers.map((o) => (
          <option key={o.id} value={o.id}>Offer B: {o.company}</option>
        ))}
      </select>
    </div>
  );
}