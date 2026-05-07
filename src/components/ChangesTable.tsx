"use client";

import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  EnrichedChange, fieldColor, STATUS_GROUPS, STATUS_GROUP_COLORS, fmtMonth,
} from "@/lib/data";

interface Props {
  changes: EnrichedChange[];
  selectedField: string;
  onClearField: () => void;
  onOpenStudy: (nctId: string) => void;
}

type SortField = "month" | "field" | "NCTId" | "sponsor" | "start_value" | "final_value" | "delta";
type SortDir = "asc" | "desc";

function truncate(s: string, max = 40) {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

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

export default function ChangesTable({ changes, selectedField, onClearField, onOpenStudy }: Props) {
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("month");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const q = query.trim().toLowerCase();

  const latestMonth = useMemo(
    () => [...new Set(changes.map((c) => c.monthKey))].sort().pop() ?? "",
    [changes]
  );

  const filtered = useMemo(() => {
    if (!q) return changes;
    return changes.filter(
      (c) =>
        c.NCTId.toLowerCase().includes(q) ||
        c.sponsor?.toLowerCase().includes(q) ||
        c.field?.toLowerCase().includes(q)
    );
  }, [changes, q]);

  // When sorting by month: group rows so month label shows only once per group
  // When sorting by other field: flat sorted list, month shown per row
  const { rows, isGrouped } = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;

    if (sortField === "month") {
      // Original grouped behaviour
      const byMonth: Record<string, EnrichedChange[]> = {};
      filtered.forEach((c) => {
        if (!byMonth[c.monthKey]) byMonth[c.monthKey] = [];
        byMonth[c.monthKey].push(c);
      });
      const keys = Object.keys(byMonth).filter(Boolean).sort((a, b) =>
        dir * a.localeCompare(b)
      );
      const flat: Array<EnrichedChange & { _monthLabel: string; _first: boolean }> = [];
      keys.forEach((k) => {
        const items = byMonth[k].sort((a, b) => a.field.localeCompare(b.field));
        items.forEach((c, idx) => {
          flat.push({ ...c, _monthLabel: idx === 0 ? fmtMonth(k, "long") : "", _first: idx === 0 });
        });
      });
      return { rows: flat, isGrouped: true };
    }

    // Flat sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortField === "delta") {
        return ((a.delta ?? 0) - (b.delta ?? 0)) * dir;
      }
      const av = (a[sortField as keyof EnrichedChange] ?? "") as string;
      const bv = (b[sortField as keyof EnrichedChange] ?? "") as string;
      return av.toString().toLowerCase() < bv.toString().toLowerCase() ? -dir
           : av.toString().toLowerCase() > bv.toString().toLowerCase() ?  dir : 0;
    });
    return {
      rows: sorted.map((c) => ({ ...c, _monthLabel: fmtMonth(c.monthKey, "long"), _first: false })),
      isGrouped: false,
    };
  }, [filtered, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "month" ? "desc" : "asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    const active = sortField === field;
    return (
      <svg
        className={`transition-opacity ${active ? "opacity-90" : "opacity-25 group-hover/th:opacity-60"}`}
        xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        {active && sortDir === "desc"
          ? <path d="M12 19V5M5 12l7 7 7-7"/>
          : <path d="M12 5v14M5 12l7-7 7 7"/>}
      </svg>
    );
  }

  const thBtn = "flex items-center gap-1 cursor-pointer select-none group/th hover:text-[#1B6B8A] transition-colors";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-2xl border border-[#DDE8EC] shadow-card overflow-hidden flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF4F6] gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-[#0B3D52]">List of Changes</h2>
          <span className="text-xs font-mono text-[#6B8A96] bg-[#F2F6F8] px-2 py-0.5 rounded-full">
            {filtered.length}
          </span>
          {selectedField !== "all" && (
            <button
              onClick={onClearField}
              className="text-xs text-white px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: fieldColor(selectedField) }}
            >
              {selectedField} ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Search NCT ID, sponsor, field…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-xs border border-[#DDE8EC] rounded-lg px-3 py-1.5 w-60 focus:outline-none focus:border-[#1B6B8A] focus:ring-2 focus:ring-[#1B6B8A]/10"
          />
          <button
            onClick={() => downloadCsv(filtered)}
            className="text-xs border border-[#DDE8EC] rounded-lg px-2.5 py-1.5 text-[#6B8A96] hover:border-[#1B6B8A] hover:text-[#1B6B8A] transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Column headers — all clickable */}
      <div className="grid grid-cols-[110px_180px_100px_1fr_1fr_1fr_80px_44px] gap-x-3 px-5 py-2 bg-[#F8FAFB] border-b border-[#EEF4F6] text-[11px] font-semibold text-[#6B8A96] uppercase tracking-wider">
        <button className={thBtn} onClick={() => handleSort("month")}>
          <svg {...ICON_PROPS}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          Month <SortIcon field="month" />
        </button>
        <button className={thBtn} onClick={() => handleSort("field")}>
          <svg {...ICON_PROPS}><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          Field <SortIcon field="field" />
        </button>
        <button className={thBtn} onClick={() => handleSort("NCTId")}>
          <svg {...ICON_PROPS}><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
          NCT ID <SortIcon field="NCTId" />
        </button>
        <button className={thBtn} onClick={() => handleSort("sponsor")}>
          <svg {...ICON_PROPS}><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>
          Sponsor <SortIcon field="sponsor" />
        </button>
        <span className="text-right">Original</span>
        <span>Final</span>
        <button className={`${thBtn} justify-center`} onClick={() => handleSort("delta")}>
          <SortIcon field="delta" /> Δ
        </button>
        <span></span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence>
          {rows.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-[#6B8A96]">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#C5DCE4] mb-1">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                <path d="M11 8v6M8 11h6"/>
              </svg>
              <p className="text-sm font-medium">No changes match the current filters</p>
              <p className="text-xs text-[#9BB0BB]">Try adjusting the time range or search query</p>
            </div>
          )}

          {rows.map((c, idx) => (
            <Row
              key={`${c.monthKey}-${idx}-${c.NCTId}-${c.field}`}
              idx={idx}
              change={c}
              monthLabel={isGrouped ? c._monthLabel : fmtMonth(c.monthKey, "long")}
              first={isGrouped ? c._first : true}
              alwaysShowMonth={!isGrouped}
              isLatest={c.monthKey === latestMonth}
              q={q}
              onOpenStudy={onOpenStudy}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex-shrink-0 px-5 py-3 border-t border-[#EEF4F6] flex items-center justify-between text-[11px] text-[#6B8A96] flex-wrap gap-2">
        <span className="flex items-center gap-1.5">
          <span>💡</span>
          Click any NCT ID to open the trial on ClinicalTrials.gov
        </span>
        <div className="flex items-center gap-3">
          <LegendDot color="#3A9B6C" label="New study" />
          <LegendDot color={STATUS_GROUP_COLORS.Active} label="Active" />
          <LegendDot color={STATUS_GROUP_COLORS.Closed} label="Closed" />
          <LegendDot color={STATUS_GROUP_COLORS.Planned} label="Planned" />
        </div>
      </div>
    </motion.div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </span>
  );
}

function Row({
  idx, change, monthLabel, first, alwaysShowMonth, isLatest, q, onOpenStudy,
}: { idx: number; change: EnrichedChange; monthLabel: string; first: boolean; alwaysShowMonth: boolean; isLatest: boolean; q: string; onOpenStudy: (nctId: string) => void }) {
  const c = change;
  const bg = c.isNewStudy ? "bg-[#F4FAF6]" : "bg-white";
  const showMonth = alwaysShowMonth || first;
  const [tipPos, setTipPos] = useState<{ x: number; y: number } | null>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, delay: Math.min(idx * 0.015, 0.4) }}
      className={`grid grid-cols-[110px_180px_100px_1fr_1fr_1fr_80px_44px] gap-x-3 pl-[18px] pr-5 py-2.5 border-b border-[#F2F6F8] border-l-[3px] border-l-transparent hover:border-l-[#1B6B8A] hover:bg-[#F8FAFB] items-center group ${bg}`}
    >
      {/* Month */}
      <span className="text-xs font-semibold text-[#0B3D52]">
        {showMonth ? monthLabel : ""}
      </span>

      {/* Field with color tag */}
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="w-1 h-4 rounded-sm flex-shrink-0"
          style={{ background: fieldColor(c.field) }}
        />
        <span className="text-xs text-[#1A2E38] truncate" title={c.field}>
          {c.isNewStudy ? "New study added" : highlight(c.field, q)}
        </span>
      </div>

      {/* NCT ID — click opens profile */}
      <div className="flex items-center gap-1 min-w-0">
        {isLatest && <span className="w-1.5 h-1.5 rounded-full bg-[#3A9B6C] animate-pulse mr-1 inline-block flex-shrink-0" title="Recent change" />}
        <button
          onClick={() => onOpenStudy(c.NCTId)}
          className="text-xs font-mono text-[#1B6B8A] hover:text-[#0B3D52] hover:underline truncate text-left"
          title="View study profile"
        >
          {highlight(c.NCTId, q)}
        </button>
      </div>

      {/* Sponsor */}
      <span className="text-xs text-[#6B8A96] truncate flex items-center gap-1.5 min-w-0" title={c.sponsor}>
        <SponsorAvatar name={c.sponsor} />
        <span className="truncate">{highlight(truncate(c.sponsor, 32), q)}</span>
      </span>

      {/* Original */}
      {c.isNewStudy ? <span /> : (
        <span className="text-xs text-right text-[#6B8A96] truncate" title={c.start_value}>
          {renderValue(c, "start")}
        </span>
      )}

      {/* Final */}
      {c.isNewStudy ? <span /> : (
      <div className="flex items-center gap-1.5 min-w-0">
        {/* Info icon — fixed-position tooltip (escapes overflow clipping) */}
        <div
          ref={iconRef}
          className="flex-shrink-0 cursor-default"
          onMouseEnter={() => {
            if (iconRef.current) {
              const r = iconRef.current.getBoundingClientRect();
              const tipW = 304;
              const tipH = 110; // rough estimate
              const x = Math.min(r.left, window.innerWidth - tipW - 12);
              const spaceBelow = window.innerHeight - r.bottom;
              const y = spaceBelow < tipH + 10 ? r.top - tipH - 6 : r.bottom + 6;
              setTipPos({ x, y });
            }
          }}
          onMouseLeave={() => setTipPos(null)}
        >
          <svg
            className={`transition-colors ${tipPos ? "text-[#1B6B8A]" : "text-[#C5DCE4]"}`}
            xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </div>
        {tipPos && (
          <div
            style={{ position: "fixed", left: tipPos.x, top: tipPos.y, zIndex: 9999, maxWidth: "19rem" }}
            className="bg-[#0B3D52] text-white text-[11px] rounded-xl px-3 py-2.5 shadow-xl leading-relaxed pointer-events-none break-words"
          >
            <p className="text-[#7BAFC4] font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
              {c.isNewStudy ? "New Study" : c.field}
            </p>
            {!c.isNewStudy && (
              <>
                <p><span className="text-[#A8CEDB]">From: </span><span className="text-white">{c.start_value || "—"}</span></p>
                <p className="mt-1"><span className="text-[#A8CEDB]">To: </span><span className="text-white font-medium">{c.final_value || "—"}</span></p>
              </>
            )}
            {c.isNewStudy && (
              <p className="text-white">{c.final_value || "—"}</p>
            )}
          </div>
        )}
        <span className="text-[#C5DCE4] text-xs">→</span>
        <span className="text-xs font-medium text-[#1A2E38] truncate" title={c.final_value}>
          {renderValue(c, "final")}
        </span>
      </div>
      )}

      {/* Delta */}
      <div className="flex items-center justify-center">
        {c.delta !== undefined && c.delta !== 0 && (
          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
              c.delta > 0 ? "text-[#3A9B6C] bg-[#E8F5EE]" : "text-[#C94A4A] bg-[#F8E8E8]"
            }`}
          >
            {c.delta > 0 ? "▲" : "▼"} {Math.abs(c.delta)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => onOpenStudy(c.NCTId)}
          className="flex items-center justify-center w-5 h-5 rounded hover:bg-[#EAF4F8] text-[#6B8A96] hover:text-[#1B6B8A] transition-colors"
          title="View study profile"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <circle cx="9" cy="11" r="2"/>
            <path d="M15 9h2M15 13h2M7 17h10"/>
          </svg>
        </button>
        <a
          href={`https://clinicaltrials.gov/study/${c.NCTId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-5 h-5 rounded hover:bg-[#EAF4F8] text-[#6B8A96] hover:text-[#1B6B8A] transition-colors"
          title="Open on ClinicalTrials.gov"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    </motion.div>
  );
}

function renderValue(c: EnrichedChange, side: "start" | "final") {
  const raw = side === "start" ? c.start_value : c.final_value;
  if (!raw) return <span className="text-[#C5DCE4]">—</span>;

  if (c.field === "Overall Status") {
    const group = STATUS_GROUPS[raw] ?? "Unknown";
    const color = STATUS_GROUP_COLORS[group];
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{ background: `linear-gradient(135deg, ${color}18, ${color}30)`, color, border: `1px solid ${color}25` }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        {raw}
      </span>
    );
  }

  return <span>{truncate(raw, 28)}</span>;
}

function downloadCsv(rows: EnrichedChange[]) {
  const headers = ["Month", "Field", "NCT ID", "Sponsor", "Original", "Final", "Delta"];
  const lines = rows.map((r) =>
    [r.monthLabel, r.field, r.NCTId, r.sponsor, r.start_value, r.final_value, r.delta ?? ""]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dmd-changes.csv";
  a.click();
  URL.revokeObjectURL(url);
}
