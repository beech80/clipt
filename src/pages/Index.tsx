import React from "react";
import { MainContent } from "@/components/home/MainContent";
import { SidebarContent } from "@/components/home/SidebarContent";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function Index() {
  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4 md:p-6 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MainContent />
          <SidebarContent />
        </div>
      </div>
    </ErrorBoundary>
  );
}