import { useEffect, useState } from 'react';

interface UndoToastProps {
  company: string;
  onUndo: () => void;
}

export function UndoToast({ company, onUndo }: UndoToastProps) {
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeLeft((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="toast" role="status">
      <span>
        Lamaran <strong>{company}</strong> telah dihapus.
      </span>
      <button onClick={onUndo}>Undo ({timeLeft}d)</button>
    </div>
  );
}