'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ApplicationTable from '@/components/ApplicationTable';
import FilterBar from '@/components/FilterBar';
import StatsBar from '@/components/StatsBar';
import ApplicationDrawer from '@/components/ApplicationDrawer';
import { useApplications } from '@/hooks/useApplications';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const router = useRouter();
  const { token, isLoading: authLoading, signOut } = useAuth();
  const [filters, setFilters] = useState({ type: '', status: '', search: '' });
  const [selectedApp, setSelectedApp] = useState<{ applicationId: string; type: string; [key: string]: unknown } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { applications, stats, isLoading, refetch } = useApplications(filters);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
    }
  }, [token, authLoading, router]);

  const handleSelect = useCallback((app: { applicationId: string; type: string; [key: string]: unknown }) => {
    setSelectedApp(app);
    setDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedApp(null), 300);
  }, []);

  const handleStatusUpdate = useCallback(() => {
    refetch();
    handleDrawerClose();
  }, [refetch, handleDrawerClose]);

  const handleApplicationUpdate = useCallback((updatedApp: { applicationId: string; type: string; [key: string]: unknown }) => {
    setSelectedApp(updatedApp);
    refetch();
  }, [refetch]);

  if (authLoading) return <LoadingScreen />;
  if (!token) return null;

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      {/* Top nav */}
      <nav className="border-b border-white/5 bg-[#0d0f14]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-400 mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-red-500 to-rose-700 flex items-center justify-center text-xs font-bold">
              🎄
            </div>
            <span className="font-semibold text-sm tracking-tight">OCM Portal</span>
            <span className="text-white/20 text-xs font-mono">2026</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/schedule" className="text-xs text-white/40 hover:text-white/70 transition-colors">Schedule</Link>
            <span className="text-white/15">|</span>
            <span className="text-xs text-white/30 font-mono">ocm_2026</span>
            <button
              onClick={signOut}
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-400 mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
            <p className="text-white/40 text-sm mt-1">
              Review and manage 2026 performer and vendor applications
            </p>
          </div>
        </div>

        {/* Stats */}
        <StatsBar stats={stats} isLoading={isLoading} />

        {/* Filters */}
        <FilterBar filters={filters} onChange={setFilters} />

        {/* Table */}
        <ApplicationTable
          applications={applications}
          isLoading={isLoading}
          onSelect={handleSelect}
          selectedId={selectedApp?.applicationId}
        />
      </div>

      {/* Detail drawer */}
      <ApplicationDrawer
        application={selectedApp}
        open={drawerOpen}
        token={token}
        onClose={handleDrawerClose}
        onStatusUpdate={handleStatusUpdate}
          onApplicationUpdate={handleApplicationUpdate}
      />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
        <span className="text-white/30 text-sm">Loading portal...</span>
      </div>
    </div>
  );
}