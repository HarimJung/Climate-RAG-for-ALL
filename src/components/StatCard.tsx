interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: { direction: 'up' | 'down' | 'flat'; label: string };
  source?: string;
}

export function StatCard({ title, value, unit, trend, source }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[--border-card] bg-white p-6 transition-colors hover:shadow-md" style={{ boxShadow: 'var(--shadow-card)' }}>
      <p className="text-sm font-medium text-[--text-secondary]">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-3xl font-bold text-[--text-primary]">{value}</span>
        {unit && <span className="text-sm text-[--text-muted]">{unit}</span>}
      </div>
      {trend && (
        <p className={`mt-2 text-sm font-medium ${
          trend.direction === 'up' ? 'text-[--accent-positive]' :
          trend.direction === 'down' ? 'text-[--accent-negative]' :
          'text-[--text-secondary]'
        }`}>
          {trend.direction === 'up' ? '\u2191' : trend.direction === 'down' ? '\u2193' : '\u2192'}{' '}
          {trend.label}
        </p>
      )}
      {source && <p className="mt-2 text-xs text-[--text-muted]">Source: {source}</p>}
    </div>
  );
}
