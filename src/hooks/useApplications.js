'use client';

import { useMemo } from 'react';
import { useApplicationsContext } from '@/context/ApplicationsContext';

export function useApplications(filters) {
  const { performers, vendors, isLoading, error, refetch: refetchAll } = useApplicationsContext();

  // Client-side filtering
  const applications = useMemo(() => {
    let all = [...performers, ...vendors];

    if (filters.type === 'Performer') all = performers;
    if (filters.type === 'Vendor')    all = vendors;

    if (filters.status) {
      all = all.filter(a => a.status === filters.status);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      all = all.filter(a =>
        a.applicantName?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.genre?.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q) ||
        a.applicationId?.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    return all.sort((a, b) =>
      new Date(b.submittedAt) - new Date(a.submittedAt)
    );
  }, [performers, vendors, filters]);

  // Stats from raw unfiltered data
  const stats = useMemo(() => {
    const all = [...performers, ...vendors];
    return {
      total:      all.length,
      pending:    all.filter(a => a.status === 'Pending').length,
      approved:   all.filter(a => a.status === 'Approved').length,
      waitlisted:   all.filter(a => a.status === 'Waitlisted').length,
      performers: performers.length,
      vendors:    vendors.length,
    };
  }, [performers, vendors]);

  return { applications, stats, isLoading, error, refetch: refetchAll };
}

// ── Single application actions ────────────────────────────────────────────────

export async function updateStatus(token, applicationId, type, status, note) {
  let reviewedBy;
  try {
    reviewedBy = JSON.parse(atob(token.split('.')[1])).email;
  } catch {
    // leave undefined if token can't be decoded
  }

  const historyEntry = {
    status,
    timestamp: new Date().toISOString(),
    ...(reviewedBy ? { reviewedBy } : {}),
    ...(note ? { note } : {}),
  };

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${applicationId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type, status, ...(note ? { note } : {}), ...(reviewedBy ? { reviewedBy } : {}), historyEntry }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to update status');
  }
  return res.json();
}

export async function addNote(token, applicationId, type, text) {
  let author;
  try {
    author = JSON.parse(atob(token.split('.')[1])).email;
  } catch {}

  const noteEntry = {
    text,
    timestamp: new Date().toISOString(),
    ...(author ? { author } : {}),
  };

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${applicationId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type, noteEntry }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to save note');
  }
  return res.json();
}

function decodeEmail(token) {
  try { return JSON.parse(atob(token.split('.')[1])).email; }
  catch { return undefined; }
}

export async function addPerformerScheduleEntry(token, applicationId, scheduleEntry) {
  const scheduledBy = decodeEmail(token);
  const historyEntry = {
    action: 'Scheduled',
    stage: scheduleEntry.stage,
    date: scheduleEntry.date,
    startTime: scheduleEntry.startTime,
    endTime: scheduleEntry.endTime,
    timestamp: new Date().toISOString(),
    ...(scheduledBy ? { scheduledBy } : {}),
  };
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${applicationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ type: 'Performer', scheduleEntry, historyEntry }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to save schedule entry');
  }
  return res.json();
}

export async function removePerformerScheduleEntry(token, applicationId, scheduleEntries, removedEntry) {
  const scheduledBy = decodeEmail(token);
  const historyEntry = {
    action: 'Unscheduled',
    stage: removedEntry.stage,
    date: removedEntry.date,
    startTime: removedEntry.startTime,
    endTime: removedEntry.endTime,
    timestamp: new Date().toISOString(),
    ...(scheduledBy ? { scheduledBy } : {}),
  };
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${applicationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ type: 'Performer', scheduleEntries, historyEntry }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to remove schedule entry');
  }
  return res.json();
}

export async function deleteApplication(token, applicationId, type) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/applications/${applicationId}?type=${type}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to delete application');
  }
  return res.json();
}