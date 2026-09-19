# Incident response outline

A small, student-run service needs a plan that a tired person can follow at 2am. This is that plan.

## Roles

| Role | Who | Reachable at |
|---|---|---|
| Incident lead | The maintainer on call | [ON-CALL CONTACT] |
| Campus liaison | The faculty sponsor | [SPONSOR CONTACT] |
| Communications | The incident lead unless delegated | [SUPPORT CONTACT EMAIL] |

## Severity

| Level | Looks like | First response |
|---|---|---|
| S1 | Member data exposed, authentication bypassed, or the database altered by someone who should not have | Immediately |
| S2 | A member can see another campus's data, or moderation can be evaded | Within 4 hours |
| S3 | Service down, sign-in broken, digests failing | Within 12 hours |
| S4 | A bug with a workaround | Next working day |

## Steps

1. **Contain.** Rotate the affected key in the hosting provider (Supabase keys, `CRON_SECRET`,
   `PUSH_DISPATCH_SECRET`, VAPID, Resend, Groq). Revoke sessions with `signOut({ scope: "global" })`
   for affected members, or pause the campus in the `universities` table.
2. **Preserve.** Snapshot `audit_log`, the relevant `reports`, and the Vercel and Supabase logs before
   anything is changed. Note the time in UTC.
3. **Assess.** What data, whose, for how long, and by whom. The data map says where to look.
4. **Fix.** Ship the smallest change that closes the hole, with a test that fails without it.
5. **Tell people.** Members affected, in plain words, within 72 hours of knowing: what happened, what it
   means for them, what they should do, and what we changed. The campus liaison hears first. If a
   university has signed the DPA, its security contact is notified within 72 hours as the DPA requires.
6. **Write it down.** A short post-mortem in `docs/audits/`: timeline, cause, fix, and what would have
   caught it earlier. No blame, one owner per follow-up.

## Standing preparations

- Nightly encrypted `pg_dump` (ARCHITECTURE.md §9) with the private key held offline.
- `security.txt` and the Security Policy give researchers a way in before an attacker finds one.
- Every moderation and admin action is already in the append-only audit log.
- The rate limits and RLS policies are tested, so "could this have been abused at scale?" has an
  evidence-based answer.
