'use client';

export default function FilterBar({ filters, onChange }) {
  const set = (key, value) => onChange(prev => ({ ...prev, [key]: value }));

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          placeholder="Search name, email, genre..."
          className="w-full bg-white/[0.03] border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
        />
        {filters.search && (
          <button
            onClick={() => set('search', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Type filter */}
      <div className="flex items-center bg-white/[0.03] border border-white/8 rounded-xl p-1 gap-1">
        {['', 'Performer', 'Vendor'].map(type => (
          <button
            key={type}
            onClick={() => set('type', type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filters.type === type
                ? 'bg-white/10 text-white'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            {type || 'All types'}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex items-center bg-white/[0.03] border border-white/8 rounded-xl p-1 gap-1">
        {[
          { value: '',         label: 'All',      dot: 'bg-white/20' },
          { value: 'Pending',  label: 'Pending',  dot: 'bg-amber-400' },
          { value: 'Approved', label: 'Approved', dot: 'bg-emerald-400' },
          { value: 'Rejected', label: 'Rejected', dot: 'bg-red-400' },
        ].map(({ value, label, dot }) => (
          <button
            key={value}
            onClick={() => set('status', value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filters.status === value
                ? 'bg-white/10 text-white'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}