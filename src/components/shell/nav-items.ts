import {
  BellIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CarFrontIcon,
  CircleHelpIcon,
  HomeIcon,
  MenuIcon,
  PlusIcon,
  SearchIcon,
  ShoppingBagIcon,
  UtensilsIcon,
  Users2Icon,
  VoteIcon,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Phase in which the real page lands; used by the placeholder route. */
  phase: number;
}

/** Mobile bottom bar: five thumb-reachable destinations. */
export const primaryNav: NavItem[] = [
  { href: "/feed", label: "Feed", icon: HomeIcon, phase: 3 },
  { href: "/questions", label: "Questions", icon: CircleHelpIcon, phase: 3 },
  { href: "/post", label: "Post", icon: PlusIcon, phase: 3 },
  { href: "/inbox", label: "Inbox", icon: BellIcon, phase: 3 },
  { href: "/more", label: "Menu", icon: MenuIcon, phase: 3 },
];

/** Desktop sidebar: everything, grouped. */
export const moduleNav: NavItem[] = [
  { href: "/events", label: "Events", icon: CalendarDaysIcon, phase: 4 },
  { href: "/market", label: "Marketplace", icon: ShoppingBagIcon, phase: 4 },
  { href: "/meals", label: "Meal gifting", icon: UtensilsIcon, phase: 4 },
  { href: "/lost-found", label: "Lost & found", icon: SearchIcon, phase: 4 },
  { href: "/rides", label: "Rides", icon: CarFrontIcon, phase: 4 },
  { href: "/study", label: "Study groups", icon: BookOpenIcon, phase: 4 },
  { href: "/roommates", label: "Roommates", icon: Users2Icon, phase: 4 },
  { href: "/polls", label: "Polls", icon: VoteIcon, phase: 4 },
];

export const placeholderSections: Record<string, { label: string; phase: number; blurb: string }> = {
  questions: { label: "Questions", phase: 3, blurb: "Ask once, get a real answer, mark it accepted so the next person finds it." },
  post: { label: "New post", phase: 3, blurb: "Structured post types with expiry: no endless feed of stale notices." },
  inbox: { label: "Inbox", phase: 3, blurb: "Replies, thank-yous, and relay messages. Digests go out weekly, not hourly." },
  more: { label: "Menu", phase: 3, blurb: "Spaces, settings, sessions, and your data export live here." },
  events: { label: "Events", phase: 4, blurb: "RSVP and add to your calendar with one tap." },
  market: { label: "Marketplace", phase: 4, blurb: "Buy and sell within campus. No payments here, and your email stays masked." },
  meals: { label: "Meal gifting", phase: 4, blurb: "Treat a friend or donate a swipe. Gifting only: nothing is ever sold." },
  "lost-found": { label: "Lost & found", phase: 4, blurb: "Post what you found, claim what you lost." },
  rides: { label: "Rides", phase: 4, blurb: "Share a ride home for the break." },
  study: { label: "Study groups", phase: 4, blurb: "Find people taking the same class this term." },
  roommates: { label: "Roommates", phase: 4, blurb: "Roommate and sublet listings with expiry." },
  polls: { label: "Polls", phase: 4, blurb: "Quick campus polls, one vote per verified student." },
};
