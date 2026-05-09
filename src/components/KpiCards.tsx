"use client";

import { motion } from "framer-motion";
import { EnrichedChange, STATUS_GROUP_COLORS, Study, fmtMonthShort, fmtMonthFull } from "@/lib/data";
import { Comparison } from "./Dashboard";
import { useEffect, useMemo, useRef, useState } from "react";
import TrialsModal from "./TrialsModal";
import {
  AreaChart, Area, LineChart, Line, ResponsiveContainer, Tooltip,
} from "recharts";

interface Props {
  changes: EnrichedChange[];
  allChanges: EnrichedChange[];
  totalTrials: number;
  statusGroupCounts: Record<string, number>;
  statusGroupDetails: Record<string, string[]>;
  comparison: Comparison;
  studies: Study[];
  onOpenStudy: (nctId: string) => void;
}

const STATUS_ORDER = ["Active", "Planned", "Closed", "Unknown"] as const;
const STATUS_SHORT: Record<string, string> = {
  Active: "Active", Planned: "Planned", Closed: "Closed", Unknown: "Unknown",
};

function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const startTime = performance.now();
    function tick(now: number) {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setVal(Math.round(eased * target));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return val;
}

export default function KpiCards({
  changes, allChanges, totalTrials, statusGroupCounts, statusGroupDetails, comparison, studies, onOpenStudy,
}: Props) {
  const [showTrials, setShowTrials] = useState(false);
  const [showNewStudies, setShowNewStudies] = useState(false);

  const newStudyNCTIds = useMemo(
    () => new Set(changes.filter((c) => c.isNewStudy).map((c) => c.NCTId)),
    [changes]
  );
  const newStudiesFiltered = useMemo(
    () => studies.filter((s) => newStudyNCTIds.has(s.NCTId)),
    [studies, newStudyNCTIds]
  );

  const stats = useMemo(() => {
    // Total changes spark — from rangeChanges (already filtered by time)
    const monthMap: Record<string, number> = {};
    allChanges.forEach((c) => {
      if (c.monthKey) monthMap[c.monthKey] = (monthMap[c.monthKey] || 0) + 1;
    });
    const changesSpark = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([m, v]) => ({ monthKey: m, label: fmtMonthShort(m), fullLabel: fmtMonthFull(m), v }));

    // Trials affected per month
    const affectedByMonth: Record<string, Set<string>> = {};
    changes.forEach((c) => {
      if (!c.monthKey) return;
      if (!affectedByMonth[c.monthKey]) affectedByMonth[c.monthKey] = new Set();
      affectedByMonth[c.monthKey].add(c.NCTId);
    });
    const affectedSpark = Object.entries(affectedByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([m, s]) => ({ monthKey: m, label: fmtMonthShort(m), fullLabel: fmtMonthFull(m), v: s.size }));

    // New studies per month (fill zeros)
    const newByMonth: Record<string, number> = {};
    changes.filter((c) => c.isNewStudy).forEach((c) => {
      if (c.monthKey) newByMonth[c.monthKey] = (newByMonth[c.monthKey] || 0) + 1;
    });
    const allMonths = [...new Set(changes.map((c) => c.monthKey))].filter(Boolean).sort();
    const newSpark = allMonths.map((m) => ({
      monthKey: m, label: fmtMonthShort(m), fullLabel: fmtMonthFull(m), v: newByMonth[m] || 0,
    }));

    return {
      totalChanges: changes.length,
      uniqueTrials: new Set(changes.map((c) => c.NCTId)).size,
      newStudies: changes.filter((c) => c.isNewStudy).length,
      changesSpark, affectedSpark, newSpark,
    };
  }, [changes, allChanges]);

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <TrialsDonutCard
        total={totalTrials}
        groups={statusGroupCounts}
        details={statusGroupDetails}
        onOpenModal={() => setShowTrials(true)}
      />

      <SparkCard
        label="Total Changes"
        value={stats.totalChanges}
        hint="in selected period"
        accent="#1E7FA0"
        spark={stats.changesSpark}
        delta={comparison.changesPct}
        deltaCurrentVal={comparison.changesCurrentMonth}
        deltaPrevVal={comparison.changesPrevMonth}
        deltaCurrentLabel={comparison.currentMonthLabel}
        deltaPrevLabel={comparison.prevMonthLabel}
      />

      <SparkCard
        label="Trials Affected"
        value={stats.uniqueTrials}
        hint="unique NCT IDs modified"
        accent="#2B8FA6"
        spark={stats.affectedSpark}
        delta={comparison.trialsPct}
        deltaCurrentVal={comparison.trialsCurrentMonth}
        deltaPrevVal={comparison.trialsPrevMonth}
        deltaCurrentLabel={comparison.currentMonthLabel}
        deltaPrevLabel={comparison.prevMonthLabel}
      />

      <SparkCard
        label="New Studies Added"
        value={stats.newStudies}
        hint="first-time registrations"
        accent="#3A9B6C"
        spark={stats.newSpark}
        dotted
        delta={comparison.newStudiesPct}
        deltaCurrentVal={comparison.newStudiesCurrentMonth}
        deltaPrevVal={comparison.newStudiesPrevMonth}
        deltaCurrentLabel={comparison.currentMonthLabel}
        deltaPrevLabel={comparison.prevMonthLabel}
        onViewAll={stats.newStudies > 0 ? () => setShowNewStudies(true) : undefined}
      />
    </motion.div>

    {showTrials && (
      <TrialsModal studies={studies} onClose={() => setShowTrials(false)} onOpenStudy={onOpenStudy} />
    )}
    {showNewStudies && (
      <TrialsModal
        studies={newStudiesFiltered}
        onClose={() => setShowNewStudies(false)}
        onOpenStudy={onOpenStudy}
        title="New Studies Added"
      />
    )}
    </>
  );
}

/* ─── Custom tooltip for sparklines ──────────────────────── */
type SparkDatum = { monthKey: string; label: string; fullLabel: string; v: number };

function makeSparkTooltip(accent: string, seriesLabel: string) {
  const SparkTooltip = (props: Record<string, unknown>) => {
    const { active, payload } = props as { active?: boolean; payload?: { payload: SparkDatum }[] };
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div className="bg-[#0B3D52] text-white border border-[#1B6B8A]/40 rounded-lg px-3 py-2 text-xs shadow-md">
        <p className="text-[#7BAFC4] uppercase tracking-wider text-[10px] mb-0.5">{d.fullLabel}</p>
        <p className="text-white">{seriesLabel}: <span className="font-bold">{d.v}</span></p>
      </div>
    );
  };
  SparkTooltip.displayName = "SparkTooltip";
  return SparkTooltip;
}

/* ─── Delta badge ────────────────────────────────────────── */
interface DeltaProps {
  delta: number | null;
  currentVal: number;
  prevVal: number;
  currentLabel: string;
  prevLabel: string;
}

function DeltaBadge({ delta, currentVal, prevVal, currentLabel, prevLabel }: DeltaProps) {
  const isNull = delta === null || delta === undefined;
  const isZero = delta === 0;
  const up = !isNull && !isZero && delta > 0;
  const color = isNull || isZero ? "#8B9EAB" : up ? "#1E7FA0" : "#8B9EAB";
  const bg    = isNull || isZero ? "#F0F4F6" : up ? "#EAF4F8" : "#F0F4F6";

  const badgeContent = isNull
    ? <span>—</span>
    : isZero
    ? <span className="flex items-center gap-0.5"><span>—</span><span>0%</span></span>
    : <span className="flex items-center gap-0.5"><span>{up ? "↑" : "↓"}</span><span>{Math.abs(delta!)}%</span></span>;

  return (
    <div className="relative group flex-shrink-0">
      <span
        className="flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full cursor-default"
        style={{ color, background: bg }}
      >
        {badgeContent}
      </span>
      {/* Hover tooltip */}
      <div className="absolute right-0 top-full mt-1.5 z-50 hidden group-hover:block w-44 bg-white border border-[#DDE8EC] rounded-xl shadow-lg p-3 text-xs pointer-events-none">
        <p className="text-[10px] font-semibold text-[#6B8A96] uppercase tracking-wide mb-2">vs previous month</p>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[#0B3D52] font-medium">{currentLabel}</span>
            <span className="font-bold text-[#0B3D52]">{currentVal}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6B8A96]">{prevLabel}</span>
            <span className="font-semibold text-[#6B8A96]">{prevVal}</span>
          </div>
          <div className="pt-1 mt-1 border-t border-[#EEF4F6] flex justify-between items-center">
            <span className="text-[#6B8A96]">Change</span>
            <span className="font-bold" style={{ color }}>
              {isNull ? "—" : isZero ? "0%" : `${up ? "+" : ""}${delta}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sparkline card ─────────────────────────────────────── */
interface SparkCardProps {
  label: string;
  value: number;
  hint: string;
  accent: string;
  spark: SparkDatum[];
  dotted?: boolean;
  delta?: number | null;
  deltaCurrentVal?: number;
  deltaPrevVal?: number;
  deltaCurrentLabel?: string;
  deltaPrevLabel?: string;
  onViewAll?: () => void;
}

function SparkCard({
  label, value, hint, accent, spark, dotted,
  delta, deltaCurrentVal, deltaPrevVal, deltaCurrentLabel, deltaPrevLabel,
  onViewAll,
}: SparkCardProps) {
  const animated = useCountUp(value);
  const firstLabel = spark[0]?.label ?? "";
  const lastLabel = spark[spark.length - 1]?.label ?? "";
  const hasSpark = spark.length > 1;
  const showDelta = deltaCurrentVal !== undefined && deltaPrevVal !== undefined;

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#DDE8EC] shadow-card hover:shadow-card-hover transition-shadow relative overflow-hidden flex flex-col">
      <div className="absolute top-0 left-0 h-1 w-full" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold text-[#6B8A96] uppercase tracking-wider">{label}</p>
        {showDelta && (
          <div className="flex flex-col items-end gap-0.5">
            <DeltaBadge
              delta={delta ?? null}
              currentVal={deltaCurrentVal ?? 0}
              prevVal={deltaPrevVal ?? 0}
              currentLabel={deltaCurrentLabel ?? ""}
              prevLabel={deltaPrevLabel ?? ""}
            />
            <span className="text-[9px] text-[#6B8A96]">vs prev month</span>
          </div>
        )}
      </div>
      <p className="text-4xl font-bold text-[#0B3D52] mt-2 tabular-nums tracking-tight">{animated}</p>
      <div className="flex items-center justify-between mt-0.5">
        <p className="text-xs text-[#6B8A96]">{hint}</p>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border transition-all"
            style={{
              borderColor: `${accent}55`,
              color: accent,
              background: `${accent}10`,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${accent}22`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${accent}10`; }}
          >
            View all
            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        )}
      </div>

      {hasSpark && (
        <div className="mt-3 flex-1">
          <div className="h-[52px]">
            <ResponsiveContainer width="100%" height="100%">
              {dotted ? (
                <LineChart data={spark} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                  <Tooltip content={makeSparkTooltip(accent, label)} />
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={accent}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    dot={{ r: 3, fill: accent, strokeWidth: 0 }}
                    activeDot={{ r: 4, fill: accent, strokeWidth: 0 }}
                  />
                </LineChart>
              ) : (
                <AreaChart data={spark} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id={`spark-grad-${label.replace(/\s+/g, "-")}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accent} stopOpacity={0.32} />
                      <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Tooltip content={makeSparkTooltip(accent, label)} />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={accent}
                    strokeWidth={1.75}
                    fill={`url(#spark-grad-${label.replace(/\s+/g, "-")})`}
                    activeDot={{ r: 4, fill: accent, strokeWidth: 0 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
          {firstLabel && lastLabel && (
            <div className={`flex text-[10px] text-[#6B8A96] mt-0.5 px-1 ${firstLabel === lastLabel ? "justify-center" : "justify-between"}`}>
              <span>{firstLabel}</span>
              {firstLabel !== lastLabel && <span>{lastLabel}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Donut tooltip ──────────────────────────────────────── */
const DonutTooltip = (props: Record<string, unknown>) => {
  const { active, payload } = props as { active?: boolean; payload?: { name: string; value: number; payload: { details: string[]; name: string } }[] };
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const { name, value } = item;
  const color = STATUS_GROUP_COLORS[name];
  const details: string[] = item.payload?.details ?? [];

  return (
    <div
      className="bg-[#0B3D52] text-white border border-[#1B6B8A]/40 rounded-xl px-3 py-2.5 text-xs shadow-lg"
      style={{ minWidth: 170 }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="font-bold text-white">{name}</span>
        <span className="ml-auto font-bold text-white text-sm">{value}</span>
      </div>
      <div className="space-y-0.5">
        {details.map((s) => (
          <div key={s} className="flex items-center gap-1.5 text-[#7BAFC4]">
            <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: color }} />
            {s}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Pure-SVG donut (no Recharts sizing issues) ─────────── */
function SvgDonut({
  segments, size = 130, inner = 38, outer = 60,
}: {
  segments: { name: string; value: number; color: string; details: string[] }[];
  size?: number; inner?: number; outer?: number;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const cx = size / 2, cy = size / 2;
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  let angle = -Math.PI / 2; // start at top
  const arcs = segments.map((seg) => {
    const sweep = (seg.value / total) * 2 * Math.PI;
    const x1 = cx + outer * Math.cos(angle);
    const y1 = cy + outer * Math.sin(angle);
    angle += sweep;
    const x2 = cx + outer * Math.cos(angle);
    const y2 = cy + outer * Math.sin(angle);
    const ix1 = cx + inner * Math.cos(angle);
    const iy1 = cy + inner * Math.sin(angle);
    const ix2 = cx + inner * Math.cos(angle - sweep);
    const iy2 = cy + inner * Math.sin(angle - sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const d = [
      `M ${x1} ${y1}`,
      `A ${outer} ${outer} 0 ${large} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${inner} ${inner} 0 ${large} 0 ${ix2} ${iy2}`,
      "Z",
    ].join(" ");
    return { ...seg, d };
  });

  const hovSeg = hovered ? arcs.find((a) => a.name === hovered) : null;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ display: "block" }}>
        {arcs.map((arc) => (
          <path
            key={arc.name}
            d={arc.d}
            fill={arc.color}
            opacity={hovered === arc.name ? 0.95 : hovered ? 0.35 : 0.72}
            style={{ cursor: "pointer", transition: "opacity 0.15s" }}
            onMouseEnter={(e) => {
              setHovered(arc.name);
              setMousePos({ x: e.clientX, y: e.clientY });
            }}
            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => { setHovered(null); setMousePos(null); }}
          />
        ))}
      </svg>
      {/* Hover tooltip — fixed positioning so it never gets clipped */}
      {hovSeg && mousePos && (
        <div
          className="bg-[#0B3D52] text-white border border-[#1B6B8A]/40 rounded-xl px-3 py-2.5 text-xs shadow-lg pointer-events-none"
          style={{
            position: "fixed",
            left: Math.min(mousePos.x + 14, window.innerWidth - 220),
            top: Math.min(mousePos.y + 14, window.innerHeight - 140),
            minWidth: 150,
            zIndex: 9999,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: hovSeg.color }} />
            <span className="font-bold text-white">{hovSeg.name}</span>
            <span className="ml-auto font-bold text-white text-sm">{hovSeg.value}</span>
          </div>
          {hovSeg.details.map((s) => (
            <div key={s} className="flex items-center gap-1.5 text-[#7BAFC4]">
              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: hovSeg.color }} />
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Donut card ─────────────────────────────────────────── */
interface DonutCardProps {
  total: number;
  groups: Record<string, number>;
  details: Record<string, string[]>;
  onOpenModal: () => void;
}

function TrialsDonutCard({ total, groups, details, onOpenModal }: DonutCardProps) {
  const segments = STATUS_ORDER
    .map((g) => ({ name: g, value: groups[g] || 0, color: STATUS_GROUP_COLORS[g], details: details[g] ?? [] }))
    .filter((d) => d.value > 0);

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#DDE8EC] shadow-card hover:shadow-card-hover transition-shadow relative overflow-hidden flex flex-col">
      <div className="absolute top-0 left-0 h-1 w-full" style={{ background: "#0B3D52" }} />
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-[#6B8A96] uppercase tracking-wider">Total Trials</p>
        <button
          onClick={onOpenModal}
          title="View all trials"
          className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-[#DDE8EC] text-[#6B8A96] hover:border-[#1B6B8A] hover:text-[#1B6B8A] hover:bg-[#EAF4F8] transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          All trials
        </button>
      </div>

      {/* Donut + legend side by side */}
      <div className="flex items-center gap-3 mt-2 flex-1">
        {/* SVG Donut with centre label */}
        <div className="relative flex-shrink-0">
          <SvgDonut segments={segments} size={112} inner={36} outer={52} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-[#0B3D52] tabular-nums tracking-tight">{total}</span>
            <span className="text-[10px] text-[#6B8A96]">trials</span>
          </div>
        </div>

        {/* Legend — tight vertical list */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          {STATUS_ORDER.map((g) => (
            <div key={g} className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_GROUP_COLORS[g] }} />
                <span className="text-[11px] text-[#6B8A96] truncate">{STATUS_SHORT[g]}</span>
              </div>
              <span className="text-[11px] font-semibold text-[#0B3D52] tabular-nums">{groups[g] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
