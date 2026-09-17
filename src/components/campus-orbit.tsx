"use client";

import {
  BookOpenIcon,
  CalendarDaysIcon,
  CarFrontIcon,
  CircleHelpIcon,
  KeyRoundIcon,
  SearchIcon,
  ShoppingBagIcon,
  UsersIcon,
  UtensilsIcon,
  VoteIcon,
} from "lucide-react";
import { PinMark } from "@/components/shell/wordmark";
import { OrbitingCircles } from "@/components/ui/orbiting-circles";

/** One campus, every kind of notice: the modules orbit the pin. Decorative. */
export function CampusOrbit() {
  const cls = "size-full rounded-full border border-rule bg-card p-2.5 text-primary shadow-sm";
  return (
    <div className="relative mx-auto flex size-[22rem] items-center justify-center overflow-hidden" aria-hidden>
      <div className="flex size-16 items-center justify-center rounded-full border border-rule bg-card shadow-sm">
        <PinMark className="size-7 rotate-0" />
      </div>
      <OrbitingCircles radius={90} iconSize={40} duration={28}>
        <CircleHelpIcon className={cls} />
        <CalendarDaysIcon className={cls} />
        <ShoppingBagIcon className={cls} />
        <UtensilsIcon className={cls} />
      </OrbitingCircles>
      <OrbitingCircles radius={150} iconSize={36} duration={40} reverse>
        <SearchIcon className={cls} />
        <CarFrontIcon className={cls} />
        <BookOpenIcon className={cls} />
        <UsersIcon className={cls} />
        <VoteIcon className={cls} />
        <KeyRoundIcon className={cls} />
      </OrbitingCircles>
    </div>
  );
}
