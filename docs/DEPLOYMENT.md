# Deployment Guide

> How DentFlow AI gets from code to production.

---

## Environments

| Environment | Branch | URL | Supabase Project | Deployed By |
|------------|--------|-----|-----------------|------------|
| Local | — | `localhost:3000` | `dentflow-dev` | Developer |
| Preview | any PR branch | Vercel auto-URL | `dentflow-dev` | Vercel (auto) |
| Staging | `develop` | `staging.dentflow.ai` | `dentflow-staging` | GitHub Actions |
| Production | `main` (via release tag) | `app.dentflow.ai` | `dentflow-prod` | GitHub Actions |

---

## Automatic Deployments

### Preview deployments
Every PR branch gets its own preview URL from Vercel. No action required. Check the PR comments for the URL.

### Staging
Merging to `develop` automatically triggers a staging deploy via GitHub Actions (`.github/workflows/deploy-staging.yml`). Check Actions tab for status.

### Production
Pushing a `v*` tag to `main` triggers the production deploy and GitHub Release creation. See [RELEASES.md](RELEASES.md) for the full release process.

---

## Environment Variables

### Adding a new variable

1. Add it to `.env.example` with placeholder and comment
2. Add it to Vercel for each environment:
   - Dashboard → Project → Settings → Environment Variables
   - Set for: Production, Preview, Development appropriately
3. Add it to GitHub Actions secrets if needed for CI:
   - Repository → Settings → Secrets and variables → Actions
4. Document the variable in `docs/ARCHITECTURE.md`

### Variable scoping rules

| Variable | Dev | Preview | Staging | Production |
|---------|-----|---------|---------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | dev project | dev project | staging project | prod project |
| `SUPABASE_SERVICE_ROLE_KEY` | dev key | dev key | staging key | prod key |
| `OPENAI_API_KEY` | dev key (low tier) | dev key | dev key | prod key |

**Never use production keys in development or preview environments.**

---

## Database Migrations

Migrations run automatically in CI before tests. In staging and production, migrations must be run manually before deploying application code.

```bash
# Run pending migrations (staging)
SUPABASE_ACCESS_TOKEN=xxx npx supabase db push --project-ref staging-project-ref

# Check migration status
npx supabase db remote status
```

**Migration order matters.** Always run migrations before deploying application code that depends on the new schema.

---

## Rollback

### Application rollback (Vercel)
1. Go to Vercel dashboard → Project → Deployments
2. Find the last known-good deployment
3. Click the three-dot menu → "Promote to Production"
4. This is immediate — no redeploy needed

### Database rollback
Database rollbacks are manual and risky. If a migration cannot be rolled back safely:
- Revert the application code via Vercel rollback (above)
- Write a corrective migration to undo the schema change
- Deploy the corrective migration before redeploying new app code
- **Never run raw SQL against production without a migration file**

---

## Monitoring

After every production deploy:

| Check | Tool | Where |
|-------|------|-------|
| Error rate | Sentry | sentry.io → dentflow-ai project |
| Performance | Vercel Analytics | Vercel dashboard → Analytics |
| Uptime | Vercel | Deployment status |
| Database | Supabase Dashboard | supabase.com → project → logs |

If error rate increases > 5x baseline within 15 minutes of a deploy, roll back immediately and investigate.

---

*Last updated: 2026-05-14*
