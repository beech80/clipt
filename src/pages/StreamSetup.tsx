import { StreamDashboard } from '@/components/streaming/StreamDashboard';
import { Radio, MonitorPlay } from 'lucide-react';

export default function StreamSetup() {
  return <main className="clipt-stream-setup container max-w-6xl px-4 py-6 space-y-6">
    <header className="flex items-center gap-3"><Radio aria-hidden="true" className="h-7 w-7 text-purple-400" /><h1 className="text-2xl font-bold">Go Live / Stream Setup</h1></header>
    <p className="text-muted-foreground">Manage your own broadcast. Keep ingest credentials private.</p>
    <div className="clipt-stream-setup-layout">
    <section aria-label="Broadcast instructions" className="gaming-card p-6 space-y-4">
      <div className="clipt-stream-preview"><MonitorPlay aria-hidden="true" className="h-16 w-16 text-purple-300" /><h2 className="text-xl font-semibold">Watch your broadcast in Clipt</h2><p>For the development pilot, connect OBS, then choose “Check Mux test status / playback” in the Stream Dashboard. The video appears below that button, not in this instruction panel. Use the video’s Play control if needed.</p></div>
      <p className="text-sm text-muted-foreground">Prepare your encoder, initialize ingest, then connect. Clipt only displays LIVE after the streaming backend confirms the incoming broadcast.</p>
    </section>
    <StreamDashboard />
    </div>
  </main>;
}
