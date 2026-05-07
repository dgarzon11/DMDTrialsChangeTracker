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
      {/* Row 1: Title + curated by */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-baseline gap-2">
            <span className="text-[#0B3D52]">DMD Clinical Trials</span>
            <span className="text-[#89BDD0] font-light text-xl">·</span>
            <span className="text-[#1B6B8A]">Monthly Change Tracker</span>
          </h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "60px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="h-0.5 bg-gradient-to-r from-[#1B6B8A] to-[#7BAFC4] rounded-full mt-1"
          />
          <p className="text-sm text-[#6B8A96] mt-1">
            Tracking field-level changes on a monthly basis · Source:{" "}
            <a href="https://clinicaltrials.gov" target="_blank" rel="noopener noreferrer" className="text-[#1B6B8A] hover:underline">
              ClinicalTrials.gov
            </a>
          </p>
        </div>
        <a
          href="https://shr.pn/DGsandbox"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-end group flex-shrink-0 mt-0.5"
        >
          <span className="text-[10px] text-[#9BB0BB] uppercase tracking-widest">Curated by</span>
          <span className="flex items-center gap-1 text-[13px] font-semibold text-[#3A6B7A] group-hover:text-[#1B6B8A] transition-colors">
            Diego Garzón
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100 transition-opacity">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </span>
        </a>
      </div>

      {/* Row 2: Filter pills + date range */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {OPTIONS.map((opt) => (
            <Pill key={opt.value} active={timeRange === opt.value} onClick={() => onSelectRange(opt.value)}>
              {opt.label}
            </Pill>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-[#6B8A96] bg-white px-3 py-1.5 rounded-lg border border-[#DDE8EC] flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3A9B6C] animate-pulse" />
          <span className="font-mono">{dateRange}</span>
        </div>
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
      className={`text-xs px-3.5 py-1.5 rounded-full border transition-all duration-150 active:scale-95 font-medium ${
        active
          ? "bg-[#0B3D52] text-white border-[#0B3D52] shadow-sm"
          : "bg-white text-[#6B8A96] border-[#DDE8EC] hover:border-[#1B6B8A] hover:text-[#1B6B8A]"
      }`}
    >
      {children}
    </button>
  );
}
