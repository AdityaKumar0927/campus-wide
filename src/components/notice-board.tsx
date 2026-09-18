import { WashiTape } from "@/components/washi-tape";
import { cn } from "@/lib/utils";

/**
 * The hero board: a handful of sample notices on different paper stocks, each held by a pin.
 * Pure markup, no JavaScript. Rotations are tiny on purpose; the paper does the talking.
 */

type Stock = "white" | "manila" | "blue" | "pink" | "yellow" | "green";

interface Notice {
  stock: Stock;
  stamp: string;
  title: string;
  body?: string;
  foot?: string;
  tabs?: number;
  takenTabs?: number;
  rotate: string;
  pinHue?: number;
  /** Tape instead of a pin. */
  held?: "tape";
  className?: string;
}

const notices: Notice[] = [
  {
    stock: "blue",
    stamp: "Question · 2h ago · 3 answers",
    title: "Anyone have a TI-84 I could borrow for Thursday's stats midterm?",
    foot: "✓ Answered by a third-year in Watson Hall",
    rotate: "-rotate-[1.4deg]",
    pinHue: 25,
  },
  {
    stock: "white",
    stamp: "Event · Fri 8pm · Union basement",
    title: "Jazz night. Free. Bring someone who has had a long week.",
    held: "tape",
    foot: "41 going · add to calendar",
    rotate: "rotate-[1.1deg]",
    pinHue: 155,
    className: "md:translate-y-6",
  },
  {
    stock: "manila",
    stamp: "For sale · Bike · North campus",
    title: "Blue commuter bike, new brakes, lock included. Meet at the library desk.",
    tabs: 6,
    takenTabs: 2,
    rotate: "-rotate-[0.6deg]",
    pinHue: 250,
  },
  {
    stock: "yellow",
    stamp: "Lost · Library, 3rd floor",
    title: "Blue Hydro Flask with a sticker of a cat wearing a hat. It has been through a lot with me.",
    foot: "Found it? Tap to reunite us.",
    rotate: "rotate-[1.8deg]",
    pinHue: 25,
    className: "md:-translate-y-3",
  },
  {
    stock: "green",
    stamp: "Ride · Sat 6am · Airport",
    title: "Two seats left to the airport before fall break. Split the gas, not the playlist.",
    held: "tape",
    foot: "Driver verified · 4 helped",
    rotate: "-rotate-[1deg]",
    pinHue: 250,
    className: "md:translate-y-4",
  },
  {
    stock: "pink",
    stamp: "Meal gift · This week · Gift only",
    title: "I have two guest swipes I will not use before Sunday. First-years welcome, no strings.",
    foot: "Gifting only. Nothing on this board is for sale.",
    rotate: "rotate-[0.9deg]",
    pinHue: 155,
    className: "md:-translate-y-2",
  },
];

export function NoticeCard({ n }: { n: Notice }) {
  const style = { "--stock": `var(--stock-${n.stock})`, "--pin-hue": n.pinHue ?? 25 } as React.CSSProperties;
  return (
    <li className={cn("reveal", n.className)}>
      <div data-held={n.held} className={cn("notice h-full px-4 pt-5 pb-3 transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none", n.rotate)} style={style}>
      {n.held === "tape" && <WashiTape hue={n.pinHue === 155 ? 150 : 100} className="absolute -top-2.5 left-1/2 h-5 w-28 -translate-x-1/2 -rotate-3" />}
      <p className="stamp">{n.stamp}</p>
      <p className="mt-2 text-[1.05rem] leading-snug">{n.title}</p>
      {n.body && <p className="mt-1.5 text-sm text-muted-foreground">{n.body}</p>}
      {n.foot && <p className="mt-3 text-xs text-muted-foreground">{n.foot}</p>}
      {n.tabs && (
        <ul className="tear-tabs -mx-4 -mb-3" aria-label={`${n.tabs - (n.takenTabs ?? 0)} contact tabs left`}>
          {Array.from({ length: n.tabs }, (_, i) => (
            <li key={i} data-taken={i < (n.takenTabs ?? 0) ? "" : undefined}>
              <span aria-hidden>take one</span>
            </li>
          ))}
        </ul>
      )}
      </div>
    </li>
  );
}

export function NoticeBoard({ className }: { className?: string }) {
  return (
    <ul
      aria-label="Sample notices from a campus board"
      className={cn("board grid gap-6 rounded-2xl border border-rule p-5 sm:grid-cols-2 md:grid-cols-3 md:gap-7 md:p-8", className)}
    >
      {notices.map((n) => (
        <NoticeCard key={n.title} n={n} />
      ))}
    </ul>
  );
}
