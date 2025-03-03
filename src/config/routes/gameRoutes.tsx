import { RouteObject } from "react-router-dom";
import Discover from "@/pages/Discover";
import GameClips from "@/pages/GameClips";
import Esports from "@/pages/Esports";
import GameDetails from "@/pages/GameDetails";

export const gameRoutes: RouteObject[] = [
  {
    path: "/discover",
    element: <Discover />,
  },
  {
    path: "/game/:id",
    element: <GameDetails />,
  },
  {
    path: "/game/:id/clips",
    element: <GameClips />,
  },
  {
    path: "/esports",
    element: <Esports />,
  },
];