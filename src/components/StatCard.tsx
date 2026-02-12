interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: { direction: 'up' | 'down' | 'flat'; label: string };
}

export function StatCard({ title, value, unit, trend }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition-colors hover:border-slate-700">
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-3xl font-bold text-white">{value}</span>
        {unit && <span className="text-sm text-slate-500">{unit}</span>}
      </div>
      {trend && (
        <p className={`mt-2 text-sm font-medium ${
          trend.direction === 'up' ? 'text-emerald-400' :
          trend.direction === 'down' ? 'text-red-400' :
          'text-slate-400'
        }`}>
          {trend.direction === 'up' ? '\u2191' : trend.direction === 'down' ? '\u2193' : '\u2192'}{' '}
          {trend.label}
        </p>
      )}
    </div>
  );
}
