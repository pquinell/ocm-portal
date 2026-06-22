"use client";

import { useState } from "react";

const STATUS_STYLES = {
  Pending: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  Approved: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  Waitlisted: "bg-red-400/10 text-red-400 border-red-400/20",
};

const TYPE_STYLES = {
  Performer: "bg-blue-400/10 text-blue-400",
  Vendor: "bg-purple-400/10 text-purple-400",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 bg-white/5 rounded animate-pulse"
            style={{ width: `${60 + Math.random() * 40}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function ApplicationTable({
  applications,
  isLoading,
  onSelect,
  selectedId,
}) {
  const [sortKey, setSortKey] = useState("submittedAt");
  const [sortDir, setSortDir] = useState("desc");

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...(applications ?? [])].sort((a, b) => {
    let av = a[sortKey] ?? "";
    let bv = b[sortKey] ?? "";
    if (sortKey === "submittedAt") {
      av = new Date(av);
      bv = new Date(bv);
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span className="text-white/10 ml-1">↕</span>;
    return (
      <span className="text-white/60 ml-1">
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const Col = ({ col, children, className = "" }) => (
    <th
      onClick={() => handleSort(col)}
      className={`px-4 py-3 text-left text-xs font-medium text-white/30 uppercase tracking-wider cursor-pointer hover:text-white/60 transition-colors select-none ${className}`}
    >
      {children}
      <SortIcon col={col} />
    </th>
  );

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/5">
            <tr>
              <Col col="type">Type</Col>
              <Col col="applicantName">Applicant</Col>
              <Col col="email">Email</Col>
              <Col col="genre">Details</Col>
              <Col col="status">Status</Col>
              <Col col="submittedAt">Submitted</Col>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-16 text-center text-white/20 text-sm"
                >
                  No applications match your filters
                </td>
              </tr>
            ) : (
              sorted.map((app) => (
                <tr
                  key={app.applicationId}
                  onClick={() => onSelect(app)}
                  className={`cursor-pointer transition-colors hover:bg-white/[0.03] ${
                    selectedId === app.applicationId ? "bg-white/[0.05]" : ""
                  }`}
                >
                  {/* Type */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${TYPE_STYLES[app.type] ?? ""}`}
                    >
                      {app.type === "Performer" ? "🎵" : "🏪"} {app.type}
                    </span>
                  </td>

                  {/* Applicant */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs font-semibold text-white/50 shrink-0">
                        {app.applicantName?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {app.applicantName}
                        </div>
                        <div className="text-xs text-white/30 font-mono">
                          {app.applicationId?.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-white/50">{app.email}</span>
                  </td>

                  {/* Details */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-white/40">
                      {app.type === "Performer"
                        ? (app.genre ?? "—")
                        : (app.category ?? "—")}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[app.status] ?? ""}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {app.status}
                    </span>
                  </td>

                  {/* Submitted */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-white/30">
                      {formatDate(app.submittedAt)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      {!isLoading && sorted.length > 0 && (
        <div className="px-4 py-3 border-t border-white/5 text-xs text-white/20">
          {sorted.length} application{sorted.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
