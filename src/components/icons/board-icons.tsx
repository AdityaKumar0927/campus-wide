import type { ReactElement, SVGProps } from "react";

/**
 * Campus Wide's own icon set: hand-drawn line icons on a 24-grid with slightly imperfect geometry,
 * rounded caps, and one pin motif shared across the family. Use instead of a generic library for
 * anything that names a module or a board action.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 24, children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      {children}
    </svg>
  );
}

/** Question: a paper note with a curling question mark. */
export const QuestionIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5.5 4.5h11.2l2.3 2.4v12.6H5.5z" />
    <path d="M9.6 9.6c.3-1.5 1.4-2.2 2.6-2.2 1.4 0 2.5.9 2.5 2.2 0 1.8-2.6 1.9-2.6 4" />
    <circle cx="12.1" cy="16.7" r=".5" fill="currentColor" />
  </Base>
);

/** Event: a flyer with a pin and a date block. */
export const EventIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.8 7.2h14.4v12.3H4.8z" />
    <path d="M4.8 11h14.4" />
    <path d="M9 4.6v4.4M15 4.6v4.4" />
    <path d="M8.4 14.2h2.3v2.3H8.4z" fill="currentColor" stroke="none" />
  </Base>
);

/** Marketplace: a price tag with a tear-off tab. */
export const MarketIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.6 12.6 12.4 4.8h6.8v6.8l-7.8 7.8z" />
    <circle cx="15.6" cy="8.4" r="1.1" />
    <path d="M9.6 19.4v2.2M11.4 17.6v2.2" strokeDasharray="1 1.4" />
  </Base>
);

/** Meal gift: a tray with a fork and a little heart. */
export const MealIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.8 15.6h16.4" />
    <path d="M5.6 15.6c0-3.8 2.9-6.4 6.4-6.4s6.4 2.6 6.4 6.4" />
    <path d="M12 6.8v2.4" />
    <path d="M12 3.6c.5-1 2.2-.9 2.2.4 0 1-2.2 2.2-2.2 2.2S9.8 5 9.8 4c0-1.3 1.7-1.4 2.2-.4z" fill="currentColor" stroke="none" />
    <path d="M6.2 18.4h11.6" />
  </Base>
);

/** Lost & found: a key with a duck keychain (yes, that duck). */
export const LostFoundIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="8" cy="9.5" r="3.4" />
    <path d="M10.6 11.8l6.4 6.4M14.4 15.6l1.6-1.6M16.4 17.6l1.6-1.6" />
    <path d="M15.8 5.2c1.6-1.9 4.3-.6 3.7 1.5-.2.8-1 1.1-1.8 1.1h-2.2c-.4 0-.7-.3-.7-.7 0-.8.4-1.4 1-1.9z" />
  </Base>
);

/** Ride: a small car with a suitcase on the roof. */
export const RideIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.2 15.4l1.6-4.6h12.4l1.6 4.6v2.8H4.2z" />
    <circle cx="8" cy="18.6" r="1.4" /><circle cx="16" cy="18.6" r="1.4" />
    <path d="M8.6 5.6h6.8v3.2H8.6z" />
    <path d="M10.6 5.6V4.4h2.8v1.2" />
  </Base>
);

/** Study group: two books and a pencil. */
export const StudyIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.6 6.4h5.8v12.4H4.6zM10.4 6.4h5.8v12.4h-5.8" />
    <path d="M18.6 5.2l1.6 1.6-6.2 6.2-2.2.6.6-2.2z" />
    <path d="M6.6 10.2h1.8M12.4 10.2h1.8" />
  </Base>
);

/** Roommates: a door with a name tag. */
export const RoommateIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6.6 20V5.6a1.4 1.4 0 0 1 1.4-1.4h8a1.4 1.4 0 0 1 1.4 1.4V20" />
    <path d="M4.4 20h15.2" />
    <circle cx="14.6" cy="12.6" r=".7" fill="currentColor" />
    <path d="M9 7.4h4.6v2.4H9z" />
  </Base>
);

/** Poll: a ballot slipping into a box. */
export const PollIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 12.4h14v7.2H5z" />
    <path d="M8.6 12.4l.9-2.6h5l.9 2.6" />
    <path d="M9.6 4.4h4.8v5.4H9.6z" />
    <path d="M10.9 7.2l1 1 1.8-1.9" />
  </Base>
);

/** Feed: the board itself with three pinned notes. */
export const BoardIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.6" y="4.6" width="16.8" height="14.8" rx="1.6" />
    <path d="M6.6 8.2h4.4v4.2H6.6zM13 8.2h4.4v6H13zM6.6 14.4h4.4v2.6H6.6z" />
    <circle cx="8.8" cy="7.6" r=".9" fill="currentColor" stroke="none" /><circle cx="15.2" cy="7.6" r=".9" fill="currentColor" stroke="none" />
  </Base>
);

/** Inbox: an envelope with a pin through it. */
export const InboxIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7.4h16v11.2H4z" />
    <path d="M4 7.4l8 6.2 8-6.2" />
    <circle cx="12" cy="4.6" r="1.6" fill="currentColor" stroke="none" />
    <path d="M12 6.2v2.6" />
  </Base>
);

/** Pin (new post): the thumbtack from the wordmark, as a line icon. */
export const PinIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M9.4 4.2h5.2l-.7 5.4 2.6 2.4H7.5l2.6-2.4z" />
    <path d="M12 12v8" />
  </Base>
);

/** Menu: three torn strips. */
export const MenuIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.6 7.2h14.8M4.6 12h11.2M4.6 16.8h14" />
  </Base>
);

/** Tick: a quick hand-drawn check. */
export const TickIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5.2 12.8l4.2 4 9.4-9.8" />
  </Base>
);

/** Thanks: a heart drawn in one stroke, slightly open at the top. */
export const ThanksIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 19.4S4.6 14.8 4.6 9.4c0-2.2 1.7-3.9 3.8-3.9 1.5 0 2.8.8 3.6 2.1.8-1.3 2.1-2.1 3.6-2.1 2.1 0 3.8 1.7 3.8 3.9 0 5.4-7.4 10-7.4 10z" />
  </Base>
);

/** Signal lost: a notice blowing off the board. */
export const OffBoardIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 5.4l9.2-1.6 1.4 12.4-9.2 1.6z" />
    <path d="M9.6 9.2l4.6-.8M10 12.4l4.6-.8" />
    <path d="M3.6 19.6c1.6-1 3.2-1 4.8 0M3.6 16.4c1-.6 2-.6 3 0" />
  </Base>
);

export type { IconProps };
export type IconComponent = (props: IconProps) => ReactElement;
