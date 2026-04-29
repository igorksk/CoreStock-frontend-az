interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: 'green' | 'blue' | 'yellow' | 'red';
}

export function KpiCard({ label, value, sub, accent }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value${accent ? ` text-${accent === 'green' ? 'success' : accent === 'red' ? 'danger' : accent === 'yellow' ? 'warning' : 'primary'}` : ''}`}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}
