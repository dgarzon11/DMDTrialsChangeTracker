import Papa from "papaparse";

export interface Change {
  NCTId: string;
  final_date: string;
  start_date: string;
  field_changed: string;
  final_value: string;
  start_value: string;
}

export interface Study {
  NCTId: string;
  BriefTitle: string;
  OverallStatus: string;
  LeadSponsorName: string;
  EnrollmentCount: string;
  Phase: string;
  Timestamp: string;
}

export interface EnrichedChange extends Change {
  sponsor: string;
  field: string;
  monthKey: string;
  monthLabel: string;
  monthShort: string;
  delta?: number;
  isNewStudy: boolean;
}

// Semantic grouping of trial statuses (used for status-change badges)
export const STATUS_GROUPS: Record<string, string> = {
  "Not Yet Recruiting": "Planned",
  "Recruiting": "Active",
  "Active Not Recruiting": "Active",
  "Enrolling By Invitation": "Active",
  "Suspended": "Active",
  "Completed": "Closed",
  "Terminated": "Closed",
  "Withdrawn": "Closed",
  "Available": "Closed",
  "No Longer Available": "Closed",
  "Approved For Marketing": "Closed",
  "Unknown": "Unknown",
};

export const STATUS_GROUP_COLORS: Record<string, string> = {
  Planned: "#0B3D52",
  Active: "#1E7FA0",
  Closed: "#89BDD0",
  Unknown: "#C5DCE4",
};

// Color per field-changed category (used in stacked bar + row accents)
export const FIELD_COLORS: Record<string, string> = {
  "Overall Status":           "#0B3D52",
  "Enrollment Count":         "#1E7FA0",
  "Brief Summary":            "#2B8FA6",
  "Primary Outcome Measure":  "#4EA1B8",
  "Secondary Outcome Measure":"#7AB5C8",
  "Completion Date":          "#A8CBD6",
  "Primary Completion Date":  "#B8D5DE",
  "Lead Sponsor Name":        "#5E8C9C",
  "Last Update Post Date":    "#C8DDE3",
  "New  Study  Added":        "#3A9B6C",
  "Collaborator Name":        "#7A9EAE",
  "Brief Title":              "#D5E3E8",
  "Condition":                "#94B7C3",
  "Has Results":              "#1B6B8A",
  "Intervention Name":        "#4A7F92",
  "Minimum Age Months":       "#B5CFD8",
  "Maximum Age Months":       "#A2C1CC",
  "Org Study Id":             "#8FA9B3",
};

export function fieldColor(field: string): string {
  return FIELD_COLORS[field] ?? "#6B8A96";
}

export function fmtMonth(monthKey: string, style: "short" | "long" = "short"): string {
  if (!monthKey) return "";
  const [y, m] = monthKey.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString("en-US", {
    month: style === "short" ? "short" : "long",
    year: "numeric",
  });
}

export function fmtMonthShort(monthKey: string): string {
  if (!monthKey) return "";
  const [y, m] = monthKey.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

async function parseCsv<T>(url: string): Promise<T[]> {
  const res = await fetch(url);
  const text = await res.text();
  return new Promise((resolve, reject) => {
    Papa.parse<T>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (r) => resolve(r.data),
      error: reject,
    });
  });
}

export async function loadChanges(): Promise<Change[]> {
  return parseCsv<Change>("/data/changes.csv");
}

export async function loadStudies(): Promise<Study[]> {
  return parseCsv<Study>("/data/studies.csv");
}

export function enrich(changes: Change[], sponsorMap: Record<string, string>): EnrichedChange[] {
  return changes.map((c) => {
    const monthKey = c.final_date?.slice(0, 7) || "";
    const field = (c.field_changed || "").trim();
    const startNum = Number(c.start_value);
    const finalNum = Number(c.final_value);
    const delta =
      field === "Enrollment Count" && !Number.isNaN(startNum) && !Number.isNaN(finalNum)
        ? finalNum - startNum
        : undefined;

    return {
      ...c,
      field,
      sponsor: sponsorMap[c.NCTId] || "—",
      monthKey,
      monthLabel: fmtMonth(monthKey, "long"),
      monthShort: fmtMonthShort(monthKey),
      delta,
      isNewStudy: field === "New  Study  Added" || field === "New Study Added",
    };
  });
}
