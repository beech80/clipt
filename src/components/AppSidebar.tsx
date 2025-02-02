import { Menu } from "lucide-react";
import { MainNav } from "./MainNav";
import {
  Sidebar,
  SidebarContent,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarTrigger>
        <button className="p-2 hover:bg-accent rounded-md">
          <Menu className="h-6 w-6" />
        </button>
      </SidebarTrigger>
      <SidebarContent>
        <div className="p-4">
          <MainNav className="flex-col space-y-4 items-start" />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}