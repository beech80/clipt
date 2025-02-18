
import { RouteObject } from "react-router-dom";
import Broadcasting from "@/pages/Broadcasting";
import Schedule from "@/pages/Schedule";
import Streaming from "@/pages/Streaming";
import TwitchCallback from "@/pages/TwitchCallback";

export const streamingRoutes: RouteObject[] = [
  {
    path: "broadcasting",
    element: <Broadcasting />,
  },
  {
    path: "schedule",
    element: <Schedule />,
  },
  {
    path: "streaming",
    element: <Streaming />,
  },
  {
    path: "twitch-callback",
    element: <TwitchCallback />,
  },
];
