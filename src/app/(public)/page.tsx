import Link from "next/link";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  CarFrontIcon,
  CircleHelpIcon,
  HandHeartIcon,
  SearchIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  UsersIcon,
  UtensilsIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const modules = [
  { icon: CircleHelpIcon, title: "Questions & answers", text: "Ask once. Accepted answers stay findable for the next student." },
  { icon: CalendarDaysIcon, title: "Events", text: "RSVP, then add it to your calendar in one tap." },
  { icon: ShoppingBagIcon, title: "Marketplace", text: "Campus-only listings. No payments, and your email stays masked." },
  { icon: UtensilsIcon, title: "Meal gifting", text: "Treat a friend or donate a swipe. Gifting only, never for sale." },
  { icon: SearchIcon, title: "Lost & found", text: "Post what you found. Claim what you lost." },
  { icon: CarFrontIcon, title: "Rides", text: "Share the drive home for the break." },
  { icon: BookOpenIcon, title: "Study groups", text: "Find the people in your section before the midterm." },
  { icon: UsersIcon, title: "Roommates & sublets", text: "Listings that expire, so nothing stale lingers." },
];

const principles = [
  {
    icon: ShieldCheckIcon,
    title: "Real people, gentle names",
    text: "Everyone verifies with a university email. Display names can be pseudonyms, but nobody is anonymous to the campus moderators. That one design choice removes most of what went wrong with anonymous campus apps.",
  },
  {
    icon: HandHeartIcon,
    title: "Helpfulness, not karma",
    text: "There is no score to farm. Your profile shows how many people you helped, thank-yous you received, and answers that were accepted.",
  },
  {
    icon: UsersIcon,
    title: "Humans moderate",
    text: "Trusted students and staff review reports, every action comes with a written reason, and every decision can be appealed. Software never bans anyone on its own.",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Masthead */}
      <section className="border-b border-rule py-16 md:py-24">
        <p className="font-heading text-base italic text-muted-foreground">A calmer campus network</p>
        <h1 className="mt-3 max-w-4xl text-5xl leading-[1.02] md:text-7xl">
          Your campus, <em className="text-primary">helping itself.</em>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Campus Wide is a community platform any university can adopt. Verified students ask, answer, share, and
          organise, in a space designed to be kinder than the feeds it replaces.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/feed" className={buttonVariants({ size: "lg" })}>
            Preview the app
          </Link>
          <Link
            href="https://github.com/AdityaKumar0927/campus-wide/blob/main/PLAN.md"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Read the plan
          </Link>
        </div>
        <dl className="mt-10 grid max-w-3xl grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
          {[
            ["Verified", "university email required"],
            ["No ads", "no data sales, no tracking cookies"],
            ["No resale", "meals are gifted, never sold"],
          ].map(([k, v]) => (
            <div key={k} className="border-l-2 border-primary pl-3">
              <dt className="font-medium">{k}</dt>
              <dd className="text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Modules */}
      <section id="how-it-works" className="scroll-mt-20 py-16">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-3xl md:text-4xl">Everything a campus already does, in one calm place.</h2>
        </div>
        <ul className="mt-10 grid gap-px overflow-hidden rounded-xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((m) => (
            <li key={m.title} className="bg-card p-5">
              <m.icon className="size-5 text-primary" aria-hidden />
              <h3 className="mt-3 text-xl">{m.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{m.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          Every module is a switch your university admin can turn on or off. Meal gifting is off until a campus opts in.
        </p>
      </section>

      {/* Principles */}
      <section id="safety" className="masthead-rule scroll-mt-20 py-16">
        <h2 className="text-3xl md:text-4xl">Why it feels different.</h2>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {principles.map((p) => (
            <article key={p.title}>
              <p.icon className="size-6 text-primary" aria-hidden />
              <h3 className="mt-4 text-2xl">{p.title}</h3>
              <p className="mt-2 text-muted-foreground">{p.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Universities */}
      <section id="universities" className="masthead-rule scroll-mt-20 py-16">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-start">
          <div>
            <h2 className="text-3xl md:text-4xl">Built for universities to adopt, not just tolerate.</h2>
            <p className="mt-4 text-muted-foreground">
              Each campus is an isolated tenant enforced inside the database, not just in the app. Admins configure
              domains, features, policy text, and moderators, and see aggregate numbers only, never individual students.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Row-level isolation between campuses, proven by automated tests",
              "WCAG 2.2 AA accessibility target, checked on every build",
              "Notice-and-action reporting with written statements of reasons",
              "Self-service data export and account deletion",
              "Free to run for a pilot; upgrade paths documented",
            ].map((item) => (
              <li key={item} className="flex gap-3 border-b border-rule pb-3">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
