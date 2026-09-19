# HECVAT responses (Full 4.1.5 structure)

The Higher Education Community Vendor Assessment Toolkit asks a vendor the questions a university
security office would otherwise ask by email. Answers below are written against what the code does
today; anything not built yet says so. Section numbering follows HECVAT Full 4.1.5.

**Product**: Campus Wide, a campus notice board for verified members of one university.
**Vendor**: [LEGAL ENTITY NAME], [JURISDICTION]. Student-run, free to the institution.
**Last reviewed**: 2026-09-19. **Contact**: [SECURITY CONTACT EMAIL].

## General information (GENR)

| # | Question | Answer |
|---|---|---|
| GENR-01 | Describe the service | A notice board: questions and answers, events, a no-payment marketplace, meal gifting where the institution allows it, lost and found, rides, study groups, roommate notices, polls, and private relay messages between verified members of one campus. |
| GENR-02 | Is institutional data stored? | Yes: campus email address, the UID within it, a declared name, and the content members write. No grades, no financial data, no health data, no identity documents, no photographs of people. |
| GENR-03 | Is the service multi-tenant? | Yes. Every row carries `university_id` and Postgres row-level security enforces the boundary; 52 automated tests prove one campus cannot read another rows. |
| GENR-04 | Where is data hosted? | Supabase on AWS us-east-1; application hosting on Vercel with functions in iad1. |
| GENR-05 | Subcontractors | Supabase, Vercel, and optionally Resend, Groq, and GitHub. See the Subprocessor List. |
| GENR-06 | Is a SOC 2 report available for the vendor? | No. The vendor is a student project. Reports for the infrastructure providers are available from them directly. |

## Documentation (DOCU)

| # | Question | Answer |
|---|---|---|
| DOCU-01 | Policies published? | Yes: 16 documents at `/policies`, versioned in the database, with acceptance recorded per member per version. |
| DOCU-02 | Data flow diagram | `docs/compliance/data-map.md`. |
| DOCU-03 | Incident response plan | `docs/compliance/incident-response.md`. |
| DOCU-04 | Change management | Every change ships through a pull request with typecheck, lint, unit tests, database integration tests, end-to-end tests with accessibility checks, dependency audit, CodeQL, and secret scanning. `main` is protected. |

## Company overview (COMP)

| # | Question | Answer |
|---|---|---|
| COMP-01 | Years in operation | Pilot stage, first campus 2026. |
| COMP-02 | Cyber insurance | None. [PLACEHOLDER: institutions requiring coverage should treat this as a gap.] |
| COMP-03 | Background checks on staff | Not applicable: maintainers are students; moderators are appointed by the campus admin and named in the audit log. |

## Application and interface security (AAIS)

| # | Question | Answer |
|---|---|---|
| AAIS-01 | Authentication | One-time code emailed to the campus address. The service never sees a campus password and never connects to institutional single sign-on, by design and because the institution acceptable use policy forbids third-party auth with campus credentials. |
| AAIS-02 | Authorization | Two independent layers: Postgres RLS and an application data access layer. Roles live in `memberships`, never in the token, so a demotion applies on the next request. |
| AAIS-03 | Session management | Sessions expire after 30 days; the member sees every signed-in device and can end any of them or all of them. |
| AAIS-04 | Input validation | Zod at every server action and route boundary; content is plain text with link detection, never rendered as HTML or Markdown. |
| AAIS-05 | Output encoding | React escapes everything by default; no `dangerouslySetInnerHTML` anywhere in the application. |
| AAIS-06 | Secure headers | Content Security Policy with a per-request nonce and `strict-dynamic`, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and cross-origin isolation headers. Asserted on every response by an automated test. |
| AAIS-07 | Vulnerability disclosure | `/.well-known/security.txt` and a published Security Policy with a three-working-day acknowledgement. |
| AAIS-08 | Penetration test | Not yet commissioned. Automated static analysis (CodeQL) runs on every push. [PLACEHOLDER for an institution that wishes to fund one.] |

## Datacenter and infrastructure (DCTR)

| # | Question | Answer |
|---|---|---|
| DCTR-01 | Physical security | Inherited from AWS through Supabase and from Vercel. The vendor operates no hardware. |
| DCTR-02 | Environment separation | Local development runs the entire stack in Docker; preview deployments are separate builds; production is a separate Supabase project. |
| DCTR-03 | Backups | Nightly encrypted logical dumps retained 30 days, plus the provider own backups. |

## Consulting (CONS)

Not applicable: no professional services are sold.

## Change management (CHNG)

Covered under DOCU-04. Database changes are versioned SQL migrations applied in order, reviewed in the
same pull request as the code that needs them, and tested against a disposable local stack in CI.

## Disaster recovery (DISA)

| # | Question | Answer |
|---|---|---|
| DISA-01 | RTO | Best effort, target 24 hours. The application is stateless and redeployable in minutes; the database is the only stateful component. |
| DISA-02 | RPO | 24 hours from the nightly dump; less in practice because the provider keeps its own point-in-time backups on paid tiers. |
| DISA-03 | Tested? | Restore into a scratch project is on the launch checklist. |

## Firewalls, IDS, IPS, networking (FIRE)

Managed by the providers. The application is reachable only over HTTPS; the database is reachable only
with a key, and the anonymous key can do nothing that row-level security does not allow.

## Policies, procedures, and processes (PPPR)

| # | Question | Answer |
|---|---|---|
| PPPR-01 | Acceptable use | Published as the Community Guidelines, accepted by every member. |
| PPPR-02 | Content moderation | Notice-and-action reporting with automatic evidence capture, a human decision within 48 hours, a written statement of reasons, and one appeal to a different moderator. No automated system takes an action. |
| PPPR-03 | Data retention | Published in the Privacy Notice and implemented by scheduled jobs. |
| PPPR-04 | Law enforcement requests | Published policy: minimum necessary, valid process, member notified unless barred. |

## Product evaluation (PROD)

A campus can trial the service without signing anything: a moderator or administrator can be appointed,
modules switched on or off individually, and every switch is immediate and reversible. Meal gifting
stays off until the dining office confirms in writing.

## Quality assurance (QUAL)

Automated gates on every change: TypeScript, ESLint, unit tests, 52 database integration tests covering
tenancy and every trust-and-safety rule, end-to-end tests at 390 px and 1440 px including automated
WCAG 2.2 AA checks, dependency audit, CodeQL, and secret scanning.

## Privacy (PRIV)

| # | Question | Answer |
|---|---|---|
| PRIV-01 | Data minimisation | No photographs of people, no phone numbers, no payment details, no precise location, no identity documents. |
| PRIV-02 | FERPA | The service holds no education records. Member content is not an education record, and the institution is not the source of the data: members supply it directly. |
| PRIV-03 | GDPR | Export and deletion are self-service; the legal bases are published; a Data Processing Addendum template is available for an institution that adopts the service. |
| PRIV-04 | Advertising or profiling | None. No advertising, no data sales, no tracking cookies, no profiling. Global Privacy Control is honoured. |
| PRIV-05 | AI | Browser-side models run on the member device and send nothing. The optional server fallback is off unless the institution switches it on, and its input is stripped of identifiers first. No member data is used to train any model. |

## Systems management (SYST)

Logging: append-only audit trail in the database, plus provider request logs. Monitoring: health
endpoint, scheduled job results recorded in the database, and delivery counts per digest run.

## Vulnerability scanning (VULN)

CodeQL on every push and weekly; `pnpm audit --audit-level high` on every build; Dependabot with
grouped weekly updates; secret scanning on every push and on the full history.

## Third-party assessments (THRD)

None commissioned. The code is public, so an institution may review it directly:
https://github.com/AdityaKumar0927/campus-wide
