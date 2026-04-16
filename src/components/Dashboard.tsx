"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadChanges, loadStudies, enrich, EnrichedChange, Study, fmtMonth, STATUS_GROUPS,
} from "@/lib/data";
import Header, { TimeRange } from "./Header";
import KpiCards from "./KpiCards";
import MonthlyChart from "./MonthlyChart";
import FieldBreakdown from "./FieldBreakdown";
import ChangesTable from "./ChangesTable";

function monthsForRange(range: TimeRange, allMonths: string[]): string[] {
  if (range === "all" || allMonths.length === 0) return allMonths;
  const map: Record<TimeRange, number> = { all: 999, "1m": 1, "3m": 3, "6m": 6, "1y": 12 };
  const n = map[range];
  return allMonths.slice(-n);
}

export default function Dashboard() {
  const [changes, setChanges] = useState<EnrichedChange[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [selectedField, setSelectedField] = useState<string>("all");

  useEffect(() => {
    Promise.all([loadChanges(), loadStudies()]).then(([rawChanges, loadedStudies]) => {
      const sponsorMap: Record<string, string> = {};
      loadedStudies.forEach((s) => { sponsorMap[s.NCTId] = s.LeadSponsorName; });
      setChanges(enrich(rawChanges, sponsorMap));
      setStudies(loadedStudies);
      setLoading(false);
    });
  }, []);

  const allMonths = useMemo(
    () => [...new Set(changes.map((c) => c.monthKey))].filter(Boolean).sort(),
    [changes]
  );

  const activeMonths = useMemo(() => new Set(monthsForRange(timeRange, allMonths)), [timeRange, allMonths]);

  const filtered = useMemo(() => {
    return changes.filter((c) => {
      if (!activeMonths.has(c.monthKey)) return false;
      if (selectedField !== "all" && c.field !== selectedField) return false;
      return true;
    });
  }, [changes, activeMonths, selectedField]);

  // Changes restricted to time-range only (independent of field filter) → for charts
  const rangeChanges = useMemo(() => {
    return changes.filter((c) => activeMonths.has(c.monthKey));
  }, [changes, activeMonths]);

  // Status group counts from current studies.csv snapshot
  const statusGroupCounts = useMemo(() => {
    const counts: Record<string, number> = { Active: 0, Planned: 0, Closed: 0, Unknown: 0 };
    studies.forEach((s) => {
      const g = STATUS_GROUPS[s.OverallStatus] ?? "Unknown";
      counts[g]++;
    });
    return counts;
  }, [studies]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#1B6B8A] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#6B8A96] text-sm">Loading change data…</p>
        </div>
      </div>
    );
  }

  const dateRangeLabel =
    allMonths.length > 0
      ? `${fmtMonth(allMonths[0])} → ${fmtMonth(allMonths[allMonths.length - 1])}`
      : "";

  return (
    <div className="min-h-screen bg-[#F2F6F8]">
      <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-6">
        <Header
          dateRange={dateRangeLabel}
          timeRange={timeRange}
          onSelectRange={setTimeRange}
        />

        <KpiCards
          changes={filtered}
          allChanges={changes}
          totalTrials={studies.length}
          statusGroupCounts={statusGroupCounts}
        />

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2">
            <MonthlyChart changes={rangeChanges} activeMonths={activeMonths} />
          </div>
          <div className="col-span-1">
            <FieldBreakdown
              changes={rangeChanges}
              selectedField={selectedField}
              onSelectField={setSelectedField}
            />
          </div>
        </div>

        <ChangesTable
          changes={filtered}
          selectedField={selectedField}
          onClearField={() => setSelectedField("all")}
        />

        <footer className="text-xs text-[#6B8A96] text-center py-4">
          Data sourced from <a href="https://clinicaltrials.gov" target="_blank" rel="noopener noreferrer" className="text-[#1B6B8A] hover:underline">ClinicalTrials.gov</a> · DMD Trials Change Tracker
        </footer>
      </div>
    </div>
  );
}
