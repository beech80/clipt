import { RouteObject } from "react-router-dom";
import Notifications from "@/pages/Notifications";

export const notificationRoutes: RouteObject[] = [
  {
    path: "/notifications",
    element: <Notifications />,
  },
];
