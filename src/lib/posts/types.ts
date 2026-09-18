import { z } from "zod";

/** Every notice type on the board, in the order the composer offers them. */
export const POST_TYPES = ["question", "notice", "event", "listing", "meal", "lost", "found", "ride", "study", "roommate", "poll"] as const;
export type PostType = (typeof POST_TYPES)[number];
export type Stock = "white" | "manila" | "blue" | "pink" | "yellow" | "green";

export interface PostTypeMeta {
  label: string;
  plural: string;
  /** Paper stock and pin colour on the board. */
  stock: Stock;
  pinHue: number;
  titleLabel: string;
  bodyLabel: string;
  hint: string;
  /** Feature flag key on universities.feature_flags, or null when always on. */
  flag: string | null;
  /** Phase in which the type opens in the composer. */
  phase: 3 | 4;
  /** Default lifetime in days (null = never expires). */
  defaultExpiryDays: number | null;
  imagesAllowed: boolean;
}

export const POST_TYPE_META: Record<PostType, PostTypeMeta> = {
  question: { label: "Question", plural: "Questions", stock: "blue", pinHue: 25, titleLabel: "Your question", bodyLabel: "Details (optional)", hint: "Ask once. The best answer gets pinned at the top.", flag: "questions", phase: 3, defaultExpiryDays: null, imagesAllowed: false },
  notice: { label: "Notice", plural: "Notices", stock: "white", pinHue: 25, titleLabel: "What do you want the campus to know?", bodyLabel: "More (optional)", hint: "Anything that belongs on a board: a heads-up, a call for people, a thing to share.", flag: null, phase: 3, defaultExpiryDays: 30, imagesAllowed: true },
  event: { label: "Event", plural: "Events", stock: "white", pinHue: 155, titleLabel: "Event name", bodyLabel: "What to expect", hint: "RSVP and a calendar file come free.", flag: "events", phase: 4, defaultExpiryDays: null, imagesAllowed: true },
  listing: { label: "For sale", plural: "Marketplace", stock: "manila", pinHue: 250, titleLabel: "What are you selling?", bodyLabel: "Condition, pickup, anything a buyer should know", hint: "No payments here. Buyers take a tab and you talk through the board.", flag: "market", phase: 4, defaultExpiryDays: 30, imagesAllowed: true },
  meal: { label: "Meal gift", plural: "Meal gifting", stock: "green", pinHue: 155, titleLabel: "What are you offering?", bodyLabel: "When and where you will be", hint: "Gift only. The plan holder is present and taps their own HawkCard.", flag: "meals", phase: 4, defaultExpiryDays: 7, imagesAllowed: false },
  lost: { label: "Lost", plural: "Lost & found", stock: "yellow", pinHue: 25, titleLabel: "What did you lose?", bodyLabel: "Where and when you last had it", hint: "Finders claim through the board; hand-off at a public desk.", flag: "lost_found", phase: 4, defaultExpiryDays: 30, imagesAllowed: true },
  found: { label: "Found", plural: "Lost & found", stock: "yellow", pinHue: 25, titleLabel: "What did you find?", bodyLabel: "Where it is now", hint: "Describe it loosely; the owner proves it is theirs in the thread.", flag: "lost_found", phase: 4, defaultExpiryDays: 30, imagesAllowed: true },
  ride: { label: "Ride", plural: "Rides", stock: "green", pinHue: 250, titleLabel: "Where to?", bodyLabel: "Meeting point, luggage, anything else", hint: "Costs are split in person. Rides expire the moment they leave.", flag: "rides", phase: 4, defaultExpiryDays: null, imagesAllowed: false },
  study: { label: "Study group", plural: "Study groups", stock: "blue", pinHue: 25, titleLabel: "Course or topic", bodyLabel: "When, where, how you work", hint: "Small groups fill fast; set a cap.", flag: "study", phase: 4, defaultExpiryDays: 60, imagesAllowed: false },
  roommate: { label: "Roommate or sublet", plural: "Roommates", stock: "pink", pinHue: 25, titleLabel: "What are you offering or looking for?", bodyLabel: "The place, the dates, the people", hint: "Listings expire; nothing is paid through the board.", flag: "roommates", phase: 4, defaultExpiryDays: 45, imagesAllowed: true },
  poll: { label: "Poll", plural: "Polls", stock: "white", pinHue: 155, titleLabel: "Your question", bodyLabel: "Context (optional)", hint: "One vote per verified student.", flag: "polls", phase: 4, defaultExpiryDays: 7, imagesAllowed: false },
};

const isoDate = z.string().datetime({ offset: true });
const shortText = (max: number) => z.string().trim().max(max);

/** Type-specific fields stored in posts.payload. Unknown keys are rejected. */
export const payloadSchemas = {
  question: z.object({}).strict(),
  notice: z.object({}).strict(),
  event: z.object({ startsAt: isoDate, endsAt: isoDate.optional(), location: shortText(200), rsvpLimit: z.number().int().min(1).max(5000).optional() }).strict(),
  listing: z.object({ priceCents: z.number().int().min(0).max(500_000).nullable(), condition: z.enum(["new", "like_new", "good", "fair"]), category: shortText(40) }).strict(),
  meal: z.object({ kind: z.enum(["guest_meal_treat", "donation"]), location: shortText(120), window: shortText(120) }).strict(),
  lost: z.object({ where: shortText(160), when: shortText(80), category: shortText(40) }).strict(),
  found: z.object({ where: shortText(160), when: shortText(80), category: shortText(40), heldAt: shortText(160).optional() }).strict(),
  ride: z.object({ from: shortText(120), to: shortText(120), departsAt: isoDate, seats: z.number().int().min(1).max(8), costSplit: z.boolean() }).strict(),
  study: z.object({ course: shortText(40), meets: shortText(120), location: shortText(120), capacity: z.number().int().min(2).max(50).optional() }).strict(),
  roommate: z.object({ kind: z.enum(["sublet", "roommate", "looking"]), rentCents: z.number().int().min(0).max(1_000_000).nullable(), moveIn: z.string().max(20), moveOut: z.string().max(20).optional(), location: shortText(160) }).strict(),
  poll: z.object({ options: z.array(shortText(80)).min(2).max(8), multiple: z.boolean().default(false) }).strict(),
} satisfies Record<PostType, z.ZodTypeAny>;

export type PostPayload<T extends PostType> = z.infer<(typeof payloadSchemas)[T]>;

export function parsePayload(type: PostType, payload: unknown) {
  return payloadSchemas[type].safeParse(payload ?? {});
}

/** Fields every composer submits; type-specific fields are validated separately. */
export const createPostSchema = z.object({
  type: z.enum(POST_TYPES),
  title: z.string().trim().min(3, "Give it a few more words.").max(200, "Keep the title under 200 characters."),
  body: z.string().trim().max(10_000, "That is longer than the board can hold.").default(""),
  spaceId: z.string().uuid().nullable().default(null),
  expiresInDays: z.coerce.number().int().min(1).max(120).nullable().default(null),
  images: z.array(z.string().max(300)).max(4).default([]),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const commentSchema = z.object({
  body: z.string().trim().min(2, "Say a little more.").max(5000, "Keep it under 5,000 characters."),
  parentId: z.string().uuid().nullable().default(null),
});
