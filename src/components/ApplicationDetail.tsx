import { useState } from 'react';
import type { Application, ApplicationStatus, WorkMode } from '../types';
import { TRANSITIONS, type TransitionInput } from '../utils/stateMachine';
import { skillMatch } from '../utils/skillMatch';
import { InterviewTimer } from './InterviewTimer';

interface ApplicationDetailProps {
  app: Application;
  kaptenSkills: string[];
  onClose: () => void;
  onChangeStatus: (id: string, to: ApplicationStatus, input: TransitionInput) => string | null;
  onSimulate: (id: string) => void;
  onAddChecklist: (id: string, text: string) => void;
  onToggleChecklist: (id: string, itemId: string) => void;
  onDeleteChecklist: (id: string, itemId: string) => void;
  onAddNote: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

const STAGES: { status: ApplicationStatus; label: string }[] = [
  { status: 'WISHLIST', label: '1. Wishlist' },
  { status: 'APPLIED', label: '2. Applied' },
  { status: 'SCREENING', label: '3. Screening' },
  { status: 'INTERVIEW', label: '4. Interview' },
  { status: 'OFFER', label: '5. Offer' },
];

function formatStamp(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function ApplicationDetail({
  app, kaptenSkills, onClose, onChangeStatus, onSimulate, onAddChecklist,
  onToggleChecklist, onDeleteChecklist, onAddNote, onDelete,
}: ApplicationDetailProps) {
  const options = TRANSITIONS[app.status];
  const [target, setTarget] = useState<ApplicationStatus | ''>('');
  const [cv, setCv] = useState(app.cvVersion ?? '');
  const [appliedDate, setAppliedDate] = useState(app.appliedDate ?? '');
  const [interview, setInterview] = useState(app.interviewDateTime ?? '');
  const [salary, setSalary] = useState(app.salaryOffer ? String(app.salaryOffer) : '');
  const [offerMode, setOfferMode] = useState<WorkMode>(app.workMode);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [checkText, setCheckText] = useState('');
  const [note, setNote] = useState('');

  // target hanya valid kalau termasuk tujuan sah dari status saat ini
  const effectiveTarget = options.find((o) => o === target);

  const match = skillMatch(app.requiredSkills, kaptenSkills);
  const done = app.checklist.filter((c) => c.done).length;
  const total = app.checklist.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const canSimulate = app.status === 'APPLIED' || app.status === 'SCREENING';

  const confirm = () => {
    if (!effectiveTarget) {
      setStatusError('Pilih status tujuan terlebih dahulu');
      return;
    }
    const input: TransitionInput = {
      cvVersion: cv,
      appliedDate,
      interviewDateTime: interview,
      salaryOffer: salary === '' ? undefined : Number(salary),
      workMode: offerMode,
    };
    const error = onChangeStatus(app.id, effectiveTarget, input);
    if (error) {
      setStatusError(error);
      return;
    }
    setStatusError(null);
    setTarget('');
  };

  const submitChecklist = () => {
    if (!checkText.trim()) return;
    onAddChecklist(app.id, checkText.trim());
    setCheckText('');
  };

  const submitNote = () => {
    if (!note.trim()) return;
    onAddNote(app.id, note.trim());
    setNote('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <h2>{app.role} — {app.company}</h2>
            <small>
              {app.workMode} • Match {match.score}% • CV: {app.cvVersion ?? '-'}
              {app.interviewDateTime && app.status === 'INTERVIEW'
                ? ` • Jadwal Interview: ${formatStamp(app.interviewDateTime)}`
                : ''}
            </small>
          </div>
          <div className="form-actions">
            <span className={`status status-${app.status.toLowerCase()}`}>• {app.status}</span>
            {canSimulate && (
              <button type="button" onClick={() => onSimulate(app.id)}>
                Simulasi +15 Hari
              </button>
            )}
            <button type="button" onClick={() => onDelete(app.id)}>Hapus</button>
            <button type="button" onClick={onClose}>Tutup</button>
          </div>
        </header>

        {/* Stepper Tahap Seleksi */}
        <section className="stepper-card">
          <h4>TAHAP SELEKSI</h4>
          <div className="stepper-track">
            {STAGES.map((s, idx) => {
              const stageIdx = STAGES.findIndex((x) => x.status === app.status);
              const isActive = app.status === s.status;
              const isPast = stageIdx > idx;
              return (
                <div
                  key={s.status}
                  className={`step-item ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}
                >
                  <span className="step-circle">{idx + 1}</span>
                  <span className="step-name">{s.label.split('. ')[1]}</span>
                </div>
              );
            })}
          </div>
          {(app.status === 'REJECTED' || app.status === 'GHOSTED') && (
            <div className="step-badge-extra">
              Status cabang aktif: <strong>{app.status}</strong>
            </div>
          )}
        </section>

        <div className="modal-body">
          <div>
            <section className="card">
              <h3>Pindahkan Status Ke:</h3>
              {options.length === 0 ? (
                <p>Status {app.status} bersifat final dan tidak bisa diubah lagi.</p>
              ) : (
                <div className="transition-form">
                  <div className="status-button-group">
                    {options.map((o) => (
                      <button
                        type="button"
                        key={o}
                        className={`status-choice-btn ${effectiveTarget === o ? 'active' : ''}`}
                        onClick={() => {
                          setTarget(o);
                          setStatusError(null);
                        }}
                      >
                        {o}
                      </button>
                    ))}
                  </div>

                  {effectiveTarget && (
                    <div className="transition-fields">
                      {effectiveTarget === 'APPLIED' && (
                        <>
                          <label>
                            Versi CV:
                            <input
                              value={cv}
                              onChange={(e) => setCv(e.target.value)}
                              placeholder="misal: Kapten-CV-v2.pdf"
                            />
                          </label>
                          <label>
                            Tanggal Melamar:
                            <input
                              type="date"
                              value={appliedDate}
                              onChange={(e) => setAppliedDate(e.target.value)}
                            />
                          </label>
                        </>
                      )}
                      {effectiveTarget === 'INTERVIEW' && (
                        <label>
                          Jadwal Interview:
                          <input
                            type="datetime-local"
                            value={interview}
                            onChange={(e) => setInterview(e.target.value)}
                          />
                        </label>
                      )}
                      {effectiveTarget === 'OFFER' && (
                        <>
                          <label>
                            Uang Saku / Gaji (Rp):
                            <input
                              type="number"
                              min={1}
                              value={salary}
                              onChange={(e) => setSalary(e.target.value)}
                              placeholder="misal: 5500000"
                            />
                          </label>
                          <label>
                            Mode Kerja:
                            <select
                              value={offerMode}
                              onChange={(e) => setOfferMode(e.target.value as WorkMode)}
                            >
                              <option value="Remote">Remote</option>
                              <option value="Hybrid">Hybrid</option>
                              <option value="Onsite">Onsite</option>
                            </select>
                          </label>
                        </>
                      )}
                      <button type="button" className="confirm-btn" onClick={confirm}>
                        Konfirmasi Pindah ke {effectiveTarget}
                      </button>
                    </div>
                  )}

                  {statusError && <p className="error-text">{statusError}</p>}
                </div>
              )}
            </section>

            <section className="card">
              <h3>
                Daftar Persiapan <small>{done} / {total} selesai</small>
              </h3>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${percent}%` }} />
              </div>
              <ul className="checklist">
                {app.checklist.map((item) => (
                  <li key={item.id}>
                    <label className={item.done ? 'done' : ''}>
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => onToggleChecklist(app.id, item.id)}
                      />
                      {item.text}
                    </label>
                    <button
                      type="button"
                      aria-label="Hapus item"
                      onClick={() => onDeleteChecklist(app.id, item.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <div className="form-actions">
                <input
                  value={checkText}
                  onChange={(e) => setCheckText(e.target.value)}
                  placeholder="Tambah tugas persiapan baru..."
                />
                <button type="button" onClick={submitChecklist}>Tambah</button>
              </div>
            </section>
          </div>

          <div>
            <InterviewTimer />

            <section className="card">
              <h3>Riwayat Aktivitas</h3>
              <div className="form-actions">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Catatan manual..."
                />
                <button type="button" onClick={submitNote}>Simpan</button>
              </div>
              <ul className="log">
                {[...app.activityLogs].reverse().map((log) => (
                  <li key={log.id}>
                    <small>{formatStamp(log.timestamp)}</small>
                    <div>{log.message}</div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}