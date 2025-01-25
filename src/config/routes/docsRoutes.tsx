import { RouteObject } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import GettingStarted from "@/pages/docs/GettingStarted";
import StreamingGuide from "@/pages/docs/StreamingGuide";

export const docsRoutes: RouteObject = {
  path: "docs",
  element: <DocsLayout><Outlet /></DocsLayout>,
  children: [
    {
      path: "getting-started",
      element: <GettingStarted />,
    },
    {
      path: "streaming-guide",
      element: <StreamingGuide />,
    },
  ],
};