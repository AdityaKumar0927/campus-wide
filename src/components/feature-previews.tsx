import { EventPreview } from "./previews/event-preview";
import { LostFoundPreview } from "./previews/lost-found-preview";
import { MarketPreview } from "./previews/market-preview";
import { MealPreview } from "./previews/meal-preview";
import { PollPreview } from "./previews/poll-preview";
import { QaPreview } from "./previews/qa-preview";
import { RidePreview } from "./previews/ride-preview";
import { RoommatePreview } from "./previews/roommate-preview";
import { StudyPreview } from "./previews/study-preview";

/** Nine working previews with sample data: the board as students will use it. */
export function FeaturePreviews() {
  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3" aria-label="Feature previews">
      <QaPreview />
      <EventPreview />
      <MarketPreview />
      <MealPreview />
      <LostFoundPreview />
      <RidePreview />
      <StudyPreview />
      <RoommatePreview />
      <PollPreview />
    </ul>
  );
}
