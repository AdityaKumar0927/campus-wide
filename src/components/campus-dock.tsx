"use client";

import Link from "next/link";
import {
  EventIcon,
  LostFoundIcon,
  MarketIcon,
  MealIcon,
  QuestionIcon,
  RideIcon,
  RoommateIcon,
  StudyIcon,
  type IconComponent,
} from "@/components/icons/board-icons";
import { Dock, DockIcon } from "@/components/ui/dock";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const items: { label: string; icon: IconComponent; href: string }[] = [
  { label: "Questions", icon: QuestionIcon, href: "/#how-it-works" },
  { label: "Events", icon: EventIcon, href: "/#how-it-works" },
  { label: "Marketplace", icon: MarketIcon, href: "/#take-a-tab" },
  { label: "Meal gifting", icon: MealIcon, href: "/#how-it-works" },
  { label: "Lost & found", icon: LostFoundIcon, href: "/#how-it-works" },
  { label: "Rides", icon: RideIcon, href: "/#how-it-works" },
  { label: "Study groups", icon: StudyIcon, href: "/#how-it-works" },
  { label: "Roommates", icon: RoommateIcon, href: "/#how-it-works" },
];

/** The modules as a dock: hover to magnify, click to jump to the section. */
export function CampusDock() {
  return (
    <Dock iconSize={40} iconMagnification={60} iconDistance={120} className="mx-0 mt-0 border-rule bg-card/80 backdrop-blur" aria-label="Modules">
      {items.map(({ label, icon: Icon, href }) => (
        <DockIcon key={label}>
          <Tooltip>
            <TooltipTrigger render={<Link href={href} aria-label={label} className="flex size-full items-center justify-center rounded-full text-foreground outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50" />}>
              <Icon className="size-[58%]" />
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        </DockIcon>
      ))}
    </Dock>
  );
}
