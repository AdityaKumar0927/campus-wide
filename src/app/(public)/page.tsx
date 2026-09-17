import Link from "next/link";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  CarFrontIcon,
  CircleHelpIcon,
  SearchIcon,
  ShoppingBagIcon,
  UsersIcon,
  UtensilsIcon,
} from "lucide-react";
import { CampusDock } from "@/components/campus-dock";
import { CampusIconCloud } from "@/components/campus-icon-cloud";
import { CampusOrbit } from "@/components/campus-orbit";
import { ChicagoMap } from "@/components/chicago-map";
import { Marker } from "@/components/marker";
import { NoticeBoard } from "@/components/notice-board";
import { PinnedTicker } from "@/components/pinned-ticker";
import { RelayDiagram } from "@/components/relay-diagram";
import { buttonVariants } from "@/components/ui/button";

const modules = [
  { icon: CircleHelpIcon, stock: "blue", stamp: "Index card", title: "Questions & answers", text: "Ask once. The accepted answer stays pinned for the next person who needs it." },
  { icon: CalendarDaysIcon, stock: "white", stamp: "Flyer", title: "Events", text: "RSVP, then drop it into your calendar in one tap." },
  { icon: ShoppingBagIcon, stock: "manila", stamp: "Tear-off tabs", title: "Marketplace", text: "Campus-only listings. No payments. Your email stays in your pocket until you both say so." },
  { icon: UtensilsIcon, stock: "green", stamp: "Gift only", title: "Meal gifting", text: "Treat a friend or donate a swipe.", mark: "Nothing here is ever for sale." },
  { icon: SearchIcon, stock: "yellow", stamp: "Sticky note", title: "Lost & found", text: "Post what you found. Claim what you lost. Water bottles, mostly." },
  { icon: CarFrontIcon, stock: "green", stamp: "Ride board", title: "Rides", text: "Fill the empty seats on the drive home for the break." },
  { icon: BookOpenIcon, stock: "blue", stamp: "Index card", title: "Study groups", text: "Find the people in your section before the midterm, not after." },
  { icon: UsersIcon, stock: "pink", stamp: "Expires", title: "Roommates & sublets", text: "Listings that take themselves down, so nothing stale lingers." },
] as const;

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
        <p className="stamp">Campus Wide · a notice board for the whole campus</p>
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
        <ChicagoMap className="w-full max-w-[26rem] justify-self-center lg:max-w-none" />
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
        <p className="stamp">What goes on the board</p>
        <h2 className="mt-3 max-w-3xl text-4xl md:text-6xl">Everything a campus already does, without the group chat.</h2>
        <ul className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((m) => (
            <li key={m.title} className="reveal">
              <div className="notice h-full px-4 pt-5 pb-4" style={{ "--stock": `var(--stock-${m.stock})` } as React.CSSProperties}>
              <div className="flex items-center justify-between">
                <p className="stamp">{m.stamp}</p>
                <m.icon className="size-4 text-primary" aria-hidden />
              </div>
              <h3 className="mt-3 text-lg">{m.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {m.text}
                {"mark" in m && (
                  <>
                    {" "}
                    <Marker>{m.mark}</Marker>
                  </>
                )}
              </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-muted-foreground">
          Every module is a switch your university admin can turn on or off. Meal gifting stays off until a campus opts in.
        </p>
      </section>

      {/* Take a tab */}
      <section id="take-a-tab" className="masthead-rule scroll-mt-20 py-16">
        <p className="stamp">Take a tab</p>
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
          <p className="stamp">Lost, lent, found, passed on</p>
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
        <p className="stamp">House rules</p>
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
            <p className="stamp">For universities</p>
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
