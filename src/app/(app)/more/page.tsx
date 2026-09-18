import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { Kicker } from "@/components/kicker";
import { Button } from "@/components/ui/button";
import { exploreNav, moduleNav } from "@/components/shell/nav-items";
import { getCampus } from "@/lib/dal/campus";
import { getSession } from "@/lib/dal/session";

export const metadata: Metadata = { title: "Menu" };

/** The phone menu: everything the bottom bar does not have room for. */
export default async function MorePage() {
  const [session, campus] = await Promise.all([getSession(), getCampus()]);
  const modules = moduleNav.filter((i) => !i.flag || campus?.featureFlags[i.flag]);
  const groups: { heading: string; items: { href: string; label: string }[] }[] = [
    { heading: "Around campus", items: modules },
    { heading: "Find your way", items: exploreNav },
    {
      heading: "You",
      items: [
        { href: "/settings", label: "Account, privacy mode, sessions" },
        ...(session?.profile ? [{ href: `/u/${session.profile.campusUsername}`, label: "How others see you" }] : []),
        { href: "/#safety", label: "House rules and safety" },
      ],
    },
  ];
  return (
    <div className="space-y-6">
      <header className="border-b border-rule pb-4">
        <Kicker>{campus?.shortName ?? "Illinois Tech"}</Kicker>
        <h1 className="mt-1 text-5xl">Menu</h1>
      </header>
      {groups.map((g) => (
        <section key={g.heading} aria-labelledby={`menu-${g.heading}`}>
          <h2 id={`menu-${g.heading}`} className="stamp mb-1">
            {g.heading}
          </h2>
          <ul className="divide-y divide-rule rounded-md border border-rule bg-card">
            {g.items.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="block px-4 py-3 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {session && (
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      )}
    </div>
  );
}
