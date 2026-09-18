/**
 * Payment and pressure words (docs/pilot/illinois-tech.md §4). Mirrors app.payment_words() in the
 * database: the browser warns before sending, the server records what it found.
 */
export const PAYMENT_WORDS = [
  "zelle", "venmo", "cash app", "cashapp", "paypal", "apple pay", "deposit", "gift card", "wire", "bitcoin", "crypto",
  "western union", "whatsapp", "telegram", "off the app", "text me at", "send me your number", "your pin",
] as const;

export function findPaymentWords(text: string): string[] {
  const lower = text.toLowerCase();
  return PAYMENT_WORDS.filter((w) => lower.includes(w));
}

/** Items the marketplace refuses (docs/BRIEF.md §8). Matched against title and body. */
export const PROHIBITED_ITEMS = [
  "meal swipe", "meal swipes", "guest meal", "dining dollars", "bonus points", "techcash", "hawkcard", "student id",
  "alcohol", "vape", "nicotine", "weed", "cannabis", "adderall", "prescription", "firearm", "gun", "ammo", "knife",
  "exam answers", "essay writing", "homework for", "ticket resale", "counterfeit", "fake id",
] as const;

export function findProhibitedItems(text: string): string[] {
  const lower = text.toLowerCase();
  return PROHIBITED_ITEMS.filter((w) => lower.includes(w));
}
