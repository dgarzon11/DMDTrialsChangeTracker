"use client";

import { motion } from "framer-motion";
import { EnrichedChange, STATUS_GROUP_COLORS } from "@/lib/data";
import { useMemo } from "react";
import {
  LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

interface Props {
  changes: EnrichedChange[];
  allChanges: EnrichedChange[];
  totalTrials: number;
  statusGroupCounts: Record<string, number>;
}

const STATUS_ORDER = ["Active", "Planned", "Closed", "Unknown"] as const;

export default function KpiCards({ changes, allChanges, totalTrials, statusGroupCounts }: Props) {
  const stats = useMemo(() => {
    const totalChanges = changes.length;
    const uniqueTrials = new Set(changes.map((c) => c.NCTId)).size;

    const monthMap: Record<string, number> = {};
    allChanges.forEach((c) => {
      if (c.monthKey) monthMap[c.monthKey] = (monthMap[c.monthKey] || 0) + 1;
    });
    const spark = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([m, v]) => ({ m, v }));

    const newStudies = changes.filter((c) => c.isNewStudy).length;

    return { totalChanges, uniqueTrials, spark, newStudies };
  }, [changes, allChanges]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="grid grid-cols-4 gap-4"
    >
      <TrialsDonutCard total={totalTrials} groups={statusGroupCounts} />

      <KpiCard
        label="Total Changes"
        value={stats.totalChanges}
        hint="in the selected period"
        accent="#1E7FA0"
        sparkline={stats.spark}
      />
      <KpiCard
        label="Trials Affected"
        value={stats.uniqueTrials}
        hint="unique NCT IDs modified"
        accent="#2B8FA6"
      />
      <KpiCard
        label="New Studies Added"
        value={stats.newStudies}
        hint="first-time registrations"
        accent="#3A9B6C"
      />
    </motion.div>
  );
}

interface CardProps {
  label: string;
  value: string | number;
  hint: string;
  accent: string;
  sparkline?: { m: string; v: number }[];
}

function KpiCard({ label, value, hint, accent, sparkline }: CardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#DDE8EC] shadow-[0_1px_2px_rgba(11,61,82,0.04)] relative overflow-hidden">
      <div className="absolute top-0 left-0 h-1 w-full" style={{ background: accent }} />
      <p className="text-[11px] font-semibold text-[#6B8A96] uppercase tracking-wider">{label}</p>
      <p className="text-4xl font-bold text-[#0B3D52] mt-2">{value}</p>
      <p className="text-xs text-[#6B8A96] mt-1">{hint}</p>
      {sparkline && sparkline.length > 1 && (
        <div className="h-8 mt-2 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline}>
              <Line type="monotone" dataKey="v" stroke={accent} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function TrialsDonutCard({
  total, groups,
}: { total: number; groups: Record<string, number> }) {
  const pieData = STATUS_ORDER
    .map((g) => ({ name: g, value: groups[g] || 0 }))
    .filter((d) => d.value > 0);

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#DDE8EC] shadow-[0_1px_2px_rgba(11,61,82,0.04)] relative overflow-hidden">
      <div className="absolute top-0 left-0 h-1 w-full" style={{ background: "#0B3D52" }} />
      <p className="text-[11px] font-semibold text-[#6B8A96] uppercase tracking-wider">
        Total Trials
      </p>

      <div className="flex items-center gap-3 mt-2">
        {/* Donut */}
        <div className="relative w-[72px] h-[72px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={22}
                outerRadius={34}
                dataKey="value"
                strokeWidth={0}
                startAngle={90}
                endAngle={-270}
              >
                {pieData.map((e) => (
                  <Cell key={e.name} fill={STATUS_GROUP_COLORS[e.name]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-[#0B3D52]">{total}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-0.5">
          {STATUS_ORDER.map((g) => (
            <div key={g} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: STATUS_GROUP_COLORS[g] }}
                />
                <span className="text-[11px] text-[#6B8A96] truncate">{g}</span>
              </div>
              <span className="text-[11px] font-semibold text-[#0B3D52] tabular-nums">
                {groups[g] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
