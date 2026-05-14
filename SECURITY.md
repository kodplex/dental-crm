# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in DentFlow AI, **do not open a public GitHub issue**.

Email: security@kodplex.io  
Response time: Within 48 hours  
Disclosure policy: We follow responsible disclosure. We will work with you to understand and fix the issue before any public disclosure.

## Supported Versions

| Version | Security Updates |
|---------|-----------------|
| Latest minor | Yes |
| Previous minor | Critical fixes only |
| Older | No |

## PHI & HIPAA Considerations

DentFlow AI handles Protected Health Information (PHI) as defined under HIPAA. All contributors must:

- Never log PHI in application logs, error tracking, or console output
- Never include real patient data in bug reports or test fixtures
- Report any accidental PHI exposure immediately to security@kodplex.io
- Follow the coding standards for data handling in `docs/CODING_STANDARDS.md`

## Security Controls

- TLS 1.2+ enforced for all traffic (Vercel + Supabase defaults)
- Row-Level Security on all patient-data tables (PostgreSQL)
- Secrets managed via Vercel environment variables (never in code)
- Dependency vulnerability scanning on every PR (GitHub Dependabot)
- Service role key never exposed client-side
