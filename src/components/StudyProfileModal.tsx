"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Study, EnrichedChange, STATUS_GROUPS, STATUS_GROUP_COLORS } from "@/lib/data";

interface Props {
  study: Study;
  changes: EnrichedChange[];
  onClose: () => void;
}

function fmtDate(d: string): string {
  if (!d) return "—";
  const parts = d.split("-");
  if (parts.length < 2) return d;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(parts[1], 10) - 1] ?? ""} ${parts[0]}`;
}

/* ── Change value renderer with status pills ───────────────── */
function renderChangeValue(c: EnrichedChange, side: "start" | "final") {
  const raw = side === "start" ? c.start_value : c.final_value;
  if (!raw) return <span className="text-[#C5DCE4]">—</span>;
  if (c.field === "Overall Status") {
    const group = STATUS_GROUPS[raw] ?? "Unknown";
    const color = STATUS_GROUP_COLORS[group];
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
        style={{ background: `${color}22`, color }}
      >
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
        {raw}
      </span>
    );
  }
  return <span className="truncate">{raw}</span>;
}

/* ── Single change row with info tooltip ───────────────────── */
function ChangeRow({ c }: { c: EnrichedChange }) {
  const [tipPos, setTipPos] = useState<{ x: number; y: number } | null>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  return (
    <div className="grid grid-cols-[90px_160px_1fr_1fr] gap-x-3 px-4 py-2 border-b border-[#F8FAFB] last:border-0 hover:bg-[#F8FAFB] items-center">
      {/* Date */}
      <span className="text-[11px] text-[#6B8A96]">{c.monthLabel}</span>

      {/* Field */}
      <span className="text-[11px] font-medium text-[#0B3D52] truncate" title={c.field}>
        {c.isNewStudy ? "New study added" : c.field}
      </span>

      {/* From */}
      {c.isNewStudy ? <span /> : (
        <span className="text-[11px] text-[#6B8A96] text-right flex justify-end items-center min-w-0">
          {renderChangeValue(c, "start")}
        </span>
      )}

      {/* → To with info icon */}
      {c.isNewStudy ? <span /> : (
        <div className="flex items-center gap-1 min-w-0">
          {/* Info icon */}
          <div
            ref={iconRef}
            className="flex-shrink-0 cursor-default"
            onMouseEnter={() => {
              if (iconRef.current) {
                const r = iconRef.current.getBoundingClientRect();
                const tipW = 304;
                const tipH = 110;
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
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>

          {/* Fixed-position tooltip — not clipped by overflow */}
          {tipPos && (
            <div
              style={{ position: "fixed", left: tipPos.x, top: tipPos.y, zIndex: 9999, maxWidth: "19rem" }}
              className="bg-[#0B3D52] text-white text-[11px] rounded-xl px-3 py-2.5 shadow-xl leading-relaxed pointer-events-none break-words"
            >
              <p className="text-[#7BAFC4] font-semibold mb-1.5 uppercase tracking-wider text-[10px]">{c.field}</p>
              <p><span className="text-[#A8CEDB]">From: </span><span className="text-white">{c.start_value || "—"}</span></p>
              <p className="mt-1"><span className="text-[#A8CEDB]">To: </span><span className="text-white font-medium">{c.final_value || "—"}</span></p>
            </div>
          )}

          <span className="text-[#C5DCE4] text-xs flex-shrink-0">→</span>
          <span className="text-[11px] text-[#1A2E38] font-medium truncate min-w-0 flex items-center">
            {renderChangeValue(c, "final")}
          </span>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B8A96] mb-1.5">{title}</p>
      {children}
    </div>
  );
}

function Tag({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <span className="text-xs text-[#1A2E38]">
      <span className="text-[#6B8A96]">{label}: </span>{value}
    </span>
  );
}

export default function StudyProfileModal({ study, changes, onClose }: Props) {
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const group = STATUS_GROUPS[study.OverallStatus] ?? "Unknown";
  const groupColor = STATUS_GROUP_COLORS[group];

  const sortedChanges = [...changes].sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60] flex items-center justify-center p-6"
        onClick={onClose}
      >
        <motion.div
          key="panel"
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl border border-[#DDE8EC] w-full max-w-4xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ─────────────────────────────── */}
          <div className="px-7 pt-6 pb-5 border-b border-[#EEF4F6] flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* NCT ID row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-3xl font-mono font-bold text-[#1B6B8A] tracking-tight">
                    {study.NCTId}
                  </span>
                  {study.Acronym && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#EAF4F8] text-[#1B6B8A]">
                      {study.Acronym}
                    </span>
                  )}
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ background: `${groupColor}22`, color: groupColor }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: groupColor }} />
                    {study.OverallStatus}
                  </span>
                  {study.HasResults === "true" && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#E8F5EE] text-[#2A9D60]">
                      Has Results
                    </span>
                  )}
                </div>
                {/* Title */}
                <p className="mt-2 text-[15px] font-semibold text-[#0B3D52] leading-snug pr-4">
                  {study.BriefTitle}
                </p>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                <a
                  href={`https://clinicaltrials.gov/study/${study.NCTId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#1B6B8A] hover:text-[#0B3D52] border border-[#DDE8EC] hover:border-[#1B6B8A] px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  ClinicalTrials.gov
                </a>
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F2F6F8] text-[#6B8A96] hover:text-[#0B3D52] transition-colors text-lg"
                >✕</button>
              </div>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-4 gap-3 mt-5">
              {[
                { label: "Phase", value: study.Phase || "—" },
                { label: "Enrollment", value: study.EnrollmentCount ? Math.round(parseFloat(study.EnrollmentCount)).toLocaleString() + " participants" : "—" },
                { label: "Start Date", value: fmtDate(study.StartDate) },
                { label: "Completion", value: fmtDate(study.CompletionDate) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#F8FAFB] rounded-xl px-4 py-3 border border-[#EEF4F6]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B8A96]">{label}</p>
                  <p className="text-sm font-bold text-[#0B3D52] mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Scrollable body ─────────────────────── */}
          <div className="overflow-y-auto flex-1 min-h-0 px-7 py-5 space-y-5">

            {/* Two-column section */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {/* Left column */}
              <div className="space-y-4">
                <Section title="Sponsor">
                  <p className="text-sm font-semibold text-[#0B3D52]">{study.LeadSponsorName || "—"}</p>
                  {study.LeadSponsorClass && (
                    <p className="text-xs text-[#6B8A96] mt-0.5">{study.LeadSponsorClass}</p>
                  )}
                  {study.CollaboratorName && (
                    <p className="text-xs text-[#6B8A96] mt-1.5">
                      <span className="font-medium text-[#4A6572]">Collaborators: </span>
                      {study.CollaboratorName}
                    </p>
                  )}
                </Section>

                <Section title="Population">
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    <Tag label="Sex" value={study.Sex} />
                    {(study.MinimumAge || study.MaximumAge) && (
                      <span className="text-xs text-[#1A2E38]">
                        <span className="text-[#6B8A96]">Age: </span>
                        {study.MinimumAge || "—"} – {study.MaximumAge || "—"}
                      </span>
                    )}
                    <Tag label="Group" value={study.StdAge} />
                  </div>
                </Section>

                <Section title="Study Design">
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    <Tag label="Type" value={study.StudyType} />
                    <Tag label="Purpose" value={study.DesignPrimaryPurpose} />
                  </div>
                </Section>

                {study.OrgStudyId && (
                  <Section title="Study ID">
                    <p className="text-xs font-mono text-[#1A2E38]">{study.OrgStudyId}</p>
                  </Section>
                )}
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {study.Condition && (
                  <Section title="Condition">
                    <p className="text-xs text-[#1A2E38]">{study.Condition}</p>
                  </Section>
                )}

                {study.InterventionName && (
                  <Section title="Intervention">
                    <p className="text-xs text-[#1A2E38]">
                      {study.InterventionType && (
                        <span className="text-[#6B8A96]">{study.InterventionType}: </span>
                      )}
                      {study.InterventionName}
                    </p>
                  </Section>
                )}

                {study.PrimaryOutcomeMeasure && (
                  <Section title="Primary Outcome">
                    <p className="text-xs text-[#1A2E38] line-clamp-4">{study.PrimaryOutcomeMeasure}</p>
                  </Section>
                )}

                {study.SecondaryOutcomeMeasure && (
                  <Section title="Secondary Outcome">
                    <p className="text-xs text-[#1A2E38] line-clamp-3">{study.SecondaryOutcomeMeasure}</p>
                  </Section>
                )}
              </div>
            </div>

            {/* Brief Summary — full width */}
            {study.BriefSummary && (
              <div className="border-t border-[#EEF4F6] pt-5">
                <Section title="Brief Summary">
                  <p className={`text-xs text-[#1A2E38] leading-relaxed ${summaryExpanded ? "" : "line-clamp-4"}`}>
                    {study.BriefSummary}
                  </p>
                  <button
                    onClick={() => setSummaryExpanded(!summaryExpanded)}
                    className="mt-1.5 text-[10px] font-medium text-[#1B6B8A] hover:underline"
                  >
                    {summaryExpanded ? "Show less ↑" : "Show more ↓"}
                  </button>
                </Section>
              </div>
            )}

            {/* Change History */}
            <div className="border-t border-[#EEF4F6] pt-5">
              <Section title={`Change History · ${sortedChanges.length} record${sortedChanges.length !== 1 ? "s" : ""}`}>
                {sortedChanges.length === 0 ? (
                  <p className="text-xs text-[#6B8A96] py-3 text-center">No recorded changes for this study.</p>
                ) : (
                  <div className="rounded-xl border border-[#EEF4F6] overflow-hidden mt-2">
                    <div className="grid grid-cols-[90px_160px_1fr_1fr] gap-x-3 px-4 py-2 bg-[#F8FAFB] border-b border-[#EEF4F6] text-[10px] font-semibold text-[#6B8A96] uppercase tracking-wider">
                      <span>Date</span>
                      <span>Field</span>
                      <span className="text-right">From</span>
                      <span>→ To</span>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {sortedChanges.map((c, i) => (
                        <ChangeRow key={i} c={c} />
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
