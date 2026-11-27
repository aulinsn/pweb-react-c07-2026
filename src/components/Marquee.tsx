const TEXT = 'MENCARI MAGANG JADI LEBIH SIMPEL  |';
const ITEMS: number[] = [0, 1, 2, 3, 4, 5, 6, 7];

export function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {ITEMS.map((n) => (
          <span key={n}>{TEXT}</span>
        ))}
      </div>
    </div>
  );
}