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
      const [pRes, vRes] = await Promise.all([
        fetch(`${API}/applications?type=Performer&limit=100`, { headers }),
        fetch(`${API}/applications?type=Vendor&limit=100`, { headers }),
      ]);
      if (!pRes.ok || !vRes.ok) throw new Error("Failed to fetch applications");
      const [pData, vData] = await Promise.all([pRes.json(), vRes.json()]);
      setState({
        performers: pData.items ?? [],
        vendors: vData.items ?? [],
        isLoading: false,
        error: null,
      });
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
