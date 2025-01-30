import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VirtualGiftStore } from "./VirtualGiftStore";
import { AdCampaignManager } from "./AdCampaignManager";
import { RevenueAnalytics } from "./RevenueAnalytics";
import { SponsorshipManager } from "./SponsorshipManager";

export function MonetizationDashboard({ streamId }: { streamId: string }) {
  return (
    <Tabs defaultValue="gifts" className="w-full">
      <TabsList>
        <TabsTrigger value="gifts">Virtual Gifts</TabsTrigger>
        <TabsTrigger value="campaigns">Ad Campaigns</TabsTrigger>
        <TabsTrigger value="revenue">Revenue</TabsTrigger>
        <TabsTrigger value="sponsorships">Sponsorships</TabsTrigger>
      </TabsList>

      <TabsContent value="gifts">
        <VirtualGiftStore streamId={streamId} />
      </TabsContent>

      <TabsContent value="campaigns">
        <AdCampaignManager />
      </TabsContent>

      <TabsContent value="revenue">
        <RevenueAnalytics streamId={streamId} />
      </TabsContent>

      <TabsContent value="sponsorships">
        <SponsorshipManager streamId={streamId} />
      </TabsContent>
    </Tabs>
  );
}