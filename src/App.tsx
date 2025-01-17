import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { StreamProvider } from "@/contexts/StreamContext";
import { Layout } from "@/components/Layout";
import { PrivateRoute } from "@/components/PrivateRoute";
import { Home } from "@/pages/Home";
import { Profile } from "@/pages/Profile";
import { Settings } from "@/pages/Settings";
import { Stream } from "@/pages/Stream";
import { StreamSettings } from "@/pages/StreamSettings";
import { StreamDashboard } from "@/pages/StreamDashboard";
import { StreamChat } from "@/pages/StreamChat";
import { StreamAnalytics } from "@/pages/StreamAnalytics";
import { StreamEmotes } from "@/pages/StreamEmotes";
import { StreamModerators } from "@/pages/StreamModerators";
import { StreamBans } from "@/pages/StreamBans";
import { StreamRevenue } from "@/pages/StreamRevenue";
import { StreamClips } from "@/pages/StreamClips";
import { StreamVODs } from "@/pages/StreamVODs";
import { StreamSchedule } from "@/pages/StreamSchedule";
import { StreamAlerts } from "@/pages/StreamAlerts";
import { StreamOverlay } from "@/pages/StreamOverlay";
import { StreamWebhooks } from "@/pages/StreamWebhooks";
import { StreamAPI } from "@/pages/StreamAPI";
import { StreamIntegrations } from "@/pages/StreamIntegrations";
import { StreamBots } from "@/pages/StreamBots";
import { StreamCommands } from "@/pages/StreamCommands";
import { StreamTimers } from "@/pages/StreamTimers";
import { StreamLoyalty } from "@/pages/StreamLoyalty";
import { StreamGiveaways } from "@/pages/StreamGiveaways";
import { StreamPolls } from "@/pages/StreamPolls";
import { StreamPredictions } from "@/pages/StreamPredictions";
import { StreamSponsors } from "@/pages/StreamSponsors";
import { StreamMerch } from "@/pages/StreamMerch";
import { StreamDonations } from "@/pages/StreamDonations";
import { StreamSubscriptions } from "@/pages/StreamSubscriptions";
import { StreamBits } from "@/pages/StreamBits";
import { StreamCheering } from "@/pages/StreamCheering";
import { StreamRaids } from "@/pages/StreamRaids";
import { StreamHosting } from "@/pages/StreamHosting";
import { StreamFollowers } from "@/pages/StreamFollowers";
import { StreamSubscribers } from "@/pages/StreamSubscribers";
import { StreamVIPs } from "@/pages/StreamVIPs";
import { StreamMods } from "@/pages/StreamMods";
import { StreamBanned } from "@/pages/StreamBanned";
import { StreamBlocked } from "@/pages/StreamBlocked";
import { StreamIgnored } from "@/pages/StreamIgnored";
import { StreamWhispers } from "@/pages/StreamWhispers";
import { StreamMessages } from "@/pages/StreamMessages";
import { StreamNotifications } from "@/pages/StreamNotifications";
import { StreamActivity } from "@/pages/StreamActivity";
import { StreamAchievements } from "@/pages/StreamAchievements";
import { StreamChallenges } from "@/pages/StreamChallenges";
import { StreamQuests } from "@/pages/StreamQuests";
import { StreamMissions } from "@/pages/StreamMissions";
import { StreamTasks } from "@/pages/StreamTasks";
import { StreamGoals } from "@/pages/StreamGoals";
import { StreamMilestones } from "@/pages/StreamMilestones";
import { StreamRewards } from "@/pages/StreamRewards";
import { StreamStore } from "@/pages/StreamStore";
import { StreamInventory } from "@/pages/StreamInventory";
import { StreamBank } from "@/pages/StreamBank";
import { StreamWallet } from "@/pages/StreamWallet";
import Collections from "@/pages/Collections";
import CollectionDetail from "@/pages/CollectionDetail";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <SocketProvider>
            <StreamProvider>
              <Router>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/profile/:username" element={<Profile />} />
                    <Route path="/collections" element={<Collections />} />
                    <Route path="/collections/:id" element={<CollectionDetail />} />
                    <Route
                      path="/settings"
                      element={
                        <PrivateRoute>
                          <Settings />
                        </PrivateRoute>
                      }
                    />
                    <Route path="/:username" element={<Stream />} />
                    <Route
                      path="/:username/dashboard"
                      element={
                        <PrivateRoute>
                          <StreamDashboard />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/chat"
                      element={
                        <PrivateRoute>
                          <StreamChat />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/analytics"
                      element={
                        <PrivateRoute>
                          <StreamAnalytics />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/emotes"
                      element={
                        <PrivateRoute>
                          <StreamEmotes />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/moderators"
                      element={
                        <PrivateRoute>
                          <StreamModerators />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/bans"
                      element={
                        <PrivateRoute>
                          <StreamBans />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/revenue"
                      element={
                        <PrivateRoute>
                          <StreamRevenue />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/clips"
                      element={
                        <PrivateRoute>
                          <StreamClips />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/vods"
                      element={
                        <PrivateRoute>
                          <StreamVODs />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/schedule"
                      element={
                        <PrivateRoute>
                          <StreamSchedule />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/alerts"
                      element={
                        <PrivateRoute>
                          <StreamAlerts />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/overlay"
                      element={
                        <PrivateRoute>
                          <StreamOverlay />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/webhooks"
                      element={
                        <PrivateRoute>
                          <StreamWebhooks />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/api"
                      element={
                        <PrivateRoute>
                          <StreamAPI />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/integrations"
                      element={
                        <PrivateRoute>
                          <StreamIntegrations />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/bots"
                      element={
                        <PrivateRoute>
                          <StreamBots />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/commands"
                      element={
                        <PrivateRoute>
                          <StreamCommands />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/timers"
                      element={
                        <PrivateRoute>
                          <StreamTimers />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/loyalty"
                      element={
                        <PrivateRoute>
                          <StreamLoyalty />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/giveaways"
                      element={
                        <PrivateRoute>
                          <StreamGiveaways />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/polls"
                      element={
                        <PrivateRoute>
                          <StreamPolls />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/predictions"
                      element={
                        <PrivateRoute>
                          <StreamPredictions />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/sponsors"
                      element={
                        <PrivateRoute>
                          <StreamSponsors />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/merch"
                      element={
                        <PrivateRoute>
                          <StreamMerch />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/donations"
                      element={
                        <PrivateRoute>
                          <StreamDonations />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/subscriptions"
                      element={
                        <PrivateRoute>
                          <StreamSubscriptions />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/bits"
                      element={
                        <PrivateRoute>
                          <StreamBits />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/cheering"
                      element={
                        <PrivateRoute>
                          <StreamCheering />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/raids"
                      element={
                        <PrivateRoute>
                          <StreamRaids />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/hosting"
                      element={
                        <PrivateRoute>
                          <StreamHosting />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/followers"
                      element={
                        <PrivateRoute>
                          <StreamFollowers />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/subscribers"
                      element={
                        <PrivateRoute>
                          <StreamSubscribers />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/vips"
                      element={
                        <PrivateRoute>
                          <StreamVIPs />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/mods"
                      element={
                        <PrivateRoute>
                          <StreamMods />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/banned"
                      element={
                        <PrivateRoute>
                          <StreamBanned />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/blocked"
                      element={
                        <PrivateRoute>
                          <StreamBlocked />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/ignored"
                      element={
                        <PrivateRoute>
                          <StreamIgnored />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/whispers"
                      element={
                        <PrivateRoute>
                          <StreamWhispers />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/messages"
                      element={
                        <PrivateRoute>
                          <StreamMessages />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/notifications"
                      element={
                        <PrivateRoute>
                          <StreamNotifications />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/activity"
                      element={
                        <PrivateRoute>
                          <StreamActivity />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/achievements"
                      element={
                        <PrivateRoute>
                          <StreamAchievements />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/challenges"
                      element={
                        <PrivateRoute>
                          <StreamChallenges />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/quests"
                      element={
                        <PrivateRoute>
                          <StreamQuests />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/missions"
                      element={
                        <PrivateRoute>
                          <StreamMissions />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/tasks"
                      element={
                        <PrivateRoute>
                          <StreamTasks />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/goals"
                      element={
                        <PrivateRoute>
                          <StreamGoals />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/milestones"
                      element={
                        <PrivateRoute>
                          <StreamMilestones />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/rewards"
                      element={
                        <PrivateRoute>
                          <StreamRewards />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/store"
                      element={
                        <PrivateRoute>
                          <StreamStore />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/inventory"
                      element={
                        <PrivateRoute>
                          <StreamInventory />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/bank"
                      element={
                        <PrivateRoute>
                          <StreamBank />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/wallet"
                      element={
                        <PrivateRoute>
                          <StreamWallet />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/:username/settings"
                      element={
                        <PrivateRoute>
                          <StreamSettings />
                        </PrivateRoute>
                      }
                    />
                  </Routes>
                </Layout>
              </Router>
            </StreamProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;