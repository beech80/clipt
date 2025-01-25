import { ReactNode } from "react";
import { DocsNavigation } from "./DocsNavigation";

interface DocsLayoutProps {
  children: ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <DocsNavigation />
      <main className="flex-1 px-4 py-8 md:px-8">
        {children}
      </main>
    </div>
  );
}