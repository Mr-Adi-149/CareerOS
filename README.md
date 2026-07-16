# Talentlane

A polished, frontend-first job board designed for fast, focused job discovery. It uses static mock data, so no database or environment variables are needed.

## Features

- Keyword search across role, company, skills, and summary
- Combined location, work mode, job type, and experience filters with clear-all
- Newest, relevance, and company-name sorting
- Responsive role cards, saved-job shortlist (persisted in browser local storage), empty states, skeleton loading, and friendly 404 UI
- Dedicated job detail routes with role context, requirements, similar roles, and an accessible mock application flow

## Tech stack

Next.js App Router, React, TypeScript, Tailwind CSS, and static in-project job data.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Run quality checks with:

```bash
npm run lint
npm run build
```

## Deploying

Push this repository to GitHub and import it into Vercel. The default Next.js preset works without configuration; `vercel.json` is included for clarity. The included GitHub Actions workflow runs lint and production build for pushes and pull requests.

## Structure

- `app/` — routes, global styling, loading and error-safe UI
- `components/` — reusable explorer, cards, application modal, and saved-state provider
- `lib/` — typed static data and shared job types
- `.github/workflows/` — CI quality gate

## Assumptions

Jobs and applications are demonstrations. Saving persists in the current browser; applying shows success feedback but intentionally sends no data to a backend.
