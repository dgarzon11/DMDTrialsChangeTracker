"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Study, STATUS_GROUPS, STATUS_GROUP_COLORS } from "@/lib/data";

interface Props {
  studies: Study[];
  onClose: () => void;
  onOpenStudy: (nctId: string) => void;
  title?: string;
}

const STATUS_ORDER = ["Active", "Planned", "Closed", "Unknown"] as const;

type SortField = "NCTId" | "status" | "BriefTitle" | "LeadSponsorName" | "Phase" | "EnrollmentCount" | "StartDate" | "CompletionDate";
type SortDir = "asc" | "desc";

/** Format YYYY-MM-DD → MMM YYYY (e.g. "Jan 2024"), returns "—" if empty */
function highlight(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#FFF3B8] text-[#0B3D52] rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function SponsorAvatar({ name }: { name: string }) {
  if (!name) return null;
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return (
    <span
      className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[7px] font-bold text-white"
      style={{ background: `hsl(${hue}, 45%, 55%)` }}
    >
      {initials}
    </span>
  );
}

const ICON_PROPS = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "10",
  height: "10",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "opacity-50",
};

function fmtDate(d: string): string {
  if (!d) return "—";
  const parts = d.split("-");
  if (parts.length < 2) return d;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = months[parseInt(parts[1], 10) - 1] ?? "";
  return `${month} ${parts[0]}`;
}

export default function TrialsModal({ studies, onClose, onOpenStudy, title = "All DMD Clinical Trials" }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("StartDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const statusGroups = useMemo(() => {
    const counts: Record<string, number> = { Active: 0, Planned: 0, Closed: 0, Unknown: 0 };
    studies.forEach((s) => {
      const g = STATUS_GROUPS[s.OverallStatus] ?? "Unknown";
      counts[g] = (counts[g] || 0) + 1;
    });
    return counts;
  }, [studies]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return studies.filter((s) => {
      const matchGroup = statusFilter === "all" || (STATUS_GROUPS[s.OverallStatus] ?? "Unknown") === statusFilter;
      const matchQ = !q || s.NCTId.toLowerCase().includes(q) || s.BriefTitle.toLowerCase().includes(q) || s.LeadSponsorName.toLowerCase().includes(q);
      return matchGroup && matchQ;
    });
  }, [studies, query, statusFilter]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let av: string, bv: string;
      if (sortField === "status") {
        av = (STATUS_GROUPS[a.OverallStatus] ?? "Unknown") + a.OverallStatus;
        bv = (STATUS_GROUPS[b.OverallStatus] ?? "Unknown") + b.OverallStatus;
      } else if (sortField === "EnrollmentCount") {
        return ((parseInt(a.EnrollmentCount) || 0) - (parseInt(b.EnrollmentCount) || 0)) * dir;
      } else {
        av = (a[sortField] ?? "").toLowerCase();
        bv = (b[sortField] ?? "").toLowerCase();
      }
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  }, [filtered, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return (
      <svg className="opacity-30 group-hover/th:opacity-60 transition-opacity" xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12l7-7 7 7"/>
      </svg>
    );
    return (
      <svg className="opacity-90" xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {sortDir === "asc"
          ? <path d="M12 5v14M5 12l7-7 7 7"/>
          : <path d="M12 19V5M5 12l7 7 7-7"/>}
      </svg>
    );
  }

  const thClass = "flex items-center gap-1 cursor-pointer select-none group/th hover:text-[#1B6B8A] transition-colors";

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-6"
        onClick={onClose}
      >
        {/* Panel */}
        <motion.div
          key="panel"
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl border border-[#DDE8EC] w-full max-w-6xl max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEF4F6] flex-shrink-0">
            <div>
              <h2 className="text-base font-bold text-[#0B3D52]">{title}</h2>
              <p className="text-xs text-[#6B8A96] mt-0.5">{sorted.length} of {studies.length} trials</p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F2F6F8] text-[#6B8A96] hover:text-[#0B3D52] transition-colors text-lg"
            >
              ✕
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-[#EEF4F6] flex-shrink-0 flex-wrap">
            <input
              type="search"
              placeholder="Search NCT ID, title, sponsor…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="text-xs border border-[#DDE8EC] rounded-lg px-3 py-1.5 w-64 focus:outline-none focus:border-[#1B6B8A] focus:ring-2 focus:ring-[#1B6B8A]/10"
              autoFocus
            />
            <div className="flex items-center gap-1.5">
              {(["all", ...STATUS_ORDER] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setStatusFilter(g)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all font-medium ${
                    statusFilter === g
                      ? "bg-[#0B3D52] text-white border-[#0B3D52]"
                      : "bg-white text-[#6B8A96] border-[#DDE8EC] hover:border-[#1B6B8A] hover:text-[#1B6B8A]"
                  }`}
                >
                  {g === "all" ? "All" : `${g} ${statusGroups[g] ?? 0}`}
                </button>
              ))}
            </div>
            <button
              onClick={() => downloadStudiesCsv(sorted)}
              className="ml-auto text-xs border border-[#DDE8EC] rounded-lg px-2.5 py-1.5 text-[#6B8A96] hover:border-[#1B6B8A] hover:text-[#1B6B8A] transition-colors flex-shrink-0"
            >
              Export CSV
            </button>
          </div>

          {/* Column headers — clickable for sort */}
          <div className="grid grid-cols-[90px_130px_1fr_150px_55px_72px_82px_90px_56px] gap-x-3 px-6 py-2 bg-[#F8FAFB] border-b border-[#EEF4F6] text-[10px] font-semibold text-[#6B8A96] uppercase tracking-wider flex-shrink-0">
            <button className={thClass} onClick={() => handleSort("NCTId")}>
              <svg {...ICON_PROPS}><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
              NCT ID <SortIcon field="NCTId" />
            </button>
            <button className={thClass} onClick={() => handleSort("status")}>
              Status <SortIcon field="status" />
            </button>
            <button className={thClass} onClick={() => handleSort("BriefTitle")}>
              <svg {...ICON_PROPS}><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              Title <SortIcon field="BriefTitle" />
            </button>
            <button className={thClass} onClick={() => handleSort("LeadSponsorName")}>
              <svg {...ICON_PROPS}><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>
              Sponsor <SortIcon field="LeadSponsorName" />
            </button>
            <button className={thClass} onClick={() => handleSort("Phase")}>
              Phase <SortIcon field="Phase" />
            </button>
            <button className={`${thClass} justify-end`} onClick={() => handleSort("EnrollmentCount")}>
              <SortIcon field="EnrollmentCount" /> Enrol.
            </button>
            <button className={thClass} onClick={() => handleSort("StartDate")}>
              Start <SortIcon field="StartDate" />
            </button>
            <button className={thClass} onClick={() => handleSort("CompletionDate")}>
              Completion <SortIcon field="CompletionDate" />
            </button>
            <span></span>
          </div>

          {/* Rows */}
          <div className="overflow-y-auto flex-1 min-h-0">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-[#6B8A96]">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#C5DCE4] mb-1">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  <path d="M8 11h6"/>
                </svg>
                <p className="text-sm font-medium">No trials match your search</p>
                <p className="text-xs text-[#9BB0BB]">Try a different search term or status filter</p>
              </div>
            ) : (
              sorted.map((s) => {
                const group = STATUS_GROUPS[s.OverallStatus] ?? "Unknown";
                const groupColor = STATUS_GROUP_COLORS[group];
                return (
                <div
                  key={s.NCTId}
                  className="grid grid-cols-[90px_130px_1fr_150px_55px_72px_82px_90px_56px] gap-x-3 pl-[22px] pr-6 py-2 border-b border-[#F2F6F8] border-l-[3px] border-l-transparent hover:border-l-[#1B6B8A] hover:bg-[#F8FAFB] transition-colors items-center"
                >
                  <span className="text-[11px] font-mono text-[#1B6B8A] font-medium">{highlight(s.NCTId, query.trim())}</span>

                  {/* Status pill — same style as ChangesTable */}
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit max-w-full truncate"
                    style={{ background: `linear-gradient(135deg, ${groupColor}18, ${groupColor}30)`, color: groupColor, border: `1px solid ${groupColor}25` }}
                    title={s.OverallStatus}
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: groupColor }} />
                    {s.OverallStatus}
                  </span>

                  {/* Title with ℹ tooltip on the left */}
                  <div className="flex items-center gap-1.5 min-w-0 group/title">
                    <div className="relative flex-shrink-0">
                      <svg className="text-[#C5D8E0] group-hover/title:text-[#1B6B8A] transition-colors cursor-default" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      <div className="absolute left-0 top-full mt-1.5 z-50 hidden group-hover/title:block w-72 bg-[#0B3D52] text-white text-[11px] rounded-lg px-3 py-2 shadow-xl leading-relaxed pointer-events-none">
                        {s.BriefTitle}
                      </div>
                    </div>
                    <span className="text-[11px] text-[#0B3D52] truncate">{highlight(s.BriefTitle, query.trim())}</span>
                  </div>

                  <span className="text-[11px] text-[#6B8A96] truncate flex items-center gap-1.5 min-w-0" title={s.LeadSponsorName}>
                    <SponsorAvatar name={s.LeadSponsorName} />
                    <span className="truncate">{s.LeadSponsorName ? highlight(s.LeadSponsorName, query.trim()) : "—"}</span>
                  </span>
                  <span className="text-[11px] text-[#6B8A96]">{s.Phase || "—"}</span>
                  <span className="text-[11px] text-[#0B3D52] font-semibold tabular-nums text-right">
                    {s.EnrollmentCount ? Math.round(parseFloat(s.EnrollmentCount)).toLocaleString() : "—"}
                  </span>
                  <span className="text-[11px] text-[#6B8A96] tabular-nums">{fmtDate(s.StartDate)}</span>
                  <span className="text-[11px] text-[#6B8A96] tabular-nums">{fmtDate(s.CompletionDate)}</span>
                  <div className="flex items-center gap-0.5 ml-auto">
                    <button
                      onClick={() => { onClose(); onOpenStudy(s.NCTId); }}
                      className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[#EAF4F8] text-[#6B8A96] hover:text-[#1B6B8A] transition-colors"
                      title="View study profile"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                        <circle cx="9" cy="11" r="2"/>
                        <path d="M15 9h2M15 13h2M7 17h10"/>
                      </svg>
                    </button>
                    <a
                      href={`https://clinicaltrials.gov/study/${s.NCTId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[#EAF4F8] text-[#6B8A96] hover:text-[#1B6B8A] transition-colors"
                      title="Open on ClinicalTrials.gov"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </a>
                  </div>
                </div>
              );})
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-[#EEF4F6] flex items-center gap-4 flex-shrink-0">
            {STATUS_ORDER.map((g) => (
              <div key={g} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: STATUS_GROUP_COLORS[g] }} />
                <span className="text-[10px] text-[#6B8A96]">{g}</span>
                <span className="text-[10px] font-semibold text-[#0B3D52]">{statusGroups[g] ?? 0}</span>
              </div>
            ))}
            <span className="ml-auto text-[10px] text-[#6B8A96]">Click column headers to sort · Esc to close</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function downloadStudiesCsv(rows: import("@/lib/data").Study[]) {
  const headers = [
    "NCT ID", "Title", "Acronym", "Status", "Phase", "Enrollment",
    "Sponsor", "Sponsor Class", "Collaborators",
    "Study Type", "Primary Purpose", "Condition",
    "Intervention Type", "Intervention",
    "Primary Outcome", "Secondary Outcome",
    "Sex", "Min Age", "Max Age", "Age Group",
    "Start Date", "Primary Completion", "Completion Date",
    "First Posted", "Last Updated", "Has Results", "Org Study ID",
  ];
  const lines = rows.map((s) =>
    [
      s.NCTId, s.BriefTitle, s.Acronym, s.OverallStatus, s.Phase,
      s.EnrollmentCount ? String(Math.round(parseFloat(s.EnrollmentCount))) : "",
      s.LeadSponsorName, s.LeadSponsorClass, s.CollaboratorName,
      s.StudyType, s.DesignPrimaryPurpose, s.Condition,
      s.InterventionType, s.InterventionName,
      s.PrimaryOutcomeMeasure, s.SecondaryOutcomeMeasure,
      s.Sex, s.MinimumAge, s.MaximumAge, s.StdAge,
      s.StartDate, s.PrimaryCompletionDate, s.CompletionDate,
      s.StudyFirstPostDate, s.LastUpdatePostDate,
      s.HasResults, s.OrgStudyId,
    ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
     .join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "studies.csv";
  a.click();
  URL.revokeObjectURL(url);
}
