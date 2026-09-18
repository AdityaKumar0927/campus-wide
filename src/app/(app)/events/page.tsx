import type { Metadata } from "next";
import { ModulePage } from "@/components/board/module-page";

export const metadata: Metadata = { title: "Events" };

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; sort?: string; type?: string }> }) {
  return <ModulePage basePath="/events" title="Events" kicker="Things happening on campus" blurb="RSVP, add it to your calendar, bring someone who has had a long week." types={["event"]} composeType="event" searchParams={await searchParams} />;
}
