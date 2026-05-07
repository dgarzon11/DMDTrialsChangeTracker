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
  Acronym: string;
  OverallStatus: string;
  BriefSummary: string;
  HasResults: string;
  Condition: string;
  InterventionType: string;
  InterventionName: string;
  PrimaryOutcomeMeasure: string;
  SecondaryOutcomeMeasure: string;
  LeadSponsorName: string;
  LeadSponsorClass: string;
  CollaboratorName: string;
  Sex: string;
  MinimumAge: string;
  MaximumAge: string;
  StdAge: string;
  Phase: string;
  EnrollmentCount: string;
  StudyType: string;
  DesignPrimaryPurpose: string;
  OrgStudyId: string;
  StartDate: string;
  PrimaryCompletionDate: string;
  CompletionDate: string;
  StudyFirstPostDate: string;
  LastUpdatePostDate: string;
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

// Fields to exclude from all visualizations
export const EXCLUDED_FIELDS = new Set([
  "Last Update Post Date",
  "Secondary Id",
  "Minimum Age Months",  // derived from Minimum Age — duplicate change
  "Maximum Age Months",  // derived from Maximum Age — duplicate change
]);

// Semantic grouping of trial statuses
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
  Planned: "#1E7FA8",
  Active: "#2A9D60",
  Closed: "#6B8FA0",
  Unknown: "#8B9EAB",
};

// Color per field-changed category
export const FIELD_COLORS: Record<string, string> = {
  "Overall Status":           "#0B3D52",
  "Enrollment Count":         "#1E7FA0",
  "Brief Summary":            "#2B8FA6",
  "Primary Outcome Measure":  "#4EA1B8",
  "Secondary Outcome Measure":"#7AB5C8",
  "Completion Date":          "#A8CBD6",
  "Primary Completion Date":  "#B8D5DE",
  "Lead Sponsor Name":        "#5E8C9C",
  "New  Study  Added":        "#3A9B6C",
  "Collaborator Name":        "#7A9EAE",
  "Brief Title":              "#D5E3E8",
  "Condition":                "#94B7C3",
  "Has Results":              "#1B6B8A",
  "Intervention Name":        "#4A7F92",
  "Minimum Age Months":       "#B5CFD8",
  "Maximum Age Months":       "#A2C1CC",
  "Org Study Id":             "#8FA9B3",
  "Start Date":               "#6B9EAD",
  "Minimum Age":              "#C2D8DF",
  "Maximum Age":              "#BDD5DC",
  "Std Age":                  "#D0E0E5",
  "Phase":                    "#A0C0CB",
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
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}

export function fmtMonthFull(monthKey: string): string {
  if (!monthKey) return "";
  const [y, m] = monthKey.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
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
  return changes
    .filter((c) => {
      const f = (c.field_changed || "").trim();
      return !EXCLUDED_FIELDS.has(f);
    })
    .map((c) => {
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
