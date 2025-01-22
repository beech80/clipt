import { MainContent } from "@/components/home/MainContent";
import { SidebarContent } from "@/components/home/SidebarContent";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <MainContent />
        <SidebarContent />
      </div>
    </div>
  );
}