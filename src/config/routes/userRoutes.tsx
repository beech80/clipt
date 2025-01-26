import { RouteObject } from "react-router-dom";
import EditProfile from "@/pages/EditProfile";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Onboarding from "@/pages/Onboarding";

export const userRoutes: RouteObject[] = [
  {
    path: "profile",
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
];