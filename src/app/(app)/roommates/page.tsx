import type { Metadata } from "next";
import { ModulePage } from "@/components/board/module-page";

export const metadata: Metadata = { title: "Roommates" };

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; sort?: string; type?: string }> }) {
  return <ModulePage basePath="/roommates" title="Roommates" kicker="Rooms, sublets, and people looking" blurb="Listings expire on their own. Visit before you commit to anything." types={["roommate"]} composeType="roommate" searchParams={await searchParams} />;
}
