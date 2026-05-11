'use client';

const stats_config = [
  { key: 'total',      label: 'Total',      color: 'text-white' },
  { key: 'pending',    label: 'Pending',    color: 'text-amber-400' },
  { key: 'approved',   label: 'Approved',   color: 'text-emerald-400' },
  { key: 'rejected',   label: 'Rejected',   color: 'text-red-400' },
  { key: 'performers', label: 'Performers', color: 'text-blue-400' },
  { key: 'vendors',    label: 'Vendors',    color: 'text-purple-400' },
];

export default function StatsBar({ stats, isLoading }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {stats_config.map(({ key, label, color }) => (
        <div
          key={key}
          className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3"
        >
          <div className={`text-2xl font-bold tabular-nums ${color} ${isLoading ? 'opacity-30' : ''}`}>
            {isLoading ? '—' : (stats?.[key] ?? 0)}
          </div>
          <div className="text-white/30 text-xs mt-0.5 font-medium">{label}</div>
        </div>
      ))}
    </div>
  );
}