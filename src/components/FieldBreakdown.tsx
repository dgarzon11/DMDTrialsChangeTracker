"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { EnrichedChange } from "@/lib/data";

/** Interpolates between light (#A8CEDB) and dark (#0B3D52) based on ratio 0–1 */
function countColor(ratio: number): string {
  const t = 0.18 + 0.82 * ratio; // floor at 0.18 so lightest bar is still visible
  const light = [168, 206, 219]; // #A8CEDB
  const dark  = [11,  61,  82];  // #0B3D52
  const r = Math.round(light[0] + (dark[0] - light[0]) * t);
  const g = Math.round(light[1] + (dark[1] - light[1]) * t);
  const b = Math.round(light[2] + (dark[2] - light[2]) * t);
  return `rgb(${r},${g},${b})`;
}

interface Props {
  changes: EnrichedChange[];
  selectedField: string;
  onSelectField: (f: string) => void;
}

export default function FieldBreakdown({ changes, selectedField, onSelectField }: Props) {
  const rows = useMemo(() => {
    const counts: Record<string, number> = {};
    changes.forEach((c) => {
      if (c.field) counts[c.field] = (counts[c.field] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([field, count]) => ({ field, count }));
  }, [changes]);

  const max = rows[0]?.count ?? 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="bg-white rounded-2xl p-5 border border-[#DDE8EC] shadow-card flex flex-col h-full"
    >
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-[#0B3D52]">Changes by Field</h2>
          <p className="text-xs text-[#6B8A96] mt-0.5">Click a bar to filter</p>
        </div>
        {selectedField !== "all" && (
          <button
            onClick={() => onSelectField("all")}
            className="text-xs text-[#1B6B8A] hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0 pr-1">
        {rows.map(({ field, count }) => {
          const isActive = selectedField === field;
          const dimmed = selectedField !== "all" && !isActive;
          return (
            <button
              key={field}
              onClick={() => onSelectField(isActive ? "all" : field)}
              className={`w-full text-left group transition-opacity ${dimmed ? "opacity-40" : ""}`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span
                  className={`font-medium truncate pr-2 ${
                    isActive ? "text-[#0B3D52]" : "text-[#1A2E38] group-hover:text-[#0B3D52]"
                  }`}
                  title={field}
                >
                  {field}
                </span>
                <span className="text-[#0B3D52] font-semibold tabular-nums">{count}</span>
              </div>
              <div className="h-2 bg-[#F2F6F8] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: countColor(count / max) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / max) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </button>
          );
        })}
        {rows.length === 0 && (
          <p className="text-xs text-[#6B8A96] py-4 text-center">No changes in this selection.</p>
        )}
      </div>
    </motion.div>
  );
}
