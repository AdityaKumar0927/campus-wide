/** House rules every student ticks before their first post (recorded in the consent ledger). */
export const SAFETY_RULES = [
  { key: "public_places", text: "I will only meet people from this board in public campus places, in daylight where I can." },
  { key: "no_payments", text: "Nothing is bought or sold here. I will not pay, ask for payment, or move a deal to another app." },
  { key: "meals_in_person", text: "A meal treat only happens with the plan holder present at The Commons register. I will never lend or borrow a HawkCard." },
  { key: "report", text: "I know how to block and report, and that reports keep the full thread as evidence." },
  { key: "retention", text: "I understand what is kept and for how long, and that my UID identifies me to moderators and the university if I break these rules." },
] as const;
