'use client';

import { useState } from 'react';
import { updateStatus, deleteApplication } from '@/hooks/useApplications';

const STATUS_STYLES = {
  Pending:  'bg-amber-400/10 text-amber-400 border-amber-400/20',
  Approved: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  Rejected: 'bg-red-400/10 text-red-400 border-red-400/20',
};

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <dt className="text-xs text-white/30 uppercase tracking-wider font-medium">{label}</dt>
      <dd className="text-sm text-white/80 break-words">{value}</dd>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-CA', {
    weekday: 'short', month: 'short', day: 'numeric',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function ApplicationDrawer({ application: app, open, token, onClose, onStatusUpdate }) {
  const [note, setNote]         = useState('');
  const [loading, setLoading]   = useState(null); // 'approve' | 'reject' | 'delete'
  const [error, setError]       = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!app) return null;

  const handleStatus = async (status) => {
    setLoading(status === 'Approved' ? 'approve' : 'reject');
    setError('');
    try {
      await updateStatus(token, app.applicationId, app.type, status, note);
      setNote('');
      onStatusUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setLoading('delete');
    setError('');
    try {
      await deleteApplication(token, app.applicationId, app.type);
      onStatusUpdate();
    } catch (err) {
      setError(err.message);
      setLoading(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#0f1117] border-l border-white/8 z-50 flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-lg">{app.type === 'Performer' ? '🎵' : '🏪'}</span>
            <div>
              <h2 className="text-sm font-semibold text-white leading-tight">{app.applicantName}</h2>
              <p className="text-xs text-white/30 font-mono">{app.applicationId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[app.status] ?? ''}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {app.status}
            </span>
            <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Contact */}
          <section>
            <h3 className="text-xs font-semibold text-white/20 uppercase tracking-widest mb-4">Contact</h3>
            <dl className="space-y-4">
              <Field label="Email" value={app.email} />
              <Field label="Phone" value={app.phone} />
              <Field label="Address" value={app.address} />
            </dl>
          </section>

          <div className="border-t border-white/5" />

          {/* Type-specific details */}
          <section>
            <h3 className="text-xs font-semibold text-white/20 uppercase tracking-widest mb-4">
              {app.type === 'Performer' ? 'Performance Details' : 'Vendor Details'}
            </h3>
            <dl className="space-y-4">
              {app.type === 'Performer' ? (
                <>
                  <Field label="Band / Act name" value={app.bandName} />
                  <Field label="Genre" value={app.genre} />
                  <Field label="Duration" value={app.duration ? `${app.duration} min` : null} />
                  <Field label="Rate (1 hr)" value={app.rate1h} />
                  <Field label="Rate (1.5 hr)" value={app.rate15h} />
                  <Field label="YouTube" value={app.youtube} />
                  {app.availability?.length > 0 && (
                    <div className="space-y-1">
                      <dt className="text-xs text-white/30 uppercase tracking-wider font-medium">Availability</dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {app.availability.sort().map(d => (
                          <span key={d} className="px-2 py-0.5 bg-white/5 rounded-md text-xs text-white/60">
                            {new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Field label="Company" value={app.companyName} />
                  <Field label="Category" value={app.category} />
                  <Field label="Booth size" value={app.boothSize} />
                  <Field label="Products" value={app.productList} />
                  <Field label="Why a good fit" value={app.fitReason} />
                  <Field label="Cabin display" value={app.cabinDescription} />
                  <Field label="Past vendor" value={app.pastExperience === true ? 'Yes' : app.pastExperience === false ? 'No' : null} />
                </>
              )}
            </dl>
          </section>

          {/* Online presence */}
          {(app.website || app.instagram || app.facebook || app.twitter) && (
            <>
              <div className="border-t border-white/5" />
              <section>
                <h3 className="text-xs font-semibold text-white/20 uppercase tracking-widest mb-4">Online Presence</h3>
                <dl className="space-y-3">
                  {app.website && (
                    <div>
                      <dt className="text-xs text-white/30 mb-1">Website</dt>
                      <a href={app.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 transition-colors break-all">
                        {app.website}
                      </a>
                    </div>
                  )}
                  {app.instagram && (
                    <div>
                      <dt className="text-xs text-white/30 mb-1">Instagram</dt>
                      <a href={app.instagram} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-400 hover:text-pink-300 transition-colors">
                        {app.instagram}
                      </a>
                    </div>
                  )}
                  {app.facebook && (
                    <div>
                      <dt className="text-xs text-white/30 mb-1">Facebook</dt>
                      <a href={app.facebook} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                        {app.facebook}
                      </a>
                    </div>
                  )}
                  {app.twitter && (
                    <div>
                      <dt className="text-xs text-white/30 mb-1">X (Twitter)</dt>
                      <a href={app.twitter} target="_blank" rel="noopener noreferrer" className="text-sm text-white/60 hover:text-white transition-colors">
                        {app.twitter}
                      </a>
                    </div>
                  )}
                </dl>
              </section>
            </>
          )}

          {/* Description */}
          {app.description && (
            <>
              <div className="border-t border-white/5" />
              <section>
                <h3 className="text-xs font-semibold text-white/20 uppercase tracking-widest mb-3">Description</h3>
                <p className="text-sm text-white/60 leading-relaxed">{app.description}</p>
              </section>
            </>
          )}

          {/* Review note */}
          {app.reviewNote && (
            <>
              <div className="border-t border-white/5" />
              <section>
                <h3 className="text-xs font-semibold text-white/20 uppercase tracking-widest mb-3">Review Note</h3>
                <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4 text-sm text-white/60">
                  {app.reviewNote}
                </div>
              </section>
            </>
          )}

          {/* Timestamps */}
          <div className="border-t border-white/5" />
          <dl className="space-y-2">
            <Field label="Submitted" value={formatDate(app.submittedAt)} />
            <Field label="Last updated" value={formatDate(app.updatedAt)} />
          </dl>

        </div>

        {/* Action footer */}
        <div className="shrink-0 border-t border-white/5 px-6 py-4 space-y-3 bg-[#0f1117]">
          {error && (
            <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Note input */}
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note (optional — sent to applicant)"
            rows={2}
            className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 resize-none transition-colors"
          />

          {/* Status buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleStatus('Approved')}
              disabled={!!loading || app.status === 'Approved'}
              className="flex-1 bg-emerald-500/90 hover:bg-emerald-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading === 'approve' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Approving...
                </span>
              ) : '✓ Approve'}
            </button>
            <button
              onClick={() => handleStatus('Rejected')}
              disabled={!!loading || app.status === 'Rejected'}
              className="flex-1 bg-red-500/90 hover:bg-red-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading === 'reject' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Rejecting...
                </span>
              ) : '✕ Reject'}
            </button>
          </div>

          {/* Delete */}
          <button
            onClick={handleDelete}
            onBlur={() => setConfirmDelete(false)}
            disabled={loading === 'delete'}
            className={`w-full text-xs py-2 rounded-xl transition-all ${
              confirmDelete
                ? 'bg-red-900/40 border border-red-800/50 text-red-400'
                : 'text-white/20 hover:text-white/40'
            }`}
          >
            {loading === 'delete' ? 'Deleting...' : confirmDelete ? 'Click again to confirm delete' : 'Delete application'}
          </button>
        </div>
      </div>
    </>
  );
}