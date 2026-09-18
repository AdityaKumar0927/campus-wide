"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { primaryNav } from "./nav-items";

export function BottomNav({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-background pb-safe-bottom md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {primaryNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const isPost = href === "/post";
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "relative flex items-center justify-center rounded-full",
                    isPost ? "size-9 -rotate-12 bg-primary text-primary-foreground" : "size-7",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {href === "/inbox" && unread > 0 && (
                    <span className="absolute -top-0.5 -right-1 rounded-full bg-primary px-1 text-[9px] font-medium leading-4 text-primary-foreground">
                      {unread > 99 ? "99+" : unread}
                      <span className="sr-only"> unread</span>
                    </span>
                  )}
                </span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
