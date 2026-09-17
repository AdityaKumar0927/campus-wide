import Link from "next/link";
import { CampusDock } from "@/components/campus-dock";
import { CampusIconCloud } from "@/components/campus-icon-cloud";
import { CampusOrbit } from "@/components/campus-orbit";
import { FeaturePreviews } from "@/components/feature-previews";
import { Marker } from "@/components/marker";
import { StampSeal } from "@/components/stamp-seal";
import { NoticeBoard } from "@/components/notice-board";
import { PinnedTicker } from "@/components/pinned-ticker";
import { RelayDiagram } from "@/components/relay-diagram";
import { buttonVariants } from "@/components/ui/button";
import { Kicker, TapeLabel } from "@/components/kicker";

const principles = [
  {
    title: "Real people, gentle names",
    text: "Everyone verifies with a university email. Display names can be pseudonyms, but nobody is anonymous to the campus moderators. That one choice removes most of what went wrong with anonymous campus apps.",
  },
  {
    title: "Helpfulness, not karma",
    text: "There is no score to farm. Your profile shows how many people you helped, the thank-yous you received, and the answers that were accepted.",
  },
  {
    title: "Humans take things down",
    text: "Trusted students and staff review reports. Every action comes with a written reason, and every decision can be appealed. Software never bans anyone on its own.",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Masthead */}
      <section className="grid items-center gap-10 pt-12 pb-10 md:pt-16 md:pb-14 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <div>
        <TapeLabel>Illinois Tech pilot, fall 2026</TapeLabel>
        <h1 className="mt-4 max-w-4xl text-6xl md:text-[5.75rem]">
          Your campus, <span className="text-primary">helping itself.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Every campus already runs on notices: the flyer in the stairwell, the index card by the vending machine,
          the group chat that scrolled away. Campus Wide is that board, rebuilt for everyone with a university email,
          and <Marker action="underline">kinder than the feeds it replaces</Marker>.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/sign-in" className={buttonVariants({ size: "lg" })}>
            Sign in with your campus email
          </Link>
          <Link href="https://github.com/AdityaKumar0927/campus-wide/blob/main/PLAN.md" className={buttonVariants({ size: "lg", variant: "outline" })}>
            Read the plan
          </Link>
        </div>
        <div className="mt-8 hidden md:block">
          <CampusDock />
        </div>
        </div>
        <StampSeal className="justify-self-center" />
      </section>

      <NoticeBoard />

      <PinnedTicker className="mt-8" />

      <dl className="mt-8 grid max-w-3xl grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
        {[
          ["Verified", "a university email is the only way in"],
          ["No ads", "no data sales, no tracking cookies"],
          ["No resale", "meals are gifted, never sold"],
        ].map(([k, v]) => (
          <div key={k} className="border-l-2 border-primary pl-3">
            <dt className="font-medium">{k}</dt>
            <dd className="text-muted-foreground">{v}</dd>
          </div>
        ))}
      </dl>

      {/* Modules */}
      <section id="how-it-works" className="scroll-mt-20 pt-24 pb-16">
        <Kicker>Live previews, sample data</Kicker>
        <h2 className="mt-3 max-w-3xl text-4xl md:text-6xl">Everything a campus already does, without the group chat.</h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          These are the real components, filled with sample notices. Click around: thank an answer, take a tab, vote,
          claim the keys, download the calendar file.
        </p>
        <div className="mt-12">
          <FeaturePreviews />
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Every module is a switch your university admin can turn on or off. Meal gifting stays off until a campus opts in.
        </p>
      </section>

      {/* Take a tab */}
      <section id="take-a-tab" className="masthead-rule scroll-mt-20 py-16">
        <Kicker>Take a tab</Kicker>
        <h2 className="mt-3 max-w-3xl text-4xl md:text-6xl">Contact without handing out your email.</h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Every listing has tear-off tabs. Take one and your message travels along the string, through the board, to
          the seller. Talk, agree on the library desk, and neither of you sees an address unless you both choose to
          share it.
        </p>
        <div className="mt-10">
          <RelayDiagram />
        </div>
      </section>

      {/* The stuff of campus life */}
      <section className="masthead-rule grid items-center gap-8 py-16 md:grid-cols-2">
        <div>
          <Kicker>Lost, lent, found, passed on</Kicker>
          <h2 className="mt-3 text-4xl md:text-6xl">The stuff of campus life, kept in circulation.</h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Keys, umbrellas, calculators the night before the midterm, a bike at the end of the year. Most of it already
            changes hands on campus; the board just makes sure it finds the right hands, safely.
          </p>
        </div>
        <CampusIconCloud />
      </section>

      {/* Principles */}
      <section id="safety" className="masthead-rule scroll-mt-20 py-16">
        <Kicker>House rules</Kicker>
        <h2 className="mt-3 text-4xl md:text-6xl">Why it feels different.</h2>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {principles.map((p, i) => (
            <article key={p.title}>
              <p className="font-heading text-5xl text-primary/70" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-xl">{p.title}</h3>
              <p className="mt-2 text-muted-foreground">{p.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Universities */}
      <section id="universities" className="masthead-rule scroll-mt-20 py-16">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <Kicker>For universities</Kicker>
            <h2 className="mt-3 text-4xl md:text-6xl">Built to be adopted, not just tolerated.</h2>
            <p className="mt-4 text-muted-foreground">
              Each campus is an isolated tenant enforced inside the database, not just in the app. Admins configure
              domains, features, policy text, and moderators, and see aggregate numbers only, never individual students.
            </p>
          </div>
          <div className="space-y-6">
          <CampusOrbit />
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
        </div>
      </section>
    </div>
  );
}
