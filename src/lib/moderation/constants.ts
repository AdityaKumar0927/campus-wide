/** Report categories (DSA notice-and-action, pilot §5) and the campus module flags. Shared by forms and actions. */
export const REPORT_CATEGORIES = [
  ["harassment", "Harassment or threats"],
  ["stalking", "Stalking or unwanted contact"],
  ["scam", "Scam or lying (no-show, fake offer, payment request)"],
  ["impersonation", "Impersonation or account sharing"],
  ["hate", "Hate or discrimination"],
  ["sexual", "Sexual content"],
  ["meal_resale", "Selling or trading meal credits"],
  ["prohibited_item", "A prohibited item"],
  ["spam", "Spam"],
  ["other", "Something else"],
] as const;

export const FLAG_KEYS = ["questions", "events", "market", "meals", "lost_found", "rides", "study", "roommates", "polls", "ai_server"] as const;
