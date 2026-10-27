import { Link, useLocation } from 'react-router-dom';

const screens: Record<string, string> = {
  '/menu': 'Menu', '/edit-profile': 'Edit Profile',
  '/discovery': 'Discovery', '/retro-search': 'Discovery / Search', '/live': 'Live Discovery',
  '/new-post': 'Create / Post', '/profile': 'My Profile', '/messages': 'Messages / Inbox',
  '/notifications': 'Notifications', '/tokens': 'Token Store', '/boosts': 'Boosts',
  '/top-clipts': 'Top Clipts', '/stream-setup': 'Go Live / Stream Setup',
  '/settings': 'Settings / Security', '/admin': 'Admin / Moderation', '/moderation': 'Moderation',
  '/creator-dashboard': 'Creator Dashboard', '/achievements': 'Achievements',
  '/docs/user-guide': 'Help / User Guide',
  '/drafts': 'Private Drafts', '/top-games': 'Game Catalog',
};

export default function ConsoleMasthead() {
  const { pathname } = useLocation();
  const label = screens[pathname] || (pathname.startsWith('/user/') ? 'Creator Profile' : pathname.startsWith('/messages/') ? 'Individual DM' : pathname.startsWith('/streaming/') ? 'Live Stream Viewer' : null);
  if (!label) return null;
  return <header className="clipt-masthead">
    <span className="sr-only">{label}</span>
    <Link to="/clipts" className="clipt-masthead-brand" aria-label="Clipt — For You home"><span>CLIPT</span><small>PEOPLE. CLIPS. COMMUNITY.</small></Link>
  </header>;
}
