import type { Metadata } from "next";
import Link from "next/link";
import { WifiOffIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="mb-6 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <WifiOffIcon className="size-7" aria-hidden />
      </span>
      <p className="stamp">No signal</p>
      <h1 className="mt-3 text-6xl">The board is out of reach.</h1>
      <p className="mt-3 text-muted-foreground">
        Nothing here needs a signal right now. When you are back online, this page will pick up where you left off.
      </p>
      <Link href="/" className={`${buttonVariants({ variant: "outline" })} mt-8`}>
        Try again
      </Link>
    </div>
  );
}
