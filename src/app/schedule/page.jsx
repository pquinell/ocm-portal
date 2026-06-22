'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useSchedule } from '@/hooks/useSchedule';
import { WEEKENDS, MARKET_DAYS, STAGES } from '@/lib/marketDates';

const START_HOUR  = 11; // 11 AM
const END_HOUR    = 23; // 11 PM
const HOUR_HEIGHT = 80; // px per hour
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

function fmt12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function timeToTop(time24) {
  if (!time24) return 0;
  const [h, m] = time24.split(':').map(Number);
  return ((h - START_HOUR) + m / 60) * HOUR_HEIGHT;
}

function timeToHeight(startTime, endTime) {
  if (!startTime || !endTime) return HOUR_HEIGHT;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return ((eh - sh) + (em - sm) / 60) * HOUR_HEIGHT;
}

const EMPTY_FORM = { performerName: '', startTime: '', endTime: '' };

export default function SchedulePage() {
  const router = useRouter();
  const { token, isLoading: authLoading, signOut } = useAuth();
  const { entries, addEntry, removeEntry } = useSchedule();

  const [selectedWeekend, setSelectedWeekend] = useState(0);
  const [selectedDate, setSelectedDate]       = useState(WEEKENDS[0].days[0]);
  const [addingFor, setAddingFor]             = useState(null);
  const [hoverInfo, setHoverInfo]             = useState(null); // { stage, y, time }
  const [form, setForm]                       = useState(EMPTY_FORM);
  const [formError, setFormError]             = useState('');
  const [performers, setPerformers]           = useState([]);

  useEffect(() => {
    if (!authLoading && !token) router.push('/login');
  }, [token, authLoading, router]);

  useEffect(() => {
    if (!token) return;
    const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.ottawachristmasmarket.com';
    fetch(`${API}/applications?type=Performer&limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setPerformers((data.items ?? []).filter(p => p.status !== 'Waitlisted')))
      .catch(() => {});
  }, [token]);

  if (authLoading) return <LoadingScreen />;
  if (!token) return null;

  const dayEntries = entries.filter(e => e.date === selectedDate);

  const handleWeekendSelect = (idx) => {
    setSelectedWeekend(idx);
    setSelectedDate(WEEKENDS[idx].days[0]);
    setAddingFor(null);
    setFormError('');
  };

  const handleDaySelect = (date) => {
    setSelectedDate(date);
    setAddingFor(null);
    setFormError('');
  };

  const handleAdd = (stage) => {
    if (!form.performerName.trim()) { setFormError('Performer name is required.'); return; }
    if (!form.startTime)            { setFormError('Start time is required.'); return; }
    if (!form.endTime)              { setFormError('End time is required.'); return; }
    if (form.startTime >= form.endTime) { setFormError('End time must be after start time.'); return; }

    addEntry({ performerName: form.performerName.trim(), date: selectedDate, stage, startTime: form.startTime, endTime: form.endTime });
    setForm(EMPTY_FORM);
    setFormError('');
    setAddingFor(null);
  };

  const openAddForm = (stage, startTime = '') => {
    setAddingFor(stage);
    setForm({ ...EMPTY_FORM, startTime });
    setFormError('');
    setHoverInfo(null);
  };

  const handleColumnMouseMove = (e, stage) => {
    if (addingFor === stage) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const rawY = e.clientY - rect.top;
    // Snap to nearest 30 minutes
    const snappedSlots = Math.round((rawY / HOUR_HEIGHT) * 2);
    const snappedY     = (snappedSlots / 2) * HOUR_HEIGHT;
    const absHours     = START_HOUR + snappedSlots / 2;
    const h = Math.floor(absHours);
    const m = (absHours % 1) * 60;
    if (h >= START_HOUR && h < END_HOUR) {
      const time = `${String(h).padStart(2, '0')}:${String(Math.round(m)).padStart(2, '0')}`;
      setHoverInfo({ stage, y: snappedY, time });
    }
  };

  const colClass = STAGES.length > 2 ? 'grid-cols-3' : 'grid-cols-2';

  const availablePerformers = performers.filter(p =>
    !p.availability?.length || p.availability.includes(selectedDate)
  );

  const selectedPerformer = availablePerformers.find(
    p => (p.bandName || p.applicantName) === form.performerName
  ) ?? null;

  const handleSelectPerformer = (p) => {
    const name = p.bandName || p.applicantName;
    setForm(f => {
      const next = { ...f, performerName: name };
      if (f.startTime && p.duration) {
        const [h, m] = f.startTime.split(':').map(Number);
        const totalMins = h * 60 + m + Number(p.duration);
        next.endTime = `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
      }
      return next;
    });
  };

  const closeModal = () => { setAddingFor(null); setFormError(''); };

  return (
    <>
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <nav className="border-b border-white/5 bg-[#0d0f14]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-400 mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-red-500 to-rose-700 flex items-center justify-center text-xs">
              🎄
            </div>
            <Link href="/" className="text-white/40 hover:text-white/70 text-sm transition-colors">← Applications</Link>
            <span className="text-white/15">/</span>
            <span className="font-semibold text-sm tracking-tight">Schedule</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/30 font-mono">ocm_2026</span>
            <button onClick={signOut} className="text-xs text-white/40 hover:text-white/70 transition-colors">Sign out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-400 mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performer Schedule</h1>
          <p className="text-white/40 text-sm mt-1">2026 Ottawa Christmas Market</p>
        </div>

        {/* Weekend tabs */}
        <div className="flex gap-2 flex-wrap">
          {WEEKENDS.map((w, i) => (
            <button
              key={w.label}
              onClick={() => handleWeekendSelect(i)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedWeekend === i
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Day tabs */}
        <div className="flex gap-2">
          {WEEKENDS[selectedWeekend].days.map(date => {
            const day   = MARKET_DAYS.find(d => d.date === date);
            const count = entries.filter(e => e.date === date).length;
            return (
              <button
                key={date}
                onClick={() => handleDaySelect(date)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                  selectedDate === date
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {day?.label}
                {count > 0 && (
                  <span className="w-5 h-5 rounded-full bg-white/10 text-white/50 text-xs flex items-center justify-center">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Stage headers */}
        <div className="flex gap-4">
          <div className="w-16 shrink-0" />
          <div className={`flex-1 grid ${colClass} gap-4`}>
            {STAGES.map(stage => (
              <h2 key={stage} className="text-xs font-semibold text-white/30 uppercase tracking-widest pb-2 border-b border-white/8">
                {stage}
              </h2>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex gap-4">
          {/* Time axis */}
          <div className="w-16 shrink-0 relative" style={{ height: TOTAL_HEIGHT }}>
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute w-full flex justify-end pr-3"
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
              >
                <span className="text-xs text-white/25 leading-none -translate-y-1/2 tabular-nums">
                  {fmt12(`${String(h).padStart(2, '0')}:00`)}
                </span>
              </div>
            ))}
          </div>

          {/* Stage columns */}
          <div className={`flex-1 grid ${colClass} gap-4`}>
            {STAGES.map(stage => {
              const stageEntries = dayEntries.filter(e => e.stage === stage);
              return (
                <div
                  key={stage}
                  className="relative"
                  style={{ height: TOTAL_HEIGHT }}
                  onMouseMove={e => handleColumnMouseMove(e, stage)}
                  onMouseLeave={() => setHoverInfo(null)}
                >
                  {/* Hour grid lines */}
                  {HOURS.map(h => (
                    <div
                      key={h}
                      className="absolute w-full border-t border-white/5"
                      style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                    />
                  ))}

                  {/* Performance blocks */}
                  {stageEntries.map(entry => {
                    const top    = timeToTop(entry.startTime);
                    const height = timeToHeight(entry.startTime, entry.endTime);
                    return (
                      <div
                        key={entry.id}
                        className="absolute inset-x-0 mx-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 overflow-hidden group cursor-default"
                        style={{ top: top + 1, height: Math.max(height - 2, 32) }}
                      >
                        <div className="flex items-start justify-between gap-1 h-full">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white/80 truncate leading-tight">{entry.performerName}</p>
                            <p className="text-xs text-white/40 mt-0.5 tabular-nums">
                              {fmt12(entry.startTime)} – {fmt12(entry.endTime)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeEntry(entry.id)}
                            title="Remove"
                            className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Snap indicator + add button */}
                  {hoverInfo?.stage === stage && addingFor !== stage && (
                    <>
                      <div
                        className="absolute inset-x-0 h-px bg-white/20 pointer-events-none z-10"
                        style={{ top: hoverInfo.y }}
                      />
                      <button
                        onClick={() => openAddForm(stage, hoverInfo.time)}
                        style={{ top: hoverInfo.y }}
                        className="absolute left-2 z-20 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 bg-white text-black rounded text-xs font-semibold shadow-lg whitespace-nowrap"
                      >
                        + {fmt12(hoverInfo.time)}
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>

    {/* Add performance modal */}
    {addingFor && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
        <div className="relative bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden" style={{width:'min(800px,calc(100vw - 2rem))'}}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div>
              <h2 className="text-sm font-semibold text-white">Add Performance</h2>
              <p className="text-xs text-white/40 mt-0.5">
                {addingFor} · {MARKET_DAYS.find(d => d.date === selectedDate)?.label}
              </p>
            </div>
            <button onClick={closeModal} className="text-white/30 hover:text-white/70 transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex" style={{maxHeight:'min(80vh,600px)',minHeight:'320px'}}>
            {/* Left column: performer list */}
            <div className="w-56 shrink-0 border-r border-white/5 px-4 py-5 flex flex-col gap-2 overflow-y-auto">
              <p className="text-xs text-white/30 uppercase tracking-wider font-medium mb-1 shrink-0">
                {availablePerformers.length > 0 ? 'Available on this day' : 'No performers for this date'}
              </p>
              {availablePerformers.map(p => {
                const name = p.bandName || p.applicantName;
                return (
                  <button
                    key={p.applicationId}
                    type="button"
                    onClick={() => handleSelectPerformer(p)}
                    className={`w-full shrink-0 text-left px-3 py-2 rounded-lg text-xs transition-all border ${
                      form.performerName === name
                        ? 'bg-white text-black border-white font-medium'
                        : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white/80'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>

            {/* Right column: form */}
            <div className="flex-1 min-w-0 px-6 py-5 space-y-4 overflow-y-auto">
              {selectedPerformer ? (
                <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 grid grid-cols-2 gap-3">
                  {selectedPerformer.genre && (
                    <div>
                      <p className="text-xs text-white/30 mb-0.5">Genre</p>
                      <p className="text-sm text-white/70">{selectedPerformer.genre}</p>
                    </div>
                  )}
                  {selectedPerformer.duration && (
                    <div>
                      <p className="text-xs text-white/30 mb-0.5">Preferred duration</p>
                      <p className="text-sm text-white/70">{selectedPerformer.duration} min</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-xs text-white/30">
                  Select a performer on the left, or type a name below
                </div>
              )}

              <input
                type="text"
                value={form.performerName}
                onChange={e => setForm(f => ({ ...f, performerName: e.target.value }))}
                placeholder="Or type a name manually"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all"
              />

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-white/30 mb-1.5">Start time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={e => {
                      const startTime = e.target.value;
                      setForm(f => {
                        const next = { ...f, startTime };
                        if (selectedPerformer?.duration && startTime) {
                          const [h, m] = startTime.split(':').map(Number);
                          const totalMins = h * 60 + m + Number(selectedPerformer.duration);
                          next.endTime = `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
                        }
                        return next;
                      });
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-white/30 mb-1.5">End time</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                  />
                </div>
              </div>

              {formError && <p className="text-xs text-red-400">{formError}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleAdd(addingFor)}
                  className="flex-1 bg-white text-black text-sm font-semibold py-2.5 rounded-xl hover:bg-white/90 transition-all"
                >
                  Add to schedule
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2.5 text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
    </div>
  );
}
