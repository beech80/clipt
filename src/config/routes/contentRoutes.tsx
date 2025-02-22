
import { RouteObject } from "react-router-dom";
import Clipts from "@/pages/Clipts";
import Collections from "@/pages/Collections";
import Post from "@/pages/Post";
import Home from "@/pages/Home";
import TopClips from "@/pages/TopClips";
import { AuthGuard } from "@/components/AuthGuard";
import { PostForm } from "@/components/post/PostForm";

export const contentRoutes: RouteObject[] = [
  {
    path: "clipts",
    element: <Clipts />,
  },
  {
    path: "collections",
    element: <AuthGuard><Collections /></AuthGuard>,
  },
  {
    path: "post/new",
    element: <AuthGuard><PostForm /></AuthGuard>,
  },
  {
    path: "post/:id",
    element: <Post />,
  },
  {
    path: "top-clips",
    element: <TopClips />,
  },
  {
    path: "/",
    element: <Home />,
  }
];
