"use client";

import { motion } from "framer-motion";

export type TimeRange = "all" | "1m" | "3m" | "6m" | "1y";

interface Props {
  dateRange: string;
  timeRange: TimeRange;
  onSelectRange: (r: TimeRange) => void;
}

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "all", label: "All months" },
  { value: "1m", label: "Last month" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "1y", label: "Last year" },
];

export default function Header({ dateRange, timeRange, onSelectRange }: Props) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3D52] tracking-tight">
            DMD Clinical Trials — Change Monitor
          </h1>
          <p className="text-sm text-[#6B8A96] mt-1">
            Tracking field-level modifications across registered Duchenne Muscular Dystrophy trials
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#6B8A96] bg-white px-3 py-2 rounded-lg border border-[#DDE8EC]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3A9B6C] animate-pulse" />
          <span className="font-mono">{dateRange}</span>
        </div>
      </div>

      {/* Time range presets */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {OPTIONS.map((opt) => (
          <Pill
            key={opt.value}
            active={timeRange === opt.value}
            onClick={() => onSelectRange(opt.value)}
          >
            {opt.label}
          </Pill>
        ))}
      </div>
    </motion.header>
  );
}

function Pill({
  children, active, onClick,
}: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3.5 py-1.5 rounded-full border transition-all font-medium ${
        active
          ? "bg-[#0B3D52] text-white border-[#0B3D52] shadow-sm"
          : "bg-white text-[#6B8A96] border-[#DDE8EC] hover:border-[#1B6B8A] hover:text-[#1B6B8A]"
      }`}
    >
      {children}
    </button>
  );
}
