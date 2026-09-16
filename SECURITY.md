# Security policy

Campus Wide handles verified student identities, so security reports are taken seriously and handled privately.

## Supported versions

Only the `main` branch is supported. There are no versioned releases yet: fixes land on `main` and deploy from there. Forks and deployments operated by individual universities are supported by their operators.

## How to report a vulnerability

Report privately through GitHub's private vulnerability reporting:

**https://github.com/AdityaKumar0927/campus-wide/security/advisories/new**

Do **not** open a public issue, pull request, or discussion for anything you believe is a security problem. Public reports may be converted to a private advisory and locked.

A useful report includes: the affected route, table, policy, or file; steps or a proof of concept; the impact you believe it has (for example cross-tenant data read, privilege escalation, email disclosure); and, if relevant, the browser and account role used. Please do not access, modify, or retain other people's data beyond what is needed to demonstrate the issue, and do not include other students' personal data in the report.

## Response targets

Campus Wide is a volunteer-run open-source project. These are goals, not guarantees:

| Step | Goal |
|---|---|
| Acknowledge the report | within 72 hours |
| Triage and severity assessment | within 7 days |
| Fix for critical issues | within 14 days |
| Fix for other issues | prioritised by severity, in the next reasonable change to `main` |

You will be kept informed through the advisory thread and credited in the published advisory unless you prefer otherwise.

## Scope

- The application in this repository: the Next.js app, Server Actions, and route handlers under `src/`
- The API surface exposed by the app (`/api/*`)
- The Data Access Layer (`src/lib/dal/`) and the Postgres Row-Level Security policies defined alongside the schema
- Authentication, session, and consent flows
- The service worker and PWA shell
- Email content produced by the app (auth, relay, moderation, digests)
- CI workflows and repository configuration

Of particular interest: tenant isolation bypass (reading or writing another university's rows), authorization bypass in the DAL or RLS, exposure of student email addresses, CSP or security-header weaknesses, SSRF through outbound fetches, rate-limit bypass, and secret leakage.

## Out of scope

- Third-party services the project depends on. Report those to the vendor directly: Supabase, Vercel, Resend, Upstash, and Cloudflare (Turnstile).
- Issues that require a compromised device, a malicious browser extension, or physical access.
- Volumetric denial of service, brute force against rate-limited endpoints, or automated scanner output without a demonstrated impact.
- Missing best-practice headers or configuration on domains not operated by this project.
- Social engineering of maintainers, moderators, or students.

## Safe harbour

Security research carried out in good faith and in line with this policy is welcome. If you make a good-faith effort to comply with this policy (report privately, avoid privacy violations, data destruction, and service disruption, and do not exploit an issue beyond what is needed to demonstrate it), the maintainers will not pursue or support legal action against you for that research and will work with you to understand and resolve the issue quickly. If you are unsure whether something is in scope, ask through the advisory link above before proceeding.

## Security design in brief

Authorization is enforced in the Data Access Layer (`src/lib/dal/`) **and** in Postgres Row-Level Security policies; every domain table carries a `university_id`, and both layers are tested for cross-tenant isolation. Next.js middleware (`proxy.ts`) only refreshes the session, sets security headers, and redirects for UX; it is never the security boundary on its own (see CVE-2025-29927 and `ARCHITECTURE.md` §10).

## security.txt

A machine-readable copy of this contact information is published at `/.well-known/security.txt` (RFC 9116); the source is `public/.well-known/security.txt`.
