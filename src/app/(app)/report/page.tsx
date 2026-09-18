import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Kicker } from "@/components/kicker";
import { getSession } from "@/lib/dal/session";
import { SAFETY_CONTACTS } from "@/lib/safety-contacts";
import { ReportForm } from "./report-form";

export const metadata: Metadata = { title: "Report" };

const TARGETS = new Set(["post", "comment", "thread", "profile"]);
const NOUN: Record<string, string> = { post: "this notice", comment: "this reply", thread: "this thread", profile: "this member" };

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ type?: string; id?: string }> }) {
  const { type = "", id = "" } = await searchParams;
  const session = await getSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(`/report?type=${type}&id=${id}`)}`);
  if (!TARGETS.has(type) || !/^[0-9a-f-]{36}$/.test(id)) redirect("/feed");
  return (
    <div className="space-y-6">
      <header className="border-b border-rule pb-4">
        <Kicker>A human reads every report within 48 hours</Kicker>
        <h1 className="mt-1 text-5xl">Report {NOUN[type]}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">You get a case number and a status page. Moderators act with a written statement of reasons, and every decision can be appealed by the person it concerns.</p>
      </header>
      <ReportForm targetType={type} targetId={id} contacts={[...SAFETY_CONTACTS]} />
    </div>
  );
}
