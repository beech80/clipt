import { RouteObject } from "react-router-dom";
import Home from "@/pages/Home";
import Progress from "@/pages/Progress";
import Messages from "@/pages/Messages";
import { authRoutes } from "./routes/authRoutes";
import { docsRoutes } from "./routes/docsRoutes";
import { contentRoutes } from "./routes/contentRoutes";
import { streamingRoutes } from "./routes/streamingRoutes";
import { userRoutes } from "./routes/userRoutes";
import { gameRoutes } from "./routes/gameRoutes";
import { paymentRoutes } from "./routes/paymentRoutes";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/progress",
    element: <Progress />,
  },
  {
    path: "/messages",
    element: <Messages />,
  },
  ...authRoutes,
  docsRoutes,
  ...contentRoutes,
  ...streamingRoutes,
  ...userRoutes,
  ...gameRoutes,
  ...paymentRoutes,
];