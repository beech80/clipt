import { OverlayDesigner } from "@/components/streaming/overlay/OverlayDesigner";
import { SceneTransitions } from "@/components/streaming/transitions/SceneTransitions";
import { AlertCreator } from "@/components/streaming/alerts/AlertCreator";

export default function Home() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Stream Tools</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <OverlayDesigner />
        <div className="space-y-6">
          <SceneTransitions />
          <AlertCreator />
        </div>
      </div>
    </div>
  );
}