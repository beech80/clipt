
import { RouteObject } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import GettingStarted from "@/pages/docs/GettingStarted";
import StreamingGuide from "@/pages/docs/StreamingGuide";
import TermsOfService from "@/pages/docs/TermsOfService";
import PrivacyPolicy from "@/pages/docs/PrivacyPolicy";
import CommunityGuidelines from "@/pages/docs/CommunityGuidelines";
import CopyrightPolicy from "@/pages/docs/CopyrightPolicy";
import ReportProcess from "@/pages/docs/ReportProcess";
import MonetizationPolicy from "@/pages/docs/MonetizationPolicy";
import UserGuide from "@/pages/docs/UserGuide";
import FAQs from "@/pages/docs/FAQs";
import ApiDocumentation from "@/pages/docs/ApiDocumentation";

export const docsRoutes: RouteObject = {
  path: "docs",
  element: <DocsLayout />,
  children: [
    {
      path: "getting-started",
      element: <GettingStarted />,
    },
    {
      path: "streaming-guide",
      element: <StreamingGuide />,
    },
    {
      path: "terms-of-service",
      element: <TermsOfService />,
    },
    {
      path: "privacy-policy",
      element: <PrivacyPolicy />,
    },
    {
      path: "community-guidelines",
      element: <CommunityGuidelines />,
    },
    {
      path: "copyright-policy",
      element: <CopyrightPolicy />,
    },
    {
      path: "report-process",
      element: <ReportProcess />,
    },
    {
      path: "monetization-policy",
      element: <MonetizationPolicy />,
    },
    {
      path: "faqs",
      element: <FAQs />,
    },
    {
      path: "user-guide",
      element: <UserGuide />,
    },
    {
      path: "api-documentation",
      element: <ApiDocumentation />,
    },
  ],
};
