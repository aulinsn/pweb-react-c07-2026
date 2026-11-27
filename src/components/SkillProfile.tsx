import { useState, type ChangeEvent, type FormEvent } from 'react';

interface SkillProfileProps {
  skills: string[];
  onAdd: (skill: string) => void;
  onRemove: (skill: string) => void;
}

export function SkillProfile({ skills, onAdd, onRemove }: SkillProfileProps) {
  const [text, setText] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const skill = text.trim();
    if (!skill) {
      setMessage('Skill tidak boleh kosong');
      return;
    }
    if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      setMessage('Skill sudah ada');
      return;
    }
    onAdd(skill);
    setText('');
    setMessage(null);
  };

  return (
    <aside className="card skill-profile">
      <h2>Profil Skill Kapten</h2>
      <form onSubmit={handleSubmit}>
        <input
          value={text}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
          placeholder="Tambah skill..."
        />
        <button type="submit">Tambah</button>
      </form>
      {message && <p className="error-text">{message}</p>}
      <div className="chips">
        {skills.map((skill) => (
          <span key={skill} className="chip">
            {skill}
            <button type="button" aria-label={`Hapus ${skill}`} onClick={() => onRemove(skill)}>
              ×
            </button>
          </span>
        ))}
      </div>
    </aside>
  );
}