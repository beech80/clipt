
import { RouteObject } from "react-router-dom";
import ClipEditor from "@/pages/ClipEditor";
import Collections from "@/pages/Collections";
import Post from "@/pages/Post";
import PostList from "@/pages/PostList";
import TopClips from "@/pages/TopClips";

export const contentRoutes: RouteObject[] = [
  {
    path: "clip-editor",
    element: <ClipEditor />,
  },
  {
    path: "collections",
    element: <Collections />,
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
    path: "top-clips",
    element: <TopClips />,
  },
];
