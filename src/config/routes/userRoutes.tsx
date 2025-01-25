import { RouteObject } from "react-router-dom";
import EditProfile from "@/pages/EditProfile";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import GroupChat from "@/pages/GroupChat";

export const userRoutes: RouteObject[] = [
  {
    path: "edit-profile",
    element: <EditProfile />,
  },
  {
    path: "messages",
    element: <Messages />,
  },
  {
    path: "profile/:id",
    element: <Profile />,
  },
  {
    path: "settings",
    element: <Settings />,
  },
  {
    path: "group-chat/:id",
    element: <GroupChat />,
  },
];