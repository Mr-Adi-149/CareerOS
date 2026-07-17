# Niyukti

A modern, frontend-first recruitment platform built to streamline the hiring experience for both candidates and recruiters. Designed with a focus on speed, user experience, and scalability. 

Niyukti provides a seamless job discovery workflow, role-based user experiences, and a robust component architecture following modern Next.js development practices. It uses static mock data, so no complex database or environment variables are needed to get started.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)

## 🚀 Key Highlights

- **Role-Based Access Control:** Distinct workflows and isolated dashboards for `Candidates` and `Recruiters`.
- **Advanced Job Discovery:** Multi-level filtering, smart sorting, and full-text keyword search.
- **Frictionless Application Flow:** Built-in interactive modals to apply for jobs without context switching.
- **Persistent Shortlist:** Save jobs instantly with local storage persistence across sessions.
- **Recruiter Tools:** Dedicated workspace featuring an integrated Email Composer for applicant communication.
- **Resilient UI:** Graceful error handling, custom 404 pages, skeleton loaders, and fully responsive layouts.

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Context API
- **Routing:** Next.js Dynamic Routing
- **Deployment:** Vercel
- **CI/CD:** GitHub Actions

## 📖 Documentation

For an in-depth look into the platform's architecture, feature breakdowns, routing, and UI/UX decisions, please read the full documentation:

👉 **[View Full Product & Feature Documentation](./DOCUMENTATION.md)**

## 💻 Local Development

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.

Run quality checks with:
```bash
npm run lint
npm run build
```

## 🌐 Deploying

The repository is configured for easy deployment on **Vercel**. 
The default Next.js preset works without additional configuration, and a `vercel.json` is included for clarity. A pre-configured GitHub Actions CI/CD pipeline runs linting and production builds automatically for pushes and pull requests.

## 📁 Structure

- `app/` — Next.js App Router routes, global styles, loading states, and error boundaries.
- `components/` — Reusable UI elements, application modals, and global providers.
- `lib/` — Typed static mock data, context setups, and shared utilities.
- `.github/workflows/` — CI/CD quality gate for GitHub Actions.

