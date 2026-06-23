import * as XLSX from "xlsx";

interface Application {
  applicationId?: string;
  applicantName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
  // Performer
  bandName?: string;
  genre?: string;
  duration?: string | number;
  rate1h?: string;
  rate15h?: string;
  youtube?: string;
  website?: string;
  instagram?: string;
  availability?: string[];
  scheduleEntries?: { date: string; stage: string; startTime: string; endTime: string }[];
  // Vendor
  companyName?: string;
  category?: string;
  boothSize?: string;
  productList?: string;
  fitReason?: string;
  cabinDescription?: string;
  pastExperience?: boolean;
  [key: string]: unknown;
}

function fmt12(time24: string): string {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatSchedule(entries?: Application["scheduleEntries"]): string {
  if (!entries?.length) return "";
  return entries
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .map(e => `${e.date} · ${e.stage} · ${fmt12(e.startTime)}–${fmt12(e.endTime)}`)
    .join("\n");
}

export function exportApplicationsToExcel(performers: Application[], vendors: Application[]): void {
  const wb = XLSX.utils.book_new();

  // ── Performers sheet ──────────────────────────────────────────────────────
  const performerRows = performers.map(p => ({
    "Application ID":   p.applicationId ?? "",
    "Name":             p.applicantName ?? "",
    "Band / Act":       p.bandName ?? "",
    "Email":            p.email ?? "",
    "Phone":            p.phone ?? "",
    "Genre":            p.genre ?? "",
    "Duration (min)":   p.duration ?? "",
    "Rate (1 hr)":      p.rate1h ?? "",
    "Rate (1.5 hr)":    p.rate15h ?? "",
    "YouTube":          p.youtube ?? "",
    "Website":          p.website ?? "",
    "Instagram":        p.instagram ?? "",
    "Availability":     (p.availability ?? []).sort().join(", "),
    "Scheduled":        formatSchedule(p.scheduleEntries),
    "Status":           p.status ?? "",
    "Reviewed By":      p.reviewedBy ?? "",
    "Review Note":      p.reviewNote ?? "",
    "Submitted":        formatDate(p.submittedAt),
  }));

  const performerSheet = XLSX.utils.json_to_sheet(performerRows);
  performerSheet["!cols"] = [
    { wch: 32 }, { wch: 22 }, { wch: 22 }, { wch: 28 }, { wch: 16 },
    { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 30 },
    { wch: 30 }, { wch: 24 }, { wch: 30 }, { wch: 40 }, { wch: 12 },
    { wch: 22 }, { wch: 30 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, performerSheet, "Performers");

  // ── Vendors sheet ─────────────────────────────────────────────────────────
  const vendorRows = vendors.map(v => ({
    "Application ID":   v.applicationId ?? "",
    "Name":             v.applicantName ?? "",
    "Company":          v.companyName ?? "",
    "Email":            v.email ?? "",
    "Phone":            v.phone ?? "",
    "Category":         v.category ?? "",
    "Booth Size":       v.boothSize ?? "",
    "Products":         v.productList ?? "",
    "Why a Good Fit":   v.fitReason ?? "",
    "Cabin Display":    v.cabinDescription ?? "",
    "Past Vendor":      v.pastExperience === true ? "Yes" : v.pastExperience === false ? "No" : "",
    "Website":          v.website ?? "",
    "Instagram":        v.instagram ?? "",
    "Status":           v.status ?? "",
    "Reviewed By":      v.reviewedBy ?? "",
    "Review Note":      v.reviewNote ?? "",
    "Submitted":        formatDate(v.submittedAt),
  }));

  const vendorSheet = XLSX.utils.json_to_sheet(vendorRows);
  vendorSheet["!cols"] = [
    { wch: 32 }, { wch: 22 }, { wch: 22 }, { wch: 28 }, { wch: 16 },
    { wch: 18 }, { wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 30 },
    { wch: 12 }, { wch: 30 }, { wch: 24 }, { wch: 12 }, { wch: 22 },
    { wch: 30 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, vendorSheet, "Vendors");

  XLSX.writeFile(wb, `OCM_Applications_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
