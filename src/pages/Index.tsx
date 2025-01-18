import { SeasonBanner } from "@/components/seasons/SeasonBanner";
import { XPMultipliersList } from "@/components/multipliers/XPMultipliersList";
import { ActiveChallenges } from "@/components/challenges/ActiveChallenges";

export default function Index() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <SeasonBanner />
      <XPMultipliersList />
      <ActiveChallenges />
    </div>
  );
}