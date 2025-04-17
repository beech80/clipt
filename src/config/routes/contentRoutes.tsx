import { RouteObject, Navigate } from "react-router-dom";
import Clipts from "@/pages/Clipts";
import Collections from "@/pages/Collections";
import Post from "@/pages/Post";
import Home from "@/pages/Home";
import TopClips from "@/pages/TopClips";
import TopClipts from "@/pages/TopClipts";
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
    path: "top-clipts",
    element: <TopClipts />,
  },
  {
    path: "/",
    element: <Navigate to="/clipts" replace />,
  }
];
