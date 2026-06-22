'use client';

import { useState, useCallback } from 'react';

const KEY = 'ocm_schedule_2026';

function loadEntries() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
  catch { return []; }
}

function persist(entries) {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function useSchedule() {
  const [entries, setEntries] = useState(loadEntries);

  const addEntry = useCallback((entry) => {
    setEntries(prev => {
      const next = [...prev, { ...entry, id: crypto.randomUUID() }];
      persist(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((id) => {
    setEntries(prev => {
      const next = prev.filter(e => e.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const updateEntry = useCallback((id, changes) => {
    setEntries(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...changes } : e);
      persist(next);
      return next;
    });
  }, []);

  return { entries, addEntry, removeEntry, updateEntry };
}
