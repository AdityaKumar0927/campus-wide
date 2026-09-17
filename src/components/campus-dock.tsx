"use client";

import Link from "next/link";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  CarFrontIcon,
  CircleHelpIcon,
  SearchIcon,
  ShoppingBagIcon,
  UsersIcon,
  UtensilsIcon,
  type LucideIcon,
} from "lucide-react";
import { Dock, DockIcon } from "@/components/ui/dock";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const items: { label: string; icon: LucideIcon; href: string }[] = [
  { label: "Questions", icon: CircleHelpIcon, href: "/#how-it-works" },
  { label: "Events", icon: CalendarDaysIcon, href: "/#how-it-works" },
  { label: "Marketplace", icon: ShoppingBagIcon, href: "/#take-a-tab" },
  { label: "Meal gifting", icon: UtensilsIcon, href: "/#how-it-works" },
  { label: "Lost & found", icon: SearchIcon, href: "/#how-it-works" },
  { label: "Rides", icon: CarFrontIcon, href: "/#how-it-works" },
  { label: "Study groups", icon: BookOpenIcon, href: "/#how-it-works" },
  { label: "Roommates", icon: UsersIcon, href: "/#how-it-works" },
];

/** The board's modules as a dock: hover to magnify, click to jump to the section. */
export function CampusDock() {
  return (
    <Dock iconSize={40} iconMagnification={60} iconDistance={120} className="mx-0 mt-0 border-rule bg-card/80 backdrop-blur" aria-label="Modules">
      {items.map(({ label, icon: Icon, href }) => (
        <DockIcon key={label}>
          <Tooltip>
            <TooltipTrigger render={<Link href={href} aria-label={label} className="flex size-full items-center justify-center rounded-full text-foreground outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50" />}>
              <Icon className="size-[55%]" aria-hidden />
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        </DockIcon>
      ))}
    </Dock>
  );
}
