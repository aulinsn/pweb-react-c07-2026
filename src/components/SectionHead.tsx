interface SectionHeadProps {
  eyebrow: string;
  title: string;
}

export function SectionHead({ eyebrow, title }: SectionHeadProps) {
  return (
    <div className="section-head">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
    </div>
  );
}