# 🦷 DentFlow AI — Dental Clinic CRM

> AI-powered customer relationship management system for modern dental clinics.  
> Built with [Next.js](https://nextjs.org), [Supabase](https://supabase.com), and AI-native workflows.

[![CI](https://github.com/kodplex/dental-crm/actions/workflows/ci.yml/badge.svg)](https://github.com/kodplex/dental-crm/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/kodplex/dental-crm)](https://github.com/kodplex/dental-crm/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What is DentFlow AI?

DentFlow AI is a purpose-built CRM for dental clinics that replaces disconnected spreadsheets, phone-tag scheduling, and paper treatment histories with a unified, AI-enhanced platform. It helps front-desk staff, dentists, and clinic owners manage patients, automate appointment follow-ups, surface clinical insights, and track revenue — all from a single interface.

**Core capabilities:**
- Patient lifecycle management (intake, records, communication history)
- Smart appointment scheduling with AI-powered gap detection
- Treatment plan tracking and digital consent forms
- AI-generated clinical summaries and next-visit recommendations
- Billing integration and revenue analytics
- Multi-clinic support for group practices

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| AI | OpenAI GPT-4o via Vercel AI SDK |
| Deployment | Vercel (preview + production) |
| CI/CD | GitHub Actions |
| Monitoring | Vercel Analytics + Sentry |

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- A Supabase account (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/kodplex/dental-crm.git
cd dental-crm
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
```

### 3. Run database migrations

```bash
npx supabase db push
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
dental-crm/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth routes (login, signup, reset)
│   ├── (protected)/            # Authenticated routes
│   │   ├── dashboard/          # Clinic overview & KPIs
│   │   ├── patients/           # Patient management
│   │   ├── appointments/       # Scheduling
│   │   └── ai-insights/        # AI-powered analytics
│   └── api/                    # API routes
├── components/                 # Shared UI components
├── lib/
│   ├── ai/                     # AI utilities (prompts, streaming)
│   └── supabase/               # Supabase client helpers
├── supabase/
│   └── migrations/             # Database migrations (versioned)
├── docs/                       # All project documentation
│   ├── AGENT.md                # AI agent operating guide
│   ├── SKILLS.md               # Agent capability catalogue
│   ├── ARCHITECTURE.md         # System design
│   ├── RELEASES.md             # Release management guide
│   ├── BRANCHING_STRATEGY.md   # Git workflow
│   ├── CODING_STANDARDS.md     # Code conventions
│   ├── TESTING.md              # Testing strategy
│   ├── DEPLOYMENT.md           # Deploy guide
│   ├── SEMANTIC_VERSIONING.md  # Versioning rules
│   └── features/               # Per-feature specs & changelogs
└── .github/
    ├── ISSUE_TEMPLATE/         # Issue forms
    ├── PULL_REQUEST_TEMPLATE.md
    └── workflows/              # CI/CD pipelines
```

---

## For Developers

> **If you are new to this repo — start here.** The docs folder contains everything you need to work autonomously without a PM.

| Document | Read When |
|----------|-----------|
| [CONTRIBUTING.md](CONTRIBUTING.md) | Before your first commit |
| [docs/BRANCHING_STRATEGY.md](docs/BRANCHING_STRATEGY.md) | Before creating a branch |
| [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md) | Before writing any code |
| [docs/TESTING.md](docs/TESTING.md) | Before submitting a PR |
| [docs/RELEASES.md](docs/RELEASES.md) | Before merging to main |
| [docs/SEMANTIC_VERSIONING.md](docs/SEMANTIC_VERSIONING.md) | When bumping versions |
| [PRD.md](PRD.md) | When unclear on product direction |

## For AI Agents

| Document | Purpose |
|----------|---------|
| [docs/AGENT.md](docs/AGENT.md) | Operating instructions for AI agents |
| [docs/SKILLS.md](docs/SKILLS.md) | What this agent can do |

---

## Releasing

Releases follow [Semantic Versioning](docs/SEMANTIC_VERSIONING.md). See the [Releases guide](docs/RELEASES.md) and the [Changelog](CHANGELOG.md).

Current version: v0.1.0 (Foundation)  
Next milestone: v0.2.0 (Patient Management MVP)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide. Quick checklist:

- Branch from `develop`, not `main`
- Use conventional commit messages (`feat:`, `fix:`, `docs:` ...)
- All tests pass (`npm test`)
- PR links the GitHub issue it resolves
- Feature doc in `docs/features/` is updated

---

## License

MIT © [Kodplex](https://github.com/kodplex)
