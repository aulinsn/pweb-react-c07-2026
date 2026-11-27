import { useRef, useState, type FormEvent, type RefObject } from 'react';
import type { Application, WorkMode } from '../types';
import { isDuplicate, type NewApplicationInput } from '../utils/application';

type InitialStatus = 'WISHLIST' | 'APPLIED';
type FieldKey = 'company' | 'role' | 'skills' | 'cvVersion' | 'appliedDate';
type Errors = Partial<Record<FieldKey, string>>;

// urutan ini menentukan "input pertama yang error"
const FIELD_ORDER: FieldKey[] = ['company', 'role', 'skills', 'cvVersion', 'appliedDate'];

interface ApplicationFormProps {
  applications: Application[];
  onAdd: (input: NewApplicationInput) => void;
  onDone: () => void;
}

export function ApplicationForm({ applications, onAdd, onDone }: ApplicationFormProps) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [workMode, setWorkMode] = useState<WorkMode>('Remote');
  const [status, setStatus] = useState<InitialStatus>('WISHLIST');
  const [skillsText, setSkillsText] = useState('');
  const [cvVersion, setCvVersion] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const companyRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const skillsRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  const refs: Record<FieldKey, RefObject<HTMLInputElement | null>> = {
    company: companyRef,
    role: roleRef,
    skills: skillsRef,
    cvVersion: cvRef,
    appliedDate: dateRef,
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const rawSkills = skillsText.split(',').map((s) => s.trim()).filter((s) => s !== '');
    const skills = rawSkills.filter(
      (s, i) => rawSkills.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i,
    );

    const next: Errors = {};
    if (!company.trim()) next.company = 'Perusahaan wajib diisi';
    if (!role.trim()) next.role = 'Posisi wajib diisi';
    else if (company.trim() && isDuplicate(applications, company, role))
      next.company = 'Lamaran dengan perusahaan dan posisi ini sudah ada';
    if (skills.length === 0) next.skills = 'Isi minimal 1 skill (pisahkan dengan koma)';
    if (status === 'APPLIED') {
      if (!cvVersion.trim()) next.cvVersion = 'Versi CV wajib diisi';
      if (!appliedDate) next.appliedDate = 'Tanggal melamar wajib diisi';
    }

    setErrors(next);

    const firstError = FIELD_ORDER.find((key) => next[key] !== undefined);
    if (firstError) {
      refs[firstError].current?.focus(); // auto-focus ke input error pertama
      return;
    }

    onAdd({
      company,
      role,
      workMode,
      status,
      requiredSkills: skills,
      cvVersion: status === 'APPLIED' ? cvVersion.trim() : undefined,
      appliedDate: status === 'APPLIED' ? appliedDate : undefined,
    });
    onDone();
  };

  return (
    <form className="card app-form" onSubmit={handleSubmit} noValidate>
      <h2>Catat Lamaran</h2>

      <label>
        Perusahaan
        <input ref={companyRef} value={company} onChange={(e) => setCompany(e.target.value)} />
        {errors.company && <span className="error-text">{errors.company}</span>}
      </label>

      <label>
        Posisi / Role
        <input ref={roleRef} value={role} onChange={(e) => setRole(e.target.value)} />
        {errors.role && <span className="error-text">{errors.role}</span>}
      </label>

      <label>
        Mode Kerja
        <select value={workMode} onChange={(e) => setWorkMode(e.target.value as WorkMode)}>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Onsite">Onsite</option>
        </select>
      </label>

      <label>
        Status Awal
        <select value={status} onChange={(e) => setStatus(e.target.value as InitialStatus)}>
          <option value="WISHLIST">WISHLIST</option>
          <option value="APPLIED">APPLIED</option>
        </select>
      </label>

      <label>
        Required Skills (pisahkan dengan koma)
        <input
          ref={skillsRef}
          value={skillsText}
          onChange={(e) => setSkillsText(e.target.value)}
          placeholder="React, TypeScript, Docker"
        />
        {errors.skills && <span className="error-text">{errors.skills}</span>}
      </label>

      {status === 'APPLIED' && (
        <>
          <label>
            Versi CV
            <input
              ref={cvRef}
              value={cvVersion}
              onChange={(e) => setCvVersion(e.target.value)}
              placeholder="Kapten-CV-v2.pdf"
            />
            {errors.cvVersion && <span className="error-text">{errors.cvVersion}</span>}
          </label>
          <label>
            Tanggal Melamar
            <input
              ref={dateRef}
              type="date"
              value={appliedDate}
              onChange={(e) => setAppliedDate(e.target.value)}
            />
            {errors.appliedDate && <span className="error-text">{errors.appliedDate}</span>}
          </label>
        </>
      )}

      <div className="form-actions">
        <button type="submit">Simpan Lamaran</button>
        <button type="button" onClick={onDone}>Batal</button>
      </div>
    </form>
  );
}