import type { Metadata } from "next";
import Link from "next/link";
import { Kicker } from "@/components/kicker";
import { Button } from "@/components/ui/button";
import { listSpaces, mySpaceIds } from "@/lib/dal/spaces";
import { joinSpace, leaveSpace } from "./actions";
import { CreateSpaceForm } from "./create-space-form";

export const metadata: Metadata = { title: "Spaces" };

const KIND_LABEL: Record<string, string> = { general: "Campus", course: "Course", residence: "Residence", club: "Club", interest: "Interest" };

export default async function SpacesPage() {
  const [spaces, mine] = await Promise.all([listSpaces(), mySpaceIds()]);
  return (
    <div className="space-y-6">
      <header className="border-b border-rule pb-4">
        <Kicker>Smaller boards inside the campus</Kicker>
        <h1 className="mt-1 text-5xl">Spaces</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">A residence hall, a course, a club. Every campus member can read every space; joining filters your feed and tags what you pin.</p>
      </header>
      <ul className="divide-y divide-rule rounded-md border border-rule bg-card" aria-label="Spaces">
        {spaces.map((s) => {
          const joined = mine.has(s.id);
          return (
            <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="stamp">
                  {KIND_LABEL[s.kind] ?? s.kind} · {s.member_count} member{s.member_count === 1 ? "" : "s"}
                </p>
                <Link href={`/s/${s.slug}`} className="font-medium underline-offset-4 hover:underline">
                  {s.name}
                </Link>
                {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
              </div>
              <form action={(joined ? leaveSpace : joinSpace).bind(null, s.id, s.slug)}>
                <Button type="submit" size="sm" variant={joined ? "outline" : "default"} aria-label={`${joined ? "Leave" : "Join"} ${s.name}`}>
                  {joined ? "Leave" : "Join"}
                </Button>
              </form>
            </li>
          );
        })}
      </ul>
      <CreateSpaceForm />
    </div>
  );
}
