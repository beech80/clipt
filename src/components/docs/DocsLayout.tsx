
import { Outlet } from "react-router-dom";
import { DocsNavigation } from "./DocsNavigation";

export const DocsLayout = () => {
  return (
    <div className="container mx-auto px-4 py-8 bg-[#1e1a2e]/50 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <DocsNavigation />
        </aside>
        <main className="md:col-span-3 bg-[#1e1a2e] p-6 rounded-lg border border-gray-700">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
