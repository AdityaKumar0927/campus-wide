# Bringing Campus Wide to a university

Written for the office that has been asked "can we use this?" It says what the service is, what it is
not, what it needs from you, and what a pilot looks like.

## What it is

A notice board for one campus at a time: questions and answers, events with calendar files, a
marketplace with no payments, lost and found, rides, study groups, roommate notices, polls, and private
messages that never reveal an email address. Every member is a verified holder of a campus mailbox with
a real name derived from their own declaration, checked against their campus UID.

## What it is not

- Not affiliated with, endorsed by, or operated by the university unless the university says so.
- Not connected to any campus system. It cannot read meal plan balances, class rosters, directory data,
  or single sign-on. It never asks for a campus password.
- Not a payment platform. No money moves through it, ever.
- Not anonymous. Every member is identifiable to moderators and, through a lawful request, to the
  university.

## What it needs from you

| Need | Why | Effort |
|---|---|---|
| Confirmation of the campus email domains | The allowlist decides who can join | Five minutes |
| One or two staff or faculty sponsors | Moderators are students; a sponsor is the escalation path | An email |
| A list of safe-exchange spots | Printed in every marketplace thread | Ten minutes |
| A written answer on guest meals | The meal board stays off without it | One email to dining |
| Optional: a signed Data Processing Addendum | Only if you want the service to be official | Legal review |

Nothing on that list requires an integration, a contract, or a budget line.

## What a pilot looks like

**Weeks 1 to 2.** Domains added, two or three student moderators appointed and briefed, safe-exchange
spots entered, meal gifting left off. Questions, events, and lost and found switched on. The board is
seeded with real notices by the moderators so the first visitor does not see an empty room.

**Weeks 3 to 6.** Marketplace and rides switched on once the moderators have handled a few reports and
are comfortable with the decision form. Watch the report queue, the response time, and the block count.

**Week 7 onward.** Review the numbers with the sponsor: members, notices, questions answered, reports
and how fast they were handled, appeals and their outcomes. Decide on meal gifting, roommate notices,
and whether to make the service official.

## What you can verify before saying yes

- The code is public: https://github.com/AdityaKumar0927/campus-wide
- The compliance pack is in `docs/compliance/`: a completed HECVAT, a data map, a security verification
  document, and an incident response outline.
- The member-facing policies are published at `/policies`, including a Data Processing Addendum
  template and a subprocessor list.
- Tenant isolation, moderation rules, rate limits, and the deletion path are covered by automated tests
  that run on every change; the accessibility target (WCAG 2.2 AA) is checked automatically at phone
  and desktop widths.

## Risks, stated plainly

- **It is student-run.** Continuity depends on the maintainers. The data is exportable by every member
  at any time, and the code is open, so a university is never locked in.
- **Students meet students.** The safety design (public spots, no payments, masked contact, one-message
  rule, silent blocking, evidence-preserving reports) reduces harm but does not eliminate it. The house
  rules say so to every member before their first post.
- **Meal sharing is legally narrow.** It is limited to a guest meal used in person with the plan holder
  present, and it is off until your dining office agrees in writing.
- **No cyber insurance and no SOC 2 report.** Both are noted as gaps in the HECVAT.

## Who to contact

Maintainer: [MAINTAINER CONTACT]. Security: [SECURITY CONTACT EMAIL]. Privacy: [PRIVACY CONTACT EMAIL].
