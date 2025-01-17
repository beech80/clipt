import { Link } from "react-router-dom";
import { UserMenu } from "./UserMenu";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsPopover } from "./NotificationsPopover";

export function MainNav() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <nav className="flex items-center space-x-6">
          <Link to="/" className="text-xl font-bold">
            Clipt
          </Link>
          <Link to="/explore" className="text-sm">
            Explore
          </Link>
          <Link to="/following" className="text-sm">
            Following
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <NotificationsPopover />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}