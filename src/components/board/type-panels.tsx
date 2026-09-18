import { castVote } from "@/app/(app)/p/[id]/actions";
import { buttonVariants } from "@/components/ui/button";
import type { Campus } from "@/lib/dal/campus";
import { myVote, pollResults } from "@/lib/dal/modules";
import type { PostWithAuthor } from "@/lib/dal/posts";
import type { Session } from "@/lib/dal/session";
import type { PostType } from "@/lib/posts/types";
import { formatCents, formatDateTime } from "@/lib/text";
import { ContactPanel, FactList, Participation } from "./contact-panel";
import { PollVote } from "./poll-vote";

/** The type-specific block under a notice: facts, sign-ups, votes, or the contact tab. */
export async function TypePanel({ post, session, campus }: { post: PostWithAuthor; session: Session | null; campus: Campus | null }) {
  const type = post.type as PostType;
  const p = (post.payload ?? {}) as Record<string, string | number | boolean | string[] | undefined>;
  const s = (k: string) => (typeof p[k] === "string" ? (p[k] as string) : "");
  const n = (k: string) => (typeof p[k] === "number" ? (p[k] as number) : null);

  switch (type) {
    case "event":
      return (
        <section className="space-y-4" aria-label="Event details">
          <FactList facts={[["When", s("startsAt") && formatDateTime(s("startsAt"))], ["Until", s("endsAt") && formatDateTime(s("endsAt"))], ["Where", s("location")]]} />
          <a href={`/p/${post.id}/calendar.ics`} className={buttonVariants({ variant: "outline", size: "sm" })} download>
            Add to calendar (.ics)
          </a>
          <Participation post={post} session={session} capacity={n("rsvpLimit")} verb="RSVP" leaveVerb="Not going after all" noun="going" />
        </section>
      );
    case "ride":
      return (
        <section className="space-y-4" aria-label="Ride details">
          <FactList facts={[["From", s("from")], ["To", s("to")], ["Leaves", s("departsAt") && formatDateTime(s("departsAt"))], ["Costs", p.costSplit ? "Split in person" : "On the driver"]]} />
          <Participation post={post} session={session} capacity={n("seats")} verb="Take a seat" leaveVerb="Give up my seat" noun="riding" />
        </section>
      );
    case "study":
      return (
        <section className="space-y-4" aria-label="Study group details">
          <FactList facts={[["Course", s("course")], ["Meets", s("meets")], ["Where", s("location")]]} />
          <Participation post={post} session={session} capacity={n("capacity")} verb="Count me in" leaveVerb="Leave the group" noun="in the group" />
        </section>
      );
    case "poll": {
      const [results, mine] = await Promise.all([pollResults(post.id), myVote(post.id)]);
      const options = Array.isArray(p.options) ? (p.options as string[]) : [];
      return (
        <section aria-label="Poll">
          <PollVote options={options} multiple={Boolean(p.multiple)} results={Object.fromEntries(results)} mine={mine} open={post.status === "active" && Boolean(session)} onVote={castVote.bind(null, post.id)} />
        </section>
      );
    }
    case "listing":
      return (
        <section className="space-y-4" aria-label="Listing details">
          <FactList facts={[["Price", formatCents(n("priceCents"))], ["Condition", s("condition").replace("_", " ")], ["Category", s("category")]]} />
          <ContactPanel post={post} session={session} campus={campus} verb="Take a tab" />
        </section>
      );
    case "lost":
    case "found":
      return (
        <section className="space-y-4" aria-label="Details">
          <FactList facts={[["Where", s("where")], ["When", s("when")], ["Kind", s("category")], ["Held at", s("heldAt")]]} />
          <ContactPanel post={post} session={session} campus={campus} verb={type === "found" ? "That is mine" : "I found this"} note="Describe it in the thread; hand-off at a staffed desk." />
        </section>
      );
    case "roommate":
      return (
        <section className="space-y-4" aria-label="Details">
          <FactList facts={[["Rent", n("rentCents") !== null ? `${formatCents(n("rentCents"))} a month` : null], ["From", s("moveIn")], ["Until", s("moveOut")], ["Where", s("location")]]} />
          <ContactPanel post={post} session={session} campus={campus} verb="Take a tab" note="Nothing is paid through the board. Visit before you commit to anything." />
        </section>
      );
    case "meal":
      return (
        <section className="space-y-4" aria-label="Meal details">
          <FactList facts={[["When", s("window")], ["Where", s("location")]]} />
          <ContactPanel
            post={post}
            session={session}
            campus={campus}
            verb={post.audience === "meal_holders" ? "I can treat them" : "Ask for one"}
            note="Gift only. The plan holder taps their own HawkCard at the register; nothing is sold, lent, or traded. Both of you tap it happened afterwards."
          />
        </section>
      );
    default:
      return null;
  }
}
