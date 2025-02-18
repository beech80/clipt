
import { RouteObject } from "react-router-dom";
import Clipts from "@/pages/Clipts";
import ClipEditor from "@/pages/ClipEditor";
import Collections from "@/pages/Collections";
import Post from "@/pages/Post";
import PostList from "@/pages/PostList";
import TopClips from "@/pages/TopClips";
import { AuthGuard } from "@/components/AuthGuard";
import { PostForm } from "@/components/post/PostForm";

export const contentRoutes: RouteObject[] = [
  {
    path: "index",
    element: <Clipts />,
  },
  {
    path: "clipts",
    element: <Clipts />,
  },
  {
    path: "clip-editor",
    element: <AuthGuard><ClipEditor /></AuthGuard>,
  },
  {
    path: "collections",
    element: <AuthGuard><Collections /></AuthGuard>,
  },
  {
    path: "post/:id",
    element: <Post />,
  },
  {
    path: "posts",
    element: <PostList />,
  },
  {
    path: "posts/new",
    element: <AuthGuard><PostForm /></AuthGuard>,
  },
  {
    path: "top-clips",
    element: <TopClips />,
  },
  {
    path: "/",
    element: <Clipts />,
  }
];
