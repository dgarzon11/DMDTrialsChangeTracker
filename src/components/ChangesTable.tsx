"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  EnrichedChange, fieldColor, STATUS_GROUPS, STATUS_GROUP_COLORS, fmtMonth,
} from "@/lib/data";

interface Props {
  changes: EnrichedChange[];
  selectedField: string;
  onClearField: () => void;
}

function truncate(s: string, max = 40) {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

export default function ChangesTable({ changes, selectedField, onClearField }: Props) {
  const [query, setQuery] = useState("");
  const [sortDesc, setSortDesc] = useState(true);

  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return changes;
    return changes.filter(
      (c) =>
        c.NCTId.toLowerCase().includes(q) ||
        c.sponsor?.toLowerCase().includes(q) ||
        c.field?.toLowerCase().includes(q)
    );
  }, [changes, q]);

  const grouped = useMemo(() => {
    const byMonth: Record<string, EnrichedChange[]> = {};
    filtered.forEach((c) => {
      if (!byMonth[c.monthKey]) byMonth[c.monthKey] = [];
      byMonth[c.monthKey].push(c);
    });
    const keys = Object.keys(byMonth).filter(Boolean).sort();
    const sorted = sortDesc ? keys.reverse() : keys;
    return sorted.map((k) => ({
      monthKey: k,
      monthLabel: fmtMonth(k, "long"),
      items: byMonth[k].sort((a, b) => a.field.localeCompare(b.field)),
    }));
  }, [filtered, sortDesc]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-2xl border border-[#DDE8EC] shadow-[0_1px_2px_rgba(11,61,82,0.04)] overflow-hidden"
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
            onClick={() => setSortDesc((p) => !p)}
            className="text-xs border border-[#DDE8EC] rounded-lg px-2.5 py-1.5 text-[#6B8A96] hover:border-[#1B6B8A] hover:text-[#1B6B8A] transition-colors"
            title="Toggle sort"
          >
            Month {sortDesc ? "↓" : "↑"}
          </button>
          <button
            onClick={() => downloadCsv(filtered)}
            className="text-xs border border-[#DDE8EC] rounded-lg px-2.5 py-1.5 text-[#6B8A96] hover:border-[#1B6B8A] hover:text-[#1B6B8A] transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[110px_180px_130px_1fr_1fr_1fr_80px] gap-x-3 px-5 py-2 bg-[#F8FAFB] border-b border-[#EEF4F6] text-[11px] font-semibold text-[#6B8A96] uppercase tracking-wider">
        <span>Month</span>
        <span>Field</span>
        <span>NCT ID</span>
        <span>Sponsor</span>
        <span className="text-right">Original</span>
        <span>Final</span>
        <span className="text-right">Δ / Info</span>
      </div>

      {/* Rows */}
      <div className="max-h-[620px] overflow-y-auto scrollbar-thin">
        <AnimatePresence>
          {grouped.length === 0 && (
            <div className="flex items-center justify-center py-16 text-sm text-[#6B8A96]">
              No changes match the current filters.
            </div>
          )}

          {grouped.map(({ monthKey, monthLabel, items }) => (
            <div key={monthKey}>
              {items.map((c, idx) => (
                <Row
                  key={`${monthKey}-${idx}-${c.NCTId}-${c.field}`}
                  change={c}
                  monthLabel={idx === 0 ? monthLabel : ""}
                  first={idx === 0}
                />
              ))}
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-[#EEF4F6] flex items-center justify-between text-[11px] text-[#6B8A96] flex-wrap gap-2">
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
  change, monthLabel, first,
}: { change: EnrichedChange; monthLabel: string; first: boolean }) {
  const c = change;
  const bg = c.isNewStudy ? "bg-[#F4FAF6]" : first ? "bg-white" : "bg-white";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={`grid grid-cols-[110px_180px_130px_1fr_1fr_1fr_80px] gap-x-3 px-5 py-2.5 border-b border-[#F2F6F8] hover:bg-[#F8FAFB] items-center group ${bg}`}
    >
      {/* Month (only first row of group) */}
      <span className="text-xs font-semibold text-[#0B3D52]">
        {monthLabel}
      </span>

      {/* Field with color tag */}
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="w-1 h-4 rounded-sm flex-shrink-0"
          style={{ background: fieldColor(c.field) }}
        />
        <span className="text-xs text-[#1A2E38] truncate" title={c.field}>
          {c.isNewStudy ? "New study added" : c.field}
        </span>
      </div>

      {/* NCT ID */}
      <a
        href={`https://clinicaltrials.gov/study/${c.NCTId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-mono text-[#1B6B8A] hover:underline"
      >
        {c.NCTId}
      </a>

      {/* Sponsor */}
      <span className="text-xs text-[#6B8A96] truncate" title={c.sponsor}>
        {truncate(c.sponsor, 32)}
      </span>

      {/* Original */}
      <span
        className="text-xs text-right text-[#6B8A96] truncate"
        title={c.start_value}
      >
        {renderValue(c, "start")}
      </span>

      {/* Final */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[#C5DCE4] text-xs">→</span>
        <span className="text-xs font-medium text-[#1A2E38] truncate" title={c.final_value}>
          {renderValue(c, "final")}
        </span>
      </div>

      {/* Delta or info */}
      <div className="flex items-center justify-end gap-1">
        {c.delta !== undefined && c.delta !== 0 && (
          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
              c.delta > 0 ? "text-[#3A9B6C] bg-[#E8F5EE]" : "text-[#C94A4A] bg-[#F8E8E8]"
            }`}
          >
            {c.delta > 0 ? "▲" : "▼"} {Math.abs(c.delta)}
          </span>
        )}
        <a
          href={`https://clinicaltrials.gov/study/${c.NCTId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-5 h-5 rounded-full border border-[#DDE8EC] flex items-center justify-center text-[10px] text-[#6B8A96] hover:border-[#1B6B8A] hover:text-[#1B6B8A] transition-colors opacity-0 group-hover:opacity-100"
          title="View on ClinicalTrials.gov"
        >
          →
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
        style={{ background: `${color}22`, color }}
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
