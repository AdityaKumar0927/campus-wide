import {
  BoardIcon,
  EventIcon,
  InboxIcon,
  LostFoundIcon,
  MarketIcon,
  MealIcon,
  MenuIcon,
  PinIcon,
  PollIcon,
  QuestionIcon,
  RideIcon,
  RoommateIcon,
  StudyIcon,
  TickIcon,
  type IconComponent,
} from "@/components/icons/board-icons";

export interface NavItem {
  href: string;
  label: string;
  icon: IconComponent;
  /** Feature flag on universities.feature_flags that switches the module on. */
  flag?: string;
  /** Phase in which the real page lands; used by the placeholder route. */
  phase: number;
}

/** Mobile bottom bar: five thumb-reachable destinations. */
export const primaryNav: NavItem[] = [
  { href: "/feed", label: "Feed", icon: BoardIcon, phase: 3 },
  { href: "/questions", label: "Questions", icon: QuestionIcon, phase: 3 },
  { href: "/post", label: "Pin", icon: PinIcon, phase: 3 },
  { href: "/inbox", label: "Inbox", icon: InboxIcon, phase: 3 },
  { href: "/more", label: "Menu", icon: MenuIcon, phase: 3 },
];

/** Desktop sidebar extras: ways around the board. */
export const exploreNav: NavItem[] = [
  { href: "/spaces", label: "Spaces", icon: RoommateIcon, phase: 3 },
  { href: "/threads", label: "Threads", icon: MarketIcon, phase: 4 },
  { href: "/search", label: "Search", icon: LostFoundIcon, phase: 3 },
];

/** Role links: shown only to moderators and campus admins. */
export const roleNav: (NavItem & { role: "moderator" | "university_admin" })[] = [
  { href: "/mod", label: "Moderation", icon: TickIcon, phase: 5, role: "moderator" },
  { href: "/admin", label: "Campus admin", icon: BoardIcon, phase: 5, role: "university_admin" },
];

/** Desktop sidebar: everything, grouped. */
export const moduleNav: NavItem[] = [
  { href: "/events", label: "Events", icon: EventIcon, phase: 4, flag: "events" },
  { href: "/market", label: "Marketplace", icon: MarketIcon, phase: 4, flag: "market" },
  { href: "/meals", label: "Meal gifting", icon: MealIcon, phase: 4, flag: "meals" },
  { href: "/lost-found", label: "Lost & found", icon: LostFoundIcon, phase: 4, flag: "lost_found" },
  { href: "/rides", label: "Rides", icon: RideIcon, phase: 4, flag: "rides" },
  { href: "/study", label: "Study groups", icon: StudyIcon, phase: 4, flag: "study" },
  { href: "/roommates", label: "Roommates", icon: RoommateIcon, phase: 4, flag: "roommates" },
  { href: "/polls", label: "Polls", icon: PollIcon, phase: 4, flag: "polls" },
];
