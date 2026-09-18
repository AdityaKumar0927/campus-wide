"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { exploreNav, moduleNav, primaryNav, roleNav, type NavItem } from "./nav-items";

function NavList({ items, heading, unread = 0 }: { items: NavItem[]; heading?: string; unread?: number }) {
  const pathname = usePathname();
  return (
    <div>
      {heading && (
        <p className="stamp mb-1 px-3">{heading}</p>
      )}
      <ul className="space-y-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                  active
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span>{label}</span>
                {href === "/inbox" && unread > 0 && (
                  <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
                    {unread > 99 ? "99+" : unread}
                    <span className="sr-only"> unread</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SidebarNav({ unread = 0, flags = {}, role }: { unread?: number; flags?: Record<string, boolean>; role?: string }) {
  const roleItems = roleNav.filter((i) => (i.role === "moderator" ? role === "moderator" || role === "university_admin" : role === "university_admin"));
  return (
    <nav aria-label="Sections" className="flex flex-col gap-5">
      <NavList items={primaryNav.filter((i) => i.href !== "/more")} unread={unread} />
      <NavList items={exploreNav} />
      <NavList items={moduleNav.filter((i) => !i.flag || flags[i.flag])} heading="Around campus" />
      {roleItems.length > 0 && <NavList items={roleItems} heading="Keeping the board" />}
    </nav>
  );
}
