# DMD Trials Change Tracker

A monitoring dashboard for tracking field-level modifications across registered Duchenne Muscular Dystrophy (DMD) clinical trials on ClinicalTrials.gov.

## Features

- **Total Trials** donut with status-group breakdown (Active / Planned / Closed / Unknown)
- **KPI cards**: total changes, trials affected, new studies added
- **Monthly change volume** stacked bar chart by field type
- **Changes by Field** interactive breakdown (click to filter the table)
- **List of Changes** table, grouped by month, with:
  - Semantic status badges (Recruiting, Completed, etc.)
  - Enrollment deltas with ▲ / ▼ indicators
  - Direct links to ClinicalTrials.gov
  - Search, sort, CSV export
- **Time-range filters**: All months · Last month · Last 3 / 6 months · Last year

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- React 19
- TypeScript
- Tailwind CSS 4
- [Recharts](https://recharts.org)
- [Framer Motion](https://www.framer.com/motion/)
- [PapaParse](https://www.papaparse.com) for CSV parsing

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data

CSV files in `public/data/`:

- `changes.csv` — field-level changes detected between snapshots
- `studies.csv` — latest snapshot of all DMD trials
- `studies_history.csv` — historical snapshots per trial

## Deployment

Optimized for [Vercel](https://vercel.com). Push to the `main` branch and connect the repo in the Vercel dashboard, or run `vercel` from the CLI.
