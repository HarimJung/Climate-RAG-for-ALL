interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: { direction: 'up' | 'down' | 'flat'; label: string };
  source?: string;
}

export function StatCard({ title, value, unit, trend, source }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[--border-card] bg-white px-5 py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[--text-muted]">{title}</p>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-bold tracking-[-0.03em] text-[--text-primary]">{value}</span>
        {unit && <span className="text-[12px] text-[--text-muted]">{unit}</span>}
      </div>
      {trend && (
        <p className={`mt-1.5 text-[12px] font-medium ${
          trend.direction === 'up' ? 'text-[--accent-positive]' :
          trend.direction === 'down' ? 'text-[--accent-negative]' :
          'text-[--text-secondary]'
        }`}>
          {trend.direction === 'up' ? '\u2191' : trend.direction === 'down' ? '\u2193' : '\u2192'}{' '}
          {trend.label}
        </p>
      )}
      {source && <p className="mt-1.5 text-[11px] text-[--text-muted]">{source}</p>}
    </div>
  );
}
