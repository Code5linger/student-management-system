const STATUS_STYLES: Record<string, string> = {
  ENROLLED: 'bg-brand/10 text-brand-dark',
  DEFERRED: 'bg-gold/15 text-gold',
  WITHDRAWN: 'bg-rust/10 text-rust',
  COMPLETED: 'bg-ink/10 text-ink/70',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`badge ${STATUS_STYLES[status] ?? 'bg-ink/10 text-ink/70'}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function ClassificationBadge({
  classification,
}: {
  classification: string;
}) {
  const styles: Record<string, string> = {
    Distinction: 'bg-brand/10 text-brand-dark',
    Merit: 'bg-gold/15 text-gold',
    Pass: 'bg-ink/10 text-ink/70',
    Fail: 'bg-rust/10 text-rust',
  };
  return (
    <span className={`badge ${styles[classification] ?? ''}`}>
      {classification}
    </span>
  );
}

export function OverdueBadge() {
  return <span className="badge bg-rust text-white">Overdue</span>;
}

export function LateBadge() {
  return <span className="badge bg-gold/20 text-gold">Late</span>;
}
