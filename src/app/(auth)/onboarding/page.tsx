import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/dal/session";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/onboarding");
  if (!session.namePending && session.profile?.onboardedAt) redirect("/feed");

  return (
    <div className="board min-h-dvh px-4 py-12">
      <div className="notice mx-auto max-w-xl rotate-[0.4deg] px-6 pt-8 pb-6" style={{ "--stock": "var(--stock-blue)" } as React.CSSProperties}>
        <p className="stamp">Welcome · one minute</p>
        <h1 className="mt-2 text-4xl">Before your first notice.</h1>
        <div className="mt-6">
          <OnboardingForm campusUsername={session.profile?.campusUsername ?? ""} namePending={session.namePending} />
        </div>
      </div>
    </div>
  );
}
