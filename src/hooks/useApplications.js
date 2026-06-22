'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.ottawachristmasmarket.com';

export function useApplications(token, filters) {
  const [{ performers, vendors, isLoading, error }, setState] = useState({
    performers: [],
    vendors: [],
    isLoading: true,
    error: null,
  });

  const fetchAll = useCallback(async () => {
    if (!token) return;
    // Yield before touching state so this is never a synchronous setState
    // call from within a useEffect body (React 19 compiler rule).
    await Promise.resolve();
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [pRes, vRes] = await Promise.all([
        fetch(`${API}/applications?type=Performer&limit=100`, { headers }),
        fetch(`${API}/applications?type=Vendor&limit=100`, { headers }),
      ]);

      if (!pRes.ok || !vRes.ok) throw new Error('Failed to fetch applications');

      const [pData, vData] = await Promise.all([pRes.json(), vRes.json()]);
      setState({
        performers: pData.items ?? [],
        vendors:    vData.items ?? [],
        isLoading:  false,
        error:      null,
      });
    } catch (err) {
      setState(s => ({ ...s, isLoading: false, error: err.message }));
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

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

  return { applications, stats, isLoading, error, refetch: fetchAll };
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