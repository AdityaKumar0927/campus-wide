# Campus admin guide

For the person who runs Campus Wide on a campus. You need a campus email address on the allowlist and
the `university_admin` role, which an existing admin (or the maintainer, for the first one) grants.

## The five-minute version

1. Sign in with your campus email. The code arrives in your campus mailbox.
2. Open **Campus admin** in the sidebar.
3. Switch on the modules your campus wants. Leave **Meal gifting** off until your dining office says
   yes in writing.
4. Appoint two or three moderators. Two is the minimum, because an appeal must be decided by someone
   other than the moderator who made the decision.
5. Check the safe-exchange spots. They are printed inside every marketplace thread, so they must be
   real, public, and staffed.

## Modules

Each switch takes effect immediately, for everyone, and the database enforces it: a member cannot pin
that kind of notice while it is off, even by calling the API directly. Switching a module off hides its
board and removes it from the composer; existing notices stay in the database and come back untouched
if you switch it on again.

**Meal gifting deserves its own paragraph.** It is off by default and should stay off until the office
responsible for dining confirms, in writing, that a plan holder may use a guest meal for a fellow
student met through the board, with the holder present at the register. Re-read your housing and dining
contract each term before switching it back on, and paste the relevant clause into the meal policy text
so every member sees it before they offer anything.

## Campus details

Name, short name, time zone, and an accent hue (0 to 360) that tints the whole board. The short name
appears in the header and in the weekly digest subject line.

## Policy text

Two editable blocks: the meal-sharing text shown before every offer, and a marketplace note shown on
listings. Keep them short and quote your own contract where you can. The platform-wide policies
(privacy, terms, guidelines) live in the repository and are versioned; a change there asks every member
to accept the new version at their next sign-in.

## Safe-exchange spots

One per line: `Name | note | campus`. Pick places that are indoors, public, staffed during the day, and
easy to find for someone in their first week. These are shown in every marketplace and lost-and-found
thread.

## Email domains

The allowlist decides who can create an account. Student and staff domains can differ. A sign-up from an
unknown domain is refused by the database and recorded in `domain_requests` for review, so you can see
demand from a campus you have not added.

## Moderators

Appoint by handle. Moderators see the report queue, the evidence captured at filing time, and the
decision form; they cannot read anything else that a member could not. Admins can additionally read the
audit log and the aggregate numbers.

Ask new moderators to read the Community Guidelines and the House Rules first, and tell them the two
rules that matter most: write the statement of reasons as though the member will read it out loud (they
can), and never decide an appeal against your own decision.

## Numbers

The admin page shows counts only: members by status, notices by type, reports by status, threads,
flagged threads, blocks in the last week, and the last five digest runs. There is no way to see what an
individual member is doing, by design. The public page at `/campus/your-slug` shows a rounded subset and
hides any group smaller than ten.

## Feedback

The last twenty feedback messages appear on the admin page. If a GitHub token and repository are
configured, each one also becomes an issue.

## When something goes wrong

- A member is in danger: call Public Safety. The report page shows the numbers before anything else.
- A moderator is not answering: reassign by appointing another; reports have no owner until a decision.
- Something looks wrong in the data: the audit log is append-only and shows who did what.
- You need help: open an issue on the repository, or write to the maintainer.
