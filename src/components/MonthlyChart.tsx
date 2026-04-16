"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { EnrichedChange, fieldColor, fmtMonthShort } from "@/lib/data";

interface Props {
  changes: EnrichedChange[];
  activeMonths: Set<string>;
}

const TOP_N = 6;

export default function MonthlyChart({ changes }: Props) {
  const { data, fields } = useMemo(() => {
    const fieldFreq: Record<string, number> = {};
    changes.forEach((c) => { if (c.field) fieldFreq[c.field] = (fieldFreq[c.field] || 0) + 1; });
    const ranked = Object.entries(fieldFreq).sort(([, a], [, b]) => b - a).map(([f]) => f);
    const topFields = ranked.slice(0, TOP_N);
    const rest = new Set(ranked.slice(TOP_N));

    const months = [...new Set(changes.map((c) => c.monthKey))].filter(Boolean).sort();
    const rows = months.map((m) => {
      const base: Record<string, string | number> = { month: m, label: fmtMonthShort(m) };
      topFields.forEach((f) => (base[f] = 0));
      if (rest.size > 0) base["Other"] = 0;
      return base;
    });
    const indexByMonth: Record<string, Record<string, string | number>> = {};
    rows.forEach((r) => { indexByMonth[r.month as string] = r; });

    changes.forEach((c) => {
      const row = indexByMonth[c.monthKey];
      if (!row) return;
      const key = rest.has(c.field) ? "Other" : c.field;
      row[key] = ((row[key] as number) || 0) + 1;
    });

    const allFields = rest.size > 0 ? [...topFields, "Other"] : topFields;
    return { data: rows, fields: allFields };
  }, [changes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white rounded-2xl p-5 border border-[#DDE8EC] shadow-[0_1px_2px_rgba(11,61,82,0.04)] h-full"
    >
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-[#0B3D52]">Monthly Change Volume</h2>
          <p className="text-xs text-[#6B8A96] mt-0.5">Stacked by field type</p>
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF4F6" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#6B8A96" }}
              tickLine={false}
              axisLine={{ stroke: "#DDE8EC" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6B8A96" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "#F2F6F8" }}
              contentStyle={{
                fontSize: 11,
                border: "1px solid #DDE8EC",
                borderRadius: 10,
                boxShadow: "0 4px 12px rgba(11,61,82,0.08)",
              }}
              labelStyle={{ color: "#0B3D52", fontWeight: 700, marginBottom: 4 }}
            />
            {fields.map((f, i) => (
              <Bar
                key={f}
                dataKey={f}
                stackId="a"
                fill={f === "Other" ? "#C8DDE3" : fieldColor(f)}
                radius={i === fields.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-[#EEF4F6]">
        {fields.map((f) => (
          <div key={f} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: f === "Other" ? "#C8DDE3" : fieldColor(f) }}
            />
            <span className="text-[10px] text-[#6B8A96]">{f}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
