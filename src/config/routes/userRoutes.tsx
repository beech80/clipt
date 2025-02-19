
import { RouteObject } from "react-router-dom";
import EditProfile from "@/pages/EditProfile";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Onboarding from "@/pages/Onboarding";
import Progress from "@/pages/Progress";
import AiAssistant from "@/pages/AiAssistant";
import { AuthGuard } from "@/components/AuthGuard";

export const userRoutes: RouteObject[] = [
  {
    path: "profile",
    element: <AuthGuard><Profile /></AuthGuard>,
  },
  {
    path: "profile/:id",
    element: <AuthGuard><Profile /></AuthGuard>,
  },
  {
    path: "profile/edit",
    element: <AuthGuard><EditProfile /></AuthGuard>,
  },
  {
    path: "settings",
    element: <AuthGuard><Settings /></AuthGuard>,
  },
  {
    path: "onboarding",
    element: <AuthGuard><Onboarding /></AuthGuard>,
  },
  {
    path: "progress",
    element: <AuthGuard><Progress /></AuthGuard>,
  },
  {
    path: "ai-assistant",
    element: <AuthGuard><AiAssistant /></AuthGuard>,
  },
];
