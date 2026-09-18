"use client";

import { stuffIcons } from "@/components/icons/stuff-icons";
import { IconCloud } from "@/components/ui/icon-cloud";

/** The stuff of campus life: what gets lost, lent, found, and passed on. Drag to spin. */
export function CampusIconCloud() {
  return (
    <div data-nondeterministic className="relative mx-auto flex size-[24rem] items-center justify-center overflow-hidden text-foreground" aria-hidden>
      <IconCloud showControl={false} icons={stuffIcons.map((Icon, i) => <Icon key={i} size={64} />)} />
    </div>
  );
}
