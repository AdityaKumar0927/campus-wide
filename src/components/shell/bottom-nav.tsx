"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { primaryNav } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-background/95 pb-safe-bottom backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
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
                    "flex items-center justify-center rounded-full",
                    isPost ? "size-9 bg-primary text-primary-foreground" : "size-7",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
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
