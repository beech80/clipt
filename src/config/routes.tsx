import { RouteObject } from "react-router-dom";
import Home from "@/pages/Home";
import Index from "@/pages/Index";
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
    path: "/index",
    element: <Index />,
  },
  ...authRoutes,
  docsRoutes,
  ...contentRoutes,
  ...streamingRoutes,
  ...userRoutes,
  ...gameRoutes,
  ...paymentRoutes,
];