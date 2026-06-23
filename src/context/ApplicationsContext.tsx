"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.ottawachristmasmarket.com";

interface Application {
  applicationId: string;
  type: string;
  [key: string]: unknown;
}

interface ApplicationsContextValue {
  performers: Application[];
  vendors: Application[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updatePerformer: (applicationId: string, changes: Partial<Application>) => void;
}

const ApplicationsContext = createContext<ApplicationsContextValue | null>(null);

export function ApplicationsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();

  const [{ performers, vendors, isLoading, error }, setState] = useState<{
    performers: Application[];
    vendors: Application[];
    isLoading: boolean;
    error: string | null;
  }>({
    performers: [],
    vendors: [],
    isLoading: false,
    error: null,
  });

  const fetchAll = useCallback(async () => {
    if (!token) return;
    await Promise.resolve();
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const headers = { Authorization: `Bearer ${token}` };

      async function fetchAllPages(type: string): Promise<Application[]> {
        const items: Application[] = [];
        let lastKey: string | undefined;
        do {
          const url = `${API}/applications?type=${type}&limit=100${lastKey ? `&lastKey=${encodeURIComponent(lastKey)}` : ""}`;
          const res = await fetch(url, { headers });
          if (!res.ok) throw new Error(`Failed to fetch ${type} applications`);
          const data = await res.json();
          items.push(...(data.items ?? []));
          lastKey = data.nextKey;
        } while (lastKey);
        return items;
      }

      const [performers, vendors] = await Promise.all([
        fetchAllPages("Performer"),
        fetchAllPages("Vendor"),
      ]);
      setState({ performers, vendors, isLoading: false, error: null });
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false, error: (err as Error).message }));
    }
  }, [token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updatePerformer = useCallback((applicationId: string, changes: Partial<Application>) => {
    setState((s) => ({
      ...s,
      performers: s.performers.map((p) =>
        p.applicationId === applicationId ? { ...p, ...changes } : p
      ),
    }));
  }, []);

  return (
    <ApplicationsContext.Provider value={{ performers, vendors, isLoading, error, refetch: fetchAll, updatePerformer }}>
      {children}
    </ApplicationsContext.Provider>
  );
}

export function useApplicationsContext(): ApplicationsContextValue {
  const ctx = useContext(ApplicationsContext);
  if (!ctx) throw new Error("useApplicationsContext must be used within ApplicationsProvider");
  return ctx;
}
