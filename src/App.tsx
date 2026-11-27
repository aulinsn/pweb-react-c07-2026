import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Download, Moon, Sun, Upload } from 'lucide-react';
import { ApplicationDetail } from './components/ApplicationDetail';
import { ConflictBanner } from './components/ConflictBanner';
import { Hero } from './components/Hero';
import { JobExplorer } from './components/JobExplorer';
import { Marquee } from './components/Marquee';
import { OfferComparator } from './components/OfferComparator';
import { Pipeline } from './components/Pipeline';
import { SectionHead } from './components/SectionHead';
import { SkillProfile } from './components/SkillProfile';
import { StatsCards } from './components/StatsCards';
import { UndoToast } from './components/UndoToast';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Application, ApplicationStatus, JobListing } from './types';
import {
  createApplication,
  createLog,
  isDuplicate,
  parseWorkMode,
  type NewApplicationInput,
} from './utils/application';
import { findConflicts } from './utils/conflict';
import { validateTransition, type TransitionInput } from './utils/stateMachine';

type Tab = 'explore' | 'pipeline' | 'compare';
type Theme = 'light' | 'dark';

interface PendingDelete {
  app: Application;
  index: number;
}

const DEFAULT_SKILLS: string[] = ['React', 'TypeScript', 'CSS'];
const DAY_MS = 24 * 60 * 60 * 1000;
const UNDO_MS = 5000;

function describeTransition(to: ApplicationStatus, input: TransitionInput): string {
  if (to === 'APPLIED') return `Pindah ke APPLIED (CV: ${input.cvVersion?.trim() ?? '-'})`;
  if (to === 'INTERVIEW') return `Pindah ke INTERVIEW (jadwal ${input.interviewDateTime ?? '-'})`;
  if (to === 'OFFER')
    return `Pindah ke OFFER (Rp ${(input.salaryOffer ?? 0).toLocaleString('id-ID')}, ${input.workMode ?? '-'})`;
  return `Pindah ke ${to}`;
}

export default function App() {
  const [applications, setApplications] = useLocalStorage<Application[]>('applications', []);
  const [kaptenSkills, setKaptenSkills] = useLocalStorage<string[]>('kaptenSkills', DEFAULT_SKILLS);
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'light');
  const [tab, setTab] = useState<Tab>('explore');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const undoTimerRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Bonus: Keyboard shortcut "/" untuk fokus search bar via useRef
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // sinkronkan atribut data-theme ke root HTML
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // bersihkan timer saat App di-unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current !== null) window.clearTimeout(undoTimerRef.current);
    };
  }, []);

  // Derived state: dari SELURUH data, bukan hasil filter
  const conflicts = findConflicts(applications);
  const selected = applications.find((a) => a.id === selectedId);

  const updateApplication = (id: string, fn: (a: Application) => Application) =>
    setApplications((prev) => prev.map((a) => (a.id === id ? fn(a) : a)));

  const addSkill = (skill: string) => setKaptenSkills((prev) => [...prev, skill]);
  const removeSkill = (skill: string) =>
    setKaptenSkills((prev) => prev.filter((s) => s !== skill));

  const addApplication = (input: NewApplicationInput) => {
    setApplications((prev) =>
      isDuplicate(prev, input.company, input.role) ? prev : [createApplication(input), ...prev],
    );
  };

  const saveToWishlist = (job: JobListing) => {
    addApplication({
      company: job.company_name,
      role: job.title,
      workMode: parseWorkMode(job.candidate_required_location),
      status: 'WISHLIST',
      requiredSkills: job.tags,
    });
  };

  const simulateGhosting = (id: string) => {
    updateApplication(id, (a) => {
      if (a.status !== 'APPLIED' && a.status !== 'SCREENING') return a;
      const shifted = new Date(new Date(a.lastUpdatedAt).getTime() - 15 * DAY_MS).toISOString();
      return {
        ...a,
        lastUpdatedAt: shifted,
        activityLogs: [...a.activityLogs, createLog('Simulasi +15 hari (uji ghosting)')],
      };
    });
  };

  const changeStatus = (id: string, to: ApplicationStatus, input: TransitionInput): string | null => {
    const target = applications.find((a) => a.id === id);
    if (!target) return 'Lamaran tidak ditemukan';
    const error = validateTransition(target, to, input);
    if (error) return error;

    updateApplication(id, (a) => {
      let patch: Partial<Application> = {};
      if (to === 'APPLIED') patch = { cvVersion: input.cvVersion?.trim(), appliedDate: input.appliedDate };
      if (to === 'INTERVIEW') patch = { interviewDateTime: input.interviewDateTime };
      if (to === 'OFFER') patch = { salaryOffer: input.salaryOffer, workMode: input.workMode ?? a.workMode };
      return {
        ...a,
        ...patch,
        status: to,
        lastUpdatedAt: new Date().toISOString(),
        activityLogs: [...a.activityLogs, createLog(describeTransition(to, input))],
      };
    });
    return null;
  };

  // Checklist bersarang: semua immutable (spread / map / filter)
  const addChecklist = (id: string, text: string) =>
    updateApplication(id, (a) => ({
      ...a,
      checklist: [...a.checklist, { id: crypto.randomUUID(), text, done: false }],
    }));

  const toggleChecklist = (id: string, itemId: string) =>
    updateApplication(id, (a) => ({
      ...a,
      checklist: a.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)),
    }));

  const deleteChecklist = (id: string, itemId: string) =>
    updateApplication(id, (a) => ({
      ...a,
      checklist: a.checklist.filter((c) => c.id !== itemId),
    }));

  const addNote = (id: string, text: string) =>
    updateApplication(id, (a) => ({
      ...a,
      activityLogs: [...a.activityLogs, createLog(`Catatan: ${text}`)],
    }));

  // Undo Delete (5 detik) dengan timer di useRef
  const deleteApplication = (id: string) => {
    const index = applications.findIndex((a) => a.id === id);
    if (index === -1) return;
    const removed = applications[index];

    setApplications((prev) => prev.filter((a) => a.id !== id));
    setSelectedId(null);

    // hapus 2x berturut-turut: bersihkan timer lama dulu
    if (undoTimerRef.current !== null) window.clearTimeout(undoTimerRef.current);

    setPendingDelete({ app: removed, index });
    undoTimerRef.current = window.setTimeout(() => {
      setPendingDelete(null);
      undoTimerRef.current = null;
    }, UNDO_MS);
  };

  const undoDelete = () => {
    if (!pendingDelete) return;
    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    const { app, index } = pendingDelete;
    setApplications((prev) =>
      prev.some((a) => a.id === app.id)
        ? prev
        : [...prev.slice(0, index), app, ...prev.slice(index)],
    );
    setPendingDelete(null);
  };

  // Bonus: Export & Import backup JSON
  const handleExportBackup = () => {
    const data = JSON.stringify({ applications, kaptenSkills, exportDate: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `magang-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.applications)) setApplications(parsed.applications);
        if (Array.isArray(parsed.kaptenSkills)) setKaptenSkills(parsed.kaptenSkills);
      } catch {
        alert('File backup JSON tidak valid');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="wordmark">Aku Mw Magang<span>.</span></h1>
        <nav>
          <button className={tab === 'explore' ? 'active' : ''} onClick={() => setTab('explore')}>
            Eksplorasi Lowongan
          </button>
          <button className={tab === 'pipeline' ? 'active' : ''} onClick={() => setTab('pipeline')}>
            Pipeline Lamaran ({applications.length})
          </button>
          <button className={tab === 'compare' ? 'active' : ''} onClick={() => setTab('compare')}>
            Bandingkan Offer ({applications.filter((a) => a.status === 'OFFER').length})
          </button>
        </nav>
        <div className="topbar-actions">
          <input
            type="file"
            ref={importFileRef}
            onChange={handleImportBackup}
            accept=".json"
            style={{ display: 'none' }}
          />
          <button
            className="topbar-btn"
            title="Import Backup JSON"
            onClick={() => importFileRef.current?.click()}
          >
            <Upload size={14} style={{ marginRight: 4 }} /> Import
          </button>
          <button
            className="topbar-btn"
            title="Export Backup JSON"
            onClick={handleExportBackup}
          >
            <Download size={14} style={{ marginRight: 4 }} /> Export
          </button>
          <button
            className="icon-btn"
            aria-label="Ganti tema"
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      <ConflictBanner conflicts={conflicts} />

      {tab === 'explore' && <Hero />}
      <Marquee />

      <StatsCards applications={applications} />

      <main id="konten">
        {tab === 'explore' && (
          <>
            <SectionHead
              eyebrow="Welcome to Aku Mw Magang"
              title="Untuk yang kewalahan, bingung strategi, dan terobsesi magang."
            />
            <div className="explore-layout">
              <SkillProfile skills={kaptenSkills} onAdd={addSkill} onRemove={removeSkill} />
              <JobExplorer
                applications={applications}
                kaptenSkills={kaptenSkills}
                onSave={saveToWishlist}
                searchRef={searchInputRef}
              />
            </div>
          </>
        )}

        {tab === 'pipeline' && (
          <>
            <SectionHead eyebrow="War room" title="Pantau semua lamaranmu di satu tempat." />
            <Pipeline
              applications={applications}
              kaptenSkills={kaptenSkills}
              onAdd={addApplication}
              onSimulate={simulateGhosting}
              onOpen={setSelectedId}
              searchRef={searchInputRef}
            />
          </>
        )}

        {tab === 'compare' && (
          <>
            <SectionHead eyebrow="Offer comparator" title="Pilih tawaran terbaik secara objektif." />
            <OfferComparator applications={applications} kaptenSkills={kaptenSkills} />
          </>
        )}
      </main>

      {selected && (
        <ApplicationDetail
          key={selected.id}
          app={selected}
          kaptenSkills={kaptenSkills}
          onClose={() => setSelectedId(null)}
          onChangeStatus={changeStatus}
          onSimulate={simulateGhosting}
          onAddChecklist={addChecklist}
          onToggleChecklist={toggleChecklist}
          onDeleteChecklist={deleteChecklist}
          onAddNote={addNote}
          onDelete={deleteApplication}
        />
      )}

      {pendingDelete && (
        <UndoToast
          key={pendingDelete.app.id}
          company={pendingDelete.app.company}
          onUndo={undoDelete}
        />
      )}
    </div>
  );
}