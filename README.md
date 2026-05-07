# DMD Trials Change Tracker

A monitoring dashboard that tracks field-level changes across all registered Duchenne Muscular Dystrophy (DMD) clinical trials on [ClinicalTrials.gov](https://clinicaltrials.gov). Updated monthly.

## Features

### Overview KPIs
- **Total Trials** donut chart with status-group breakdown (Active / Planned / Closed / Unknown)
- **Total Changes**, **Trials Affected**, **New Studies Added** — each with a sparkline and month-over-month delta badge
- "New Studies" KPI links directly to a filtered view of newly registered trials

### All Trials Table
- Full list of every DMD trial with status pills, phase, enrollment, dates, and sponsor
- Sort by any column · Filter by status group · Search by NCT ID, title, or sponsor
- Study profile popup with full trial details (design, outcomes, summary, change history)
- Export visible rows as `studies.csv`

### List of Changes
- Every field-level change recorded per month, grouped or sorted by any column
- Status changes rendered as coloured pills (Recruiting, Completed, etc.)
- Enrollment deltas with ▲ / ▼ indicators
- Info icon tooltip showing full original → final text (overflow-safe, fixed positioning)
- Click any NCT ID to open the study profile popup
- Search, sort, CSV export

### Study Profile Popup
- At-a-glance stats: phase, enrollment, start date, completion date
- Full metadata: sponsor, collaborators, population, study design, condition, intervention, outcomes
- Expandable brief summary
- Complete change history for that study with status pills and info tooltips

### Filters
- Time range: All · Last month · Last 3 / 6 months · Last year
- Field filter: click any bar in the "Changes by Field" chart to filter the table

## Stack

| Layer | Library |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Charts | [Recharts](https://recharts.org) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| CSV parsing | [PapaParse](https://www.papaparse.com) |

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Updating the data

The dashboard reads two CSV files from `public/data/`:

| File | Contents |
|---|---|
| `changes.csv` | Field-level changes detected between monthly snapshots |
| `studies.csv` | Latest snapshot of all DMD trials |

To publish a new month of data:

1. Replace both files with the updated versions
2. Commit and push to `main`

```bash
git add public/data/changes.csv public/data/studies.csv
git commit -m "data: update to <month YYYY>"
git push
```

If the app is deployed on Vercel it will redeploy automatically.

## Deployment

Optimised for [Vercel](https://vercel.com). Connect the repo in the Vercel dashboard — no additional configuration needed. Every push to `main` triggers a new deployment.
