import { PinMark } from "@/components/shell/wordmark";
import { cn } from "@/lib/utils";

/**
 * "Recently pinned": a slow strip of notices drifting across the board. Pure CSS; pauses on hover
 * and focus, and becomes a static wrapped list when the user prefers reduced motion.
 * The second copy exists only to make the loop seamless and is hidden from assistive tech.
 */

const items = [
  ["Question", "Does the 2am library shuttle still run during reading week?"],
  ["Found", "Keys with a duck keychain, outside the chemistry building"],
  ["Ride", "Two seats to the airport, Saturday 6am"],
  ["Event", "Jazz night in the union basement, Friday 8pm"],
  ["Study", "Organic chem section 3, meeting Thursdays"],
  ["Gift", "Two guest swipes to give away before Sunday"],
  ["For sale", "Commuter bike, new brakes, lock included"],
  ["Roommate", "Sublet near north campus, spring term"],
] as const;

function Strip({ hidden }: { hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden || undefined} className="items-center">
      {items.map(([kind, text]) => (
        <li key={text} className="flex items-center gap-2 whitespace-nowrap text-sm">
          <PinMark className="size-3" />
          <span className="stamp">{kind}</span>
          <span className="text-muted-foreground">{text}</span>
        </li>
      ))}
    </ul>
  );
}

export function PinnedTicker({ className }: { className?: string }) {
  return (
    <section aria-label="Recently pinned" className={cn("border-y border-rule py-3", className)}>
      <div className="ticker">
        <Strip />
        <Strip hidden />
      </div>
    </section>
  );
}
