import { useEffect, useState } from 'react';

const DURATION = 120; // 02:00

const QUESTIONS: string[] = [
  'Ceritakan tentang dirimu dan kenapa kamu tertarik magang di bidang IT.',
  'Jelaskan perbedaan useState dan useRef pada React.',
  'Ceritakan bug tersulit di proyekmu dan bagaimana kamu memperbaikinya.',
  'Apa itu REST API dan bagaimana frontend berkomunikasi dengannya?',
  'Bagaimana kamu menangani deadline ketika tugas kuliah dan proyek bentrok?',
  'Apa yang kamu ketahui tentang Git dan kenapa branch itu penting?',
];

function format(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function InterviewTimer() {
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [running, setRunning] = useState(false);

  // derived: timer otomatis berhenti saat habis
  const isRunning = running && secondsLeft > 0;

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(id); // cleanup saat unmount / pause
  }, [isRunning]);

  const reset = () => {
    setRunning(false);
    setSecondsLeft(DURATION);
  };

  const next = () => {
    setIndex((i) => (i + 1) % QUESTIONS.length);
    reset(); // otomatis kembali ke 02:00
  };

  return (
    <section className="card interview-timer">
      <h3>
        Latihan Interview{' '}
        <small>
          Soal {index + 1} / {QUESTIONS.length}
        </small>
      </h3>
      <p className="question">{QUESTIONS[index]}</p>
      <div className={`clock ${secondsLeft === 0 ? 'clock-over' : ''}`}>{format(secondsLeft)}</div>
      <div className="form-actions">
        <button onClick={() => setRunning((r) => !r)} disabled={secondsLeft === 0}>
          {isRunning ? 'Jeda' : 'Mulai'}
        </button>
        <button onClick={reset}>Reset</button>
        <button onClick={next}>Soal Berikutnya</button>
      </div>
    </section>
  );
}