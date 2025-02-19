
import { RouteObject } from "react-router-dom";
import EditProfile from "@/pages/EditProfile";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Onboarding from "@/pages/Onboarding";
import Progress from "@/pages/Progress";
import AiAssistant from "@/pages/AiAssistant";

export const userRoutes: RouteObject[] = [
  {
    path: "profile",
    element: <Profile />,
  },
  {
    path: "profile/:id",
    element: <Profile />,
  },
  {
    path: "profile/edit",
    element: <EditProfile />,
  },
  {
    path: "settings",
    element: <Settings />,
  },
  {
    path: "onboarding",
    element: <Onboarding />,
  },
  {
    path: "progress",
    element: <Progress />,
  },
  {
    path: "ai-assistant",
    element: <AiAssistant />,
  },
];
