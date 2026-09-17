# Illinois Tech pilot: identity, safety, and meal sharing

**Status:** design, 2026-09-17. Pilot campus: Illinois Institute of Technology (Mies Campus, Chicago).
Facts were verified from official Illinois Tech pages on 2026-09-17; sources are listed in §10.
This document extends `ARCHITECTURE.md` for the pilot; where they differ, this document wins.

## 1. The threat model, in plain terms

The people this design must stop, in the order they will actually show up:

| Actor | What they try | What stops them |
|---|---|---|
| Someone who is not an Illinois Tech student | Create an account to reach students (scams, predation) | Sign-in only by proving control of a campus mailbox, checked at the database; no self-asserted identity anywhere |
| A student using a fake or borrowed identity | Post as someone else, dodge accountability | Every profile carries the university-issued UID; the declared name is locked once and cross-checked against it; no photo-based verification exists to fool |
| The no-show or the liar | "I'll treat you at the Commons at 6" and never appears; claims a plan they do not have | Meetups only at the dining hall entrance during service; nothing changes hands before the swipe; no-show reports and strikes; self-reported plan badge is labelled as such |
| The scammer | Deposits, off-platform payment, "my cousin will bring it" | No payments anywhere; payment-word detection warns and flags; handoffs confirmed by both sides |
| The harasser or stalker | Persistent messages, showing up at meetups, tracking someone's posts | One-message rule for strangers, instant silent block, privacy mode, no locations finer than a building, evidence retained for reporting to Public Safety or Title IX |
| The account sharer | Lends their login to a non-student | Sessions are listed and revocable, re-authentication every 30 days, unusual-location sign-in notices |
| The impersonator with AI | Deepfaked ID cards, generated selfies | Irrelevant: the platform never asks for an image to prove who you are |

## 2. Identity: verified by the campus mailbox, anchored to the UID, never by pictures

**What Illinois Tech actually runs (verified 2026-09-17).** Email and identity moved to Microsoft 365
in December 2024; Google Workspace access ended in April 2025. Students are `UID@hawk.illinoistech.edu`
(legacy `@hawk.iit.edu` still delivers), faculty and staff `@illinoistech.edu` (legacy `@iit.edu`).
Sign-on is Okta ("Access Illinois Tech") with mandatory MFA. The university-issued username is the
**UID** (also "portal ID"), the first part of the email address, e.g. `jdoe01`; the physical photo ID is the
**HawkCard**; the student number is the **A-number**, which this platform never collects. The Acceptable
Use Policy (v2.3) prohibits "creating programs, web forms, or other mechanisms that authenticate using
Illinois Tech credentials" and any third-party connection to Microsoft 365 "without prior approval",
which requires a department-sponsored OTS review. *(sources in §9)*

**Decision I-1: prove mailbox ownership, never touch credentials.** Sign-in sends a six-digit code (and
a magic link) to the student's campus address. The student reads it in Outlook; the platform never sees
an Illinois Tech password, never talks to Okta or Microsoft 365, and never asks for a photo, ID scan, or
selfie. This is the answer to AI-generated images: there is no image to fake. It is also the only
approach the AUP permits without a university sponsor. If Illinois Tech later sponsors an SSO
integration, the memberships table already carries `sso_provider_id`.

Server-side gates on every sign-in (the browser is never trusted):
1. The address domain is on the campus allowlist (`hawk.illinoistech.edu`, `hawk.iit.edu` as student;
   `illinoistech.edu`, `iit.edu` as staff), enforced by a database hook that also rejects direct calls to
   the Auth API made with the publishable key.
2. Cloudflare Turnstile is required by Supabase Auth itself, and the app rate-limits sign-in attempts.
3. Codes expire in ten minutes, one request per minute per address; five wrong codes lock the address
   for an hour.

**Decision I-2: the UID is the name that matters.** Every profile shows the UID as the handle
(`@jdoe01`), copied from the verified address and impossible to edit. It maps to exactly one person in
Illinois Tech's own systems, so a report handed to the Dean of Students or Public Safety identifies the
account holder without the platform holding any more data. Beside the UID, a human name is shown:
- At onboarding the student types their first name and family name **once**. The platform locks it. The
  only way to change it afterwards is a moderator, in person, looking at a HawkCard.
- The name is cross-checked against the UID pattern Illinois Tech uses (first initial + family name +
  digits). "Jane Doe" with `jdoe01` earns a "name matches UID" mark; a mismatch (preferred names, long
  surnames, hyphenation) is allowed but shows "name as declared" until a moderator confirms it in person.
- Display is `First name + family initial` ("Jane D.") plus the UID; the full name appears to moderators
  and inside a relay thread after both people opt in. Registrar preferred first names are respected by
  letting the student enter that name; the platform never looks up or surfaces legal names.
- Profile photos do not exist in the pilot. Initials on a paper-stock disc identify people; item photos on
  listings are allowed because they describe objects, not people.

**Decision I-3: affiliation is re-proved every term.** Graduates keep their mailbox for about twelve
months and can opt into forwarding after that, so an address proves affiliation, not current enrollment.
Each term (August and January) the platform requires a fresh code and a one-line attestation ("I am a
current Illinois Tech student"). Accounts that do not re-verify within 30 days become read-only and move
to the `alumni` role; a later verification restores them. Faculty and staff addresses get the `staff`
role, which can moderate but not offer or accept meal treats.

**What we never collect:** the A-number, HawkCard number, Okta password, phone numbers, home addresses,
room numbers, dates of birth (only an age attestation), or any government ID.
## 3. Meal plans at Illinois Tech: what exists, what is shareable, and how the board works

**What the university runs (verified 2026-09-17; sources in §10).** Dining is operated by Chartwells
as "Illinois Tech Culinary and Hospitality Services". The residential hall is **The Commons** in the
McCormick Tribune Campus Center: tap your HawkCard once at the register, eat as much as you like while
you stay. Retail spots take meal exchanges, Bonus Points, and TechCash: **Center Court** and **Global
Grounds** (both in the MTCC), **John + Pat Anderson's Café** (Kaplan Institute), **The Bog** (Hermann
Hall, evenings), and the mobile-order-only **Tech Yeah Market**.

2026–27 plans (per semester): **All Access** (unlimited swipes, 35 meal exchanges, **10 guest meals**,
$100 Bonus Points); **Flex 300** (300 swipes, 30 exchanges); **Block 230**, **Block 150**, **Block 50**.
First- and second-year residents must hold All Access or Flex 300; residents without an in-unit kitchen
need at least Block 230; residents with kitchens at least Block 50; commuters may buy any plan. Swipes and
exchanges expire at the end of each semester (Fall 2026: 12 December 2026); Bonus Points roll fall to
spring only with an active spring plan. Balances are visible only after Illinois Tech login on the CBORD
GET portal; there is no third-party API, and the dining site's balance feature is switched off.

**The rules that bind everything.** "The cardholder must be present to activate meal swipes, bonus
points, and/or meal exchanges." The HawkCard is non-transferable and university property; residents "may
not lend their HawkCard to any other person"; "permitting another person to wrongly use the ID with the
intent to obtain University services, privileges, or goods" is prohibited; the Code of Conduct reaches
both parties through its misuse-of-ID, unauthorised-use, and complicity clauses, with sanctions up to
loss of housing. No official text permits selling or trading swipes, and no transfer mechanism exists.
The Room and Board Contract itself sits behind the housing portal and could not be read; the owner, as a
student, should read its dining clause before the board is switched on.

**So what can be shared, legally?** Exactly one thing: an **All Access holder's guest meal, used in
person at The Commons, with the holder standing at the register.** That is a normal, sanctioned use of a
guest meal (a friend is a guest). Nothing else is shareable: not swipes, not exchanges, not Bonus Points,
not TechCash, not the card. Flex and Block holders have no guest meals and therefore nothing to offer.
There is also no Illinois Tech meal-donation program to route anything into, so the board must never
imply one exists.

**Decision M-1: the board is "Guest meal treats at The Commons" and nothing broader.**
- An **offer** is posted only by a student who has attested this term that they hold All Access. It
  names a meal period (breakfast, lunch, dinner) on a date, and how many guest meals they are offering
  (1–10, capped by the plan). Offers expire after the meal period and at semester end.
- A **request** is posted privately ("a student needs dinner on Thursday"): visible only to attested
  holders, never to the whole campus, never with a name until the holder accepts.
- **Acceptance** creates a relay thread; both confirm the meetup at "The Commons register, MTCC". After
  the meal both tap "it happened"; the holder's "helped" count rises and the recipient can say thanks.
- Nothing is ever transferred: no card, no PIN, no TechCash, no photo of a card, no "leave it at the
  desk". The offer form has no price field; payment words in the thread trigger the caution banner.

**Decision M-2: plan status is self-reported, labelled, and cheap to be honest about.** There is no
balance API and the platform will not accept screenshots. A holder ticks "I hold the All Access plan this
term" (re-asked each semester). A false claim costs the recipient a walk to the MTCC, not money; two
no-show reports suspend the holder's offers for the term. Student moderators can add "confirmed at the
register" after witnessing a treat at a tabling session; no image is ever uploaded.

**Decision M-3: the board mirrors the calendar.** Offers are only possible during published Commons
hours, are semester-scoped, and the board closes over breaks. The campus admin re-reads the Room and
Board Contract each August and January and re-enables the flag; the policy text shown before every post
quotes the presence and non-transfer rules above.

**Decision M-4: need is handled with dignity and pointed at real help.** The request board is private;
the safety page and every request confirmation link Illinois Tech's Dean of Students resources, the
Housing Insecurity Resources page, and the Hawks 4 Hawks Hardship Fund, because a guest meal is a kindness,
not a food-security program.

## 4. Messaging: the relay, the one-message rule, and blocking

- **All contact is in-app.** No phone numbers or emails are exchanged by the platform. A relay thread
  shows display names only; the full name appears only after both people choose "share my name", and
  the email only after both choose "share my email".
- **One-message rule for strangers.** A first message to someone you have never interacted with is
  delivered once. Until they reply, you cannot send another. Replies open the thread normally.
- **New-account limits.** In the first seven days: at most five new threads a day and no marketplace
  listings with a value above the campus cap. Limits lift automatically.
- **Block is instant, silent, and total.** A blocked person cannot see your posts, profile, or threads,
  cannot open a thread with you, and is not told they were blocked. Existing threads freeze on both
  sides with the history preserved for reporting. Blocks are logged for moderators and count toward
  pattern detection (three blocks from different people in a week opens a moderator review).
- **Mute** hides someone's posts from you without blocking contact.
- **Payment-word and pressure detection** runs in the browser before a message is sent ("Zelle",
  "Venmo", "deposit", "gift card", "send me your number", "let's move to WhatsApp"): the sender sees a
  warning; the recipient sees a caution banner; the thread is tagged for review if reported.
- **Every message is retained** append-only for the life of the thread plus one year, and can be exported
  by either participant as a signed PDF/JSON bundle to hand to Public Safety, the Dean of Students, or
  Title IX. Deleting your account anonymises your posts but keeps threads you were reported in, under a
  pseudonymous key, for the retention period.

## 5. Reporting, evidence, and what happens next

Every profile, post, listing, and message has **Report**. Categories: harassment or threats; stalking or
unwanted contact; scam or lying (no-show, fake offer, payment request); impersonation or account
sharing; hate or discrimination; sexual content; selling or trading meal credits; other. The reporter
adds a note; the platform attaches the evidence automatically: the item, the full thread, both
accounts' Hawk IDs, timestamps, and the reporter's block/mute state. Reporters get a case number and a
status page. Moderators must respond within 48 hours, act with a written statement of reasons (notice
to the affected person, their appeal rights), and can escalate to campus offices with the reporter's
consent. Reports of threats or stalking show the reporter the campus emergency and non-emergency
numbers, Title IX, and the counselling centre before anything else *(contacts in §9)*.

**Privacy mode** (self-service, no questions asked): display name becomes initials only, the profile is
not browsable, posts still work, and only people you message can see your name. Moderators can also
apply it on request when someone reports stalking.

**Suspensions and bans** are decided by humans, recorded with reasons, appealable once, and visible to
the campus admin. Automated systems only flag and rank.

## 6. Telling students the truth about risk

Before the first post, every student reads a one-screen **House rules and safety** notice and ticks
each line: meetups in public campus places only; nothing is ever paid for through the site; a meal
treat only happens with the plan holder present at the turnstile; how to block and report; where to
go if someone lies, stalks, or keeps messaging (with phone numbers); and what the platform keeps and for
how long. The same content lives at `/safety` and is linked from every thread. It also states plainly:
the platform is student-run and not affiliated with Illinois Tech, it cannot see meal-plan balances, and
moderators are students with a faculty sponsor, not police.

## 7. Data, retention, and deletion

| Data | Why | Kept for |
|---|---|---|
| Hawk ID, verified name, email | Identity and accountability | Life of the account, then purged |
| Sign-in events (time, coarse location from IP, device) | Account-sharing detection, user's own session list | 90 days |
| Posts, listings, offers | The product | Until expiry or deletion; anonymised on account deletion |
| Relay messages | Safety evidence | Thread life + 1 year, then purged |
| Reports, moderation actions, appeals | Accountability, legal holds | 2 years, pseudonymised after account deletion |
| Consent records | Proof of acceptance | Life of account + 1 year |
| Meal-plan self-attestation | Board eligibility | Current term only |

No analytics identifies a student; aggregate campus stats never show groups smaller than ten.

## 8. Scenarios the design must survive

1. *A student offers a treat, the recipient walks to the Commons, nobody comes.* No money lost; report as
   no-show; strike recorded; three strikes suspend the board.
2. *An offer asks for a "small tip" for the swipe.* Payment words flag the message; the recipient sees the
   caution; a report leads to removal for selling meal credits and a conduct-policy reminder.
3. *Someone keeps messaging after a meetup.* One-message rule already prevents a second unanswered
   message; block ends it silently; the thread export goes to Public Safety if it escalates.
4. *A student is followed on campus after a listing handoff.* Handoffs are at the safe-exchange spot;
   the safety page tells them to call Public Safety; the report attaches the thread and Hawk ID; moderators
   apply privacy mode and escalate.
5. *A graduate keeps using the site to reach current students.* Google sign-in fails once Illinois Tech
   deactivates the account; the platform locks the account at the next re-authentication window.
6. *A student lends their login to a friend who is not a student.* Sessions page shows a new device;
   sign-out-everywhere; repeated pattern is a policy violation with a ban.
7. *Someone uploads an AI-generated "HawkCard" to a moderator.* There is no upload path. Verification is
   in person or not at all.
8. *A minor (17-year-old first-year) signs up.* The terms allow 17+ with the age attestation; the meal
   board and marketplace still work; nothing on the platform is age-restricted content.
9. *A subpoena or a Title IX request arrives.* The law-enforcement and campus-request policy applies:
   verified request, minimum necessary data, user notified unless legally barred.
10. *A student deletes their account mid-investigation.* Content is anonymised; the reported thread is
   retained under a pseudonymous key for the retention period, as the privacy notice states.

## 9. How verification is implemented (verified against Supabase docs, 2026-09-17)

**Sign-in flow.** `signInWithOtp({ email, options: { captchaToken, shouldCreateUser: true } })` sends a
six-digit code (the Supabase template includes `{{ .Token }}`) and a magic link to the campus address via
Resend SMTP. The form accepts only addresses on the campus allowlist and normalises legacy domains
(`@hawk.iit.edu` is the same person as `@hawk.illinoistech.edu`). Codes are verified with
`verifyOtp({ email, token, type: "email" })`.

**Three server-side gates, none of which trust the browser:**
1. **Before User Created hook** (Postgres function, Free plan): rejects any sign-up whose email domain
   is not in `university_domains` for an active campus, so a direct call to the Auth API with the
   publishable key gets "Only verified campus accounts can join this board." Unknown domains are queued
   in `domain_requests` for review.
2. **Trigger on `auth.users` when `email_confirmed_at` is set**: creates `users`, `profiles`, and
   `memberships`, derives the UID (`campus_username`) from the address, and leaves `name_pending = true`
   until onboarding stores the declared name. Only this SECURITY DEFINER trigger writes identity columns.
3. **Custom Access Token hook**: adds `university_id` to the JWT for RLS. Roles are read from
   `memberships` on each request so demotions and bans apply immediately.

**Declared name.** Onboarding writes `declared_given_name` and `declared_family_name` exactly once (a
trigger rejects later updates unless made by a moderator with an audit entry). `name_matches_uid` is
computed by comparing the lower-cased first initial and family name (letters only) with the UID prefix.
Display name and initials are generated by the database, never sent by the client.

**Re-verification.** Sessions are time-boxed to 30 days. `memberships.verified_term` records the last
term attested; a daily job marks memberships `read_only` and role `alumni` when the term is stale past
the grace period, and the next successful code restores them.

**Sessions page.** A SECURITY DEFINER function returns the caller's own rows from `auth.sessions`
(`created_at`, `refreshed_at`, `user_agent`, `ip`, `not_after`); "sign out everywhere" calls
`signOut({ scope: "global" })`; "sign out that device" deletes one session row by id. Supabase Auth has
no per-session admin endpoint, so both run as database functions. A sign-in from a new device family or
country creates an in-app notice.

**Captcha and limits.** Turnstile is enabled inside Supabase Auth so the token is required on every
Auth call, including calls that bypass the app; the OTP endpoint already enforces one request per minute
per address; Upstash wraps the sign-in action and every mutation in the app.

**Local development.** `supabase start` runs the full stack in Docker (API 54321, Postgres 54322, Studio
54323, Mailpit 54324). Codes for `@hawk.illinoistech.edu` addresses land in Mailpit; the same hooks,
triggers, and policies run locally and in CI.

**Owner actions this needs (STOP):** a Supabase project in `us-east-2` (Ohio, closest to Chicago) with
Turnstile keys entered in Auth settings and the OTP email template; a Resend account with a verified
sending domain (the Vercel subdomain cannot carry DNS records; a domain is needed before real students
receive codes); and a short courtesy note to the OTS Support Desk that the pilot only emails campus
addresses and does not integrate with any Illinois Tech system. Details in §10.

## 10. Sources (all read on 2026-09-17) and owner actions

**Identity and policy**
- Microsoft 365 migration and domains: iit.edu/ots/google-microsoft-365 and /overview-changes-and-impacts;
  address format and portal ID: iit.edu/ots/resources-current-prospective-students; student mail:
  iit.edu/ots/communication-tools/student-mail; alumni access (12-month grace, forwarding):
  iit.edu/ots/alumni-technology-access.
- Okta / "Access Illinois Tech" and MFA: iit.edu/ots/access/university-account-log-in and
  /activating-your-account; services.iit.edu TDClient ServiceDet ID 6057.
- Acceptable Use Policy v2.3 (third-party authentication and M365 integrations prohibited without
  approval; exceptions process): webmaster.iit.edu/files/ots/Acceptable-Use-Policy.pdf, pp. 5–6.
- Display name is self-editable in M365: services.iit.edu KB article 14391. Preferred First Name
  Policy: iit.edu/registrar/students-and-alumni/preferred-first-name-policy.
- A-number: iit.edu/ots/resources-current-prospective-students; HawkCard photo submission page.
- Use of Technology Resources (Q-3, rev. 4/2026): webmaster.iit.edu/files/general-counsel/policies-and-procedures/procedure_q3_use_of_technology_resources.pdf.
  Logos and name: iit.edu/marketing-communications/resources/logos and /editorial-style-guide.

**Dining**
- Operator and rules: iit.edu/housing/dining-and-meal-plan ("The cardholder must be present…");
  plans and rates 2026–27: iit.edu/housing/dining-and-meal-plan/options-and-rates; guest meals and expiry:
  iit.edu/housing/dining-and-meal-plan/understanding-your-meal-plan; locations and hours:
  dineoncampus.com/iit/locations, /hours-of-operation, /20262027-meal-plans, /center-court,
  /global-grounds, /the-bog, /john--pat-andersons-cafe, /tech-yeah-market.
- HawkCard non-transferable: iit.edu/cbsc/campus-access/hawkcard/campus-identification; Student
  Handbook 2025–26 p. 19; Residence Life Handbook 2026–27 §O and §P.2; Code of Conduct items 11, 14, 15,
  18 and sanctions: iit.edu/student-affairs/student-handbook/fine-print/code-conduct and /conduct-discipline.
- Balances: get.cbord.com/iit (login required; no third-party API). Food resources:
  iit.edu/resources-current-students/housing-insecurity-resources; Hawks 4 Hawks Hardship Fund.
- Not found on any official page: sale/resale wording, a meal-donation program, a sick-tray policy, guest
  eligibility rules. The Room and Board Contract (housing portal) was not readable.

**Safety contacts (for the safety page; verified)**
- Public Safety: emergency 312.808.6363 or 911; non-emergency 312.808.6300; Tech Central Suite 115,
  3424 S. State St.; escorts 312.808.6310; Rave Guardian app.
- Community Reporting Form (anonymous allowed): iit.edu/incidentreport. Office of Community Standards:
  MTCC 207, 312.567.5172, conduct@illinoistech.edu. Dean of Students: MTCC 209, 312.567.3081,
  dos@illinoistech.edu. Title IX: 312.567.5725 (coordinator listed on iit.edu/title-ix). Student Health
  and Wellness Center: 312.567.7550; after hours: Care Hub 1.866.349.5575, 988, Resilience 773.907.1062.
  Chicago Police 2nd District: 312.747.8366.
- No official safe-exchange zone exists; the board suggests the MTCC Welcome Desk, the Tech Central
  lobby, and the Galvin Library entrance, labelled as app suggestions.

**Owner actions (STOP items)**
1. Read the Room and Board Contract's dining clause in the housing portal and confirm nothing forbids a
   holder treating a present guest; paste the wording into `policy_text.meals` for the campus.
2. Create the Supabase project in `us-east-2` and enter the Turnstile keys and the OTP email template.
3. Create a Resend account and verify a sending domain (a real domain is required; the Vercel subdomain
   cannot carry DNS records).
4. Send a courtesy note to the OTS Support Desk (supportdesk@illinoistech.edu, 312.567.3375) stating that
   the pilot emails campus addresses only and integrates with no Illinois Tech system; ask whether they
   want a disclaimer wording. Keep the app free of Illinois Tech logos and marks.
5. Recruit two student moderators and one faculty or staff sponsor before the board opens.
