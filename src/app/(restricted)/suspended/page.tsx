import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";
import { TornNoticeIllustration } from "@/components/illustrations";
import { Kicker } from "@/components/kicker";
import { Button, buttonVariants } from "@/components/ui/button";
import { myLatestSanction } from "@/lib/dal/moderation";
import { getSession } from "@/lib/dal/session";
import { formatDateTime } from "@/lib/text";

export const metadata: Metadata = { title: "Account suspended" };

export default async function SuspendedPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const status = session.membership?.status;
  if (status !== "banned" && status !== "suspended") redirect("/feed");
  const action = await myLatestSanction();
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center">
      <TornNoticeIllustration className="mb-6 w-44" />
      <Kicker>{status === "banned" ? "Banned" : "Suspended"}</Kicker>
      <h1 className="mt-3 text-5xl">{status === "banned" ? "Your account was banned." : "Your account is suspended."}</h1>
      <p className="mt-4 text-muted-foreground">
        {action ? `A moderator decided this on ${formatDateTime(action.created_at)}. The statement of reasons and your one appeal are on the decision page.` : "A moderator decided this. Check your inbox for the statement of reasons."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {action && (
          <Link href={`/appeals/${action.id}`} className={buttonVariants()}>
            Read the reasons and appeal
          </Link>
        )}
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
