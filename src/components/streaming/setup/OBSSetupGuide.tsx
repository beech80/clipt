
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Steps } from "@/components/ui/steps";

export const OBSSetupGuide = () => {
  const steps = [
    {
      title: "Download and Install OBS",
      description: "Download OBS Studio from obsproject.com and install it on your computer."
    },
    {
      title: "Configure Stream Settings",
      description: "In OBS, go to Settings > Stream. Select 'Custom' as the service and copy the Stream URL and Stream Key from above."
    },
    {
      title: "Set Up Video Settings",
      description: "Go to Settings > Video. Set your Base Resolution to your monitor's resolution and Output Resolution to 1080p or 720p depending on your internet speed."
    },
    {
      title: "Configure Output Settings",
      description: "In Settings > Output, select Hardware (NVENC) if you have an NVIDIA GPU, or x264 otherwise. Set the bitrate between 2500-6000 Kbps depending on your resolution and internet speed."
    },
    {
      title: "Set Up Audio",
      description: "In Settings > Audio, ensure your microphone and desktop audio devices are properly configured."
    },
    {
      title: "Create Scenes",
      description: "Add your scenes and sources (game capture, webcam, overlays) in the main OBS window."
    },
  ];

  const recommendedSettings = {
    resolution: "1920x1080 or 1280x720",
    fps: "60 or 30 fps",
    bitrate: {
      hd: "4000-6000 Kbps for 1080p",
      sd: "2500-4000 Kbps for 720p"
    },
    audio: {
      bitrate: "160 Kbps",
      sampleRate: "48 kHz"
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>OBS Setup Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <Steps steps={steps} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Video Settings</h4>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Resolution: {recommendedSettings.resolution}</li>
                <li>Frame Rate: {recommendedSettings.fps}</li>
                <li>Keyframe Interval: 2 seconds</li>
                <li>B-frames: 2</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Bitrate Settings</h4>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>{recommendedSettings.bitrate.hd}</li>
                <li>{recommendedSettings.bitrate.sd}</li>
                <li>Audio: {recommendedSettings.audio.bitrate}</li>
                <li>Sample Rate: {recommendedSettings.audio.sampleRate}</li>
              </ul>
            </div>
          </div>

          <Alert className="mt-4">
            <AlertDescription>
              For the best streaming experience, make sure your upload speed is at least 1.5x your chosen bitrate.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
