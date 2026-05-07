"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadChanges, loadStudies, enrich, EnrichedChange, Study, fmtMonth, STATUS_GROUPS,
} from "@/lib/data";
import { motion } from "framer-motion";
import Header, { TimeRange } from "./Header";
import KpiCards from "./KpiCards";
import FieldBreakdown from "./FieldBreakdown";
import ChangesTable from "./ChangesTable";
import StudyProfileModal from "./StudyProfileModal";

function monthsForRange(range: TimeRange, allMonths: string[]): string[] {
  if (range === "all" || allMonths.length === 0) return allMonths;
  const map: Record<TimeRange, number> = { all: 999, "1m": 1, "3m": 3, "6m": 6, "1y": 12 };
  return allMonths.slice(-map[range]);
}

export interface Comparison {
  // % change (last month vs month before), always fixed regardless of filter
  changesPct: number | null;
  trialsPct: number | null;
  newStudiesPct: number | null;
  // absolute counts for tooltip
  changesCurrentMonth: number;
  changesPrevMonth: number;
  trialsCurrentMonth: number;
  trialsPrevMonth: number;
  newStudiesCurrentMonth: number;
  newStudiesPrevMonth: number;
  // month labels for tooltip
  currentMonthLabel: string;
  prevMonthLabel: string;
}

function pct(current: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((current - prev) / prev) * 100);
}

export default function Dashboard() {
  const [changes, setChanges] = useState<EnrichedChange[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [selectedField, setSelectedField] = useState<string>("all");
  const [profileStudyId, setProfileStudyId] = useState<string | null>(null);

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

  const activeMonths = useMemo(
    () => new Set(monthsForRange(timeRange, allMonths)),
    [timeRange, allMonths]
  );

  // Always: last month vs month before last — independent of any filter
  const lastMonth = allMonths[allMonths.length - 1] ?? "";
  const prevMonth = allMonths[allMonths.length - 2] ?? "";

  const filtered = useMemo(
    () => changes.filter((c) =>
      activeMonths.has(c.monthKey) &&
      (selectedField === "all" || c.field === selectedField)
    ),
    [changes, activeMonths, selectedField]
  );

  const rangeChanges = useMemo(
    () => changes.filter((c) => activeMonths.has(c.monthKey)),
    [changes, activeMonths]
  );

  // Fixed comparison: last month vs month before — never affected by filters
  const comparison = useMemo((): Comparison => {
    const cur = changes.filter((c) => c.monthKey === lastMonth);
    const prv = changes.filter((c) => c.monthKey === prevMonth);

    const changesCurrentMonth = cur.length;
    const changesPrevMonth = prv.length;
    const trialsCurrentMonth = new Set(cur.map((c) => c.NCTId)).size;
    const trialsPrevMonth = new Set(prv.map((c) => c.NCTId)).size;
    const newStudiesCurrentMonth = cur.filter((c) => c.isNewStudy).length;
    const newStudiesPrevMonth = prv.filter((c) => c.isNewStudy).length;

    return {
      changesPct: pct(changesCurrentMonth, changesPrevMonth),
      trialsPct: pct(trialsCurrentMonth, trialsPrevMonth),
      newStudiesPct: pct(newStudiesCurrentMonth, newStudiesPrevMonth),
      changesCurrentMonth,
      changesPrevMonth,
      trialsCurrentMonth,
      trialsPrevMonth,
      newStudiesCurrentMonth,
      newStudiesPrevMonth,
      currentMonthLabel: fmtMonth(lastMonth),
      prevMonthLabel: fmtMonth(prevMonth),
    };
  }, [changes, lastMonth, prevMonth]);

  // Status group counts + breakdown details for donut tooltip
  const { statusGroupCounts, statusGroupDetails } = useMemo(() => {
    const counts: Record<string, number> = { Active: 0, Planned: 0, Closed: 0, Unknown: 0 };
    const detailsSet: Record<string, Set<string>> = {
      Active: new Set(), Planned: new Set(), Closed: new Set(), Unknown: new Set(),
    };
    studies.forEach((s) => {
      const g = STATUS_GROUPS[s.OverallStatus] ?? "Unknown";
      counts[g]++;
      detailsSet[g]?.add(s.OverallStatus);
    });
    const details: Record<string, string[]> = {};
    Object.entries(detailsSet).forEach(([g, set]) => {
      details[g] = [...set].sort();
    });
    return { statusGroupCounts: counts, statusGroupDetails: details };
  }, [studies]);

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-[#E8F2F6] via-[#F2F6F8] to-[#F5F9FA] flex flex-col">
        <div className="max-w-[1400px] w-full mx-auto px-8 pt-8 pb-8 flex flex-col gap-5 h-full min-h-0">
          {/* Header skeleton */}
          <div className="space-y-4">
            <div className="skeleton h-8 w-96" />
            <div className="skeleton h-4 w-64" />
            <div className="flex gap-2 mt-2">
              {[80, 96, 112, 104, 80].map((w, i) => (
                <div key={i} className="skeleton h-7 rounded-full" style={{ width: w }} />
              ))}
            </div>
          </div>
          {/* KPI cards skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-[#DDE8EC] flex flex-col gap-3">
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-10 w-16" />
                <div className="skeleton h-3 w-32" />
                <div className="skeleton h-12 w-full mt-1" />
              </div>
            ))}
          </div>
          {/* Main content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 flex-1 min-h-0">
            <div className="lg:col-span-3 skeleton rounded-2xl" />
            <div className="lg:col-span-1 skeleton rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const dateRangeLabel =
    allMonths.length > 0
      ? `${fmtMonth(allMonths[0])} → ${fmtMonth(allMonths[allMonths.length - 1])}`
      : "";

  const profileStudy = profileStudyId ? studies.find((s) => s.NCTId === profileStudyId) ?? null : null;
  const profileChanges = profileStudyId ? changes.filter((c) => c.NCTId === profileStudyId) : [];

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-[#E8F2F6] via-[#F2F6F8] to-[#F5F9FA] flex flex-col">
      <div className="max-w-[1400px] w-full mx-auto px-8 pt-8 pb-8 flex flex-col gap-5 h-full min-h-0">

        <Header
          dateRange={dateRangeLabel}
          timeRange={timeRange}
          onSelectRange={(r) => { setTimeRange(r); setSelectedField("all"); }}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-5 flex-1 min-h-0"
        >
          <KpiCards
            changes={filtered}
            allChanges={rangeChanges}
            totalTrials={studies.length}
            statusGroupCounts={statusGroupCounts}
            statusGroupDetails={statusGroupDetails}
            comparison={comparison}
            studies={studies}
            onOpenStudy={setProfileStudyId}
          />

          {/* Main content — fills remaining height */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 flex-1 min-h-0">
            <div className="lg:col-span-3 min-h-0 flex flex-col">
              <ChangesTable
                changes={filtered}
                selectedField={selectedField}
                onClearField={() => setSelectedField("all")}
                onOpenStudy={setProfileStudyId}
              />
            </div>
            <div className="lg:col-span-1 min-h-0">
              <FieldBreakdown
                changes={rangeChanges}
                selectedField={selectedField}
                onSelectField={setSelectedField}
              />
            </div>
          </div>
        </motion.div>

      </div>

      {profileStudy && (
        <StudyProfileModal
          study={profileStudy}
          changes={profileChanges}
          onClose={() => setProfileStudyId(null)}
        />
      )}
    </div>
  );
}
