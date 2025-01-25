import { Outlet } from "react-router-dom";
import { DocsNavigation } from "./DocsNavigation";

export function DocsLayout() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <DocsNavigation />
        </aside>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}