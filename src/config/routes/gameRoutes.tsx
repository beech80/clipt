import { RouteObject } from "react-router-dom";
import Discover from "@/pages/Discover";
import GamePage from "@/pages/GamePage";
import Esports from "@/pages/Esports";

export const gameRoutes: RouteObject[] = [
  {
    path: "discover",
    element: <Discover />,
  },
  {
    path: "game/:id",
    element: <GamePage />,
  },
  {
    path: "esports",
    element: <Esports />,
  },
];