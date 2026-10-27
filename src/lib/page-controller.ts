/** Physical slots retain the original controller artwork; only their purpose changes. */
export type ControllerSlot = 'like' | 'comment' | 'follow' | 'trophy';
export type PageActionIcon = 'search' | 'games' | 'clips' | 'users' | 'edit' | 'settings' | 'message' | 'history' | 'chart' | 'coins' | 'help' | 'shield' | 'eye' | 'camera' | 'bell' | 'check' | 'radio';
export type PageControllerAction = {
  id: string;
  slot: ControllerSlot;
  label: string;
  icon: PageActionIcon;
  kind: 'navigate' | 'click' | 'focus' | 'reveal';
  to?: string;
  selector?: string;
  text?: string;
};
export type PageControllerContext = { ownProfile?: boolean; conversation?: boolean };
export type PageControllerLayout = { pageId: string; actions: PageControllerAction[] };
const slots: ControllerSlot[] = ['like', 'comment', 'follow', 'trophy'];
type DraftAction = Omit<PageControllerAction, 'slot'>;
const route = (id: string, label: string, icon: PageActionIcon, to: string): DraftAction => ({ id, label, icon, kind: 'navigate', to });
const target = (id: string, label: string, icon: PageActionIcon, selector: string, kind: 'click' | 'focus' | 'reveal' = 'reveal', text?: string): DraftAction => ({ id, label, icon, kind, selector, text });
const button = (id: string, label: string, icon: PageActionIcon, text: string, selector = 'button'): DraftAction => target(id, label, icon, selector, 'click', text);
const layout = (pageId: string, actions: DraftAction[]): PageControllerLayout => ({ pageId, actions: actions.map((action, index) => ({ ...action, slot: slots[index] })) });

/** No speculative features: every target below belongs to an existing page. */
export function pageControllerLayout(pathname: string, context: PageControllerContext = {}): PageControllerLayout {
  if (pathname === '/discovery') return layout('discovery', [
    route('search', 'Search games, creators and Clipts', 'search', '/retro-search'),
    route('games', 'Browse game catalog', 'games', '/top-games'),
    route('rankings', 'Top Clipts', 'chart', '/top-clipts'),
    target('recent', 'Explore recent Clipts', 'clips', '[aria-label="Organic discovery"]'),
  ]);
  if (pathname === '/retro-search') return layout('search', [
    target('search', 'Search Clipt', 'search', 'input[aria-label="Search Clipt"]', 'focus'),
    button('games', 'Game results', 'games', 'Games', '[role="tab"]'),
    button('creators', 'Creator results', 'users', 'Creators', '[role="tab"]'),
    button('clips', 'Clipt results', 'clips', 'Clipts', '[role="tab"]'),
  ]);
  if (pathname === '/profile' || /^\/user\/[^/]+$/.test(pathname)) return layout(context.ownProfile ? 'own-profile' : 'creator-profile', context.ownProfile ? [
    button('edit', 'Edit my profile', 'edit', 'Edit Profile'),
    route('drafts', 'My private drafts', 'clips', '/drafts'),
    button('clips', 'My Clipts', 'clips', 'Clipts', '.clipt-profile-tabs button'),
    route('settings', 'Account settings', 'settings', '/settings'),
  ] : [
    target('follow', 'Follow / Following', 'users', '[data-page-controller="profile-follow"]', 'click'),
    button('message', 'Message creator', 'message', 'Message', '.clipt-profile button'),
    button('clips', 'Creator Clipts', 'clips', 'Clipts', '.clipt-profile-tabs button'),
    button('posts', 'Creator posts', 'eye', 'Posts', '.clipt-profile-tabs button'),
  ]);
  if (/^\/messages(?:\/[^/]+)?$/.test(pathname)) return layout(context.conversation ? 'conversation' : 'inbox', context.conversation ? [
    target('inbox', 'Back to conversations', 'message', 'button[aria-label="Back to conversations"]', 'click'),
    target('compose', 'Write a message', 'edit', 'input[aria-label="Message"]', 'focus'),
    target('history', 'Conversation history', 'history', '[aria-label="Conversation messages"]'),
    target('creator', 'View conversation creator', 'users', '.clipt-dm-heading a[href]', 'click'),
  ] : [
    target('new', 'New conversation', 'message', 'button[aria-label="Start new conversation"]', 'click'),
    target('search', 'Search conversations', 'search', 'input[aria-label="Search conversations"]', 'focus'),
    target('conversations', 'Browse conversations', 'users', '[aria-label="Conversations"]'),
  ]);
  if (pathname === '/live') return layout('live-discovery', [
    button('live', 'Browse live now', 'radio', 'Live Now'),
    button('following', 'Live creators I follow', 'users', 'Following'),
    button('refresh', 'Refresh live streams', 'history', 'Refresh'),
    route('setup', 'Go Live setup', 'camera', '/stream-setup'),
  ]);
  if (pathname === '/creator-dashboard') return layout('creator-dashboard', [
    target('trend', 'Recorded activity trend', 'chart', '#creator-chart-title'),
    target('clips', 'My top Clipts', 'clips', '#creator-top-clips'),
    target('daily', 'Daily activity table', 'history', '#creator-daily'),
    route('tools', 'Stream setup tools', 'settings', '/stream-setup'),
  ]);
  if (pathname === '/notifications') return layout('notifications', [
    button('all', 'All notifications', 'bell', 'All', '[aria-label="Notification filters"] button'),
    button('mentions', 'Mentions', 'message', 'Mentions', '[aria-label="Notification filters"] button'),
    button('comments', 'Comments and replies', 'users', 'Comments', '[aria-label="Notification filters"] button'),
    button('read', 'Mark next unread notification as read', 'check', 'Mark as read', '.clipt-notification-item button'),
  ]);
  if (pathname === '/achievements') return layout('achievements', ['All', 'Streaming', 'Social', 'Gaming'].map((name, index) => button(name.toLowerCase(), `${name} achievements`, (['chart', 'radio', 'users', 'games'] as const)[index], name, '[role="tab"]')));
  if (pathname === '/tokens') return layout('tokens', [
    target('balance', 'Token balance', 'coins', '[aria-label="Token balance"]'),
    target('info', 'Token store information', 'help', '#token-buy'),
    target('earn', 'Publication rewards', 'clips', '#token-earn'),
    target('history', 'Transaction history', 'history', '#token-history'),
  ]);
  if (pathname === '/boosts') return layout('boosts', [
    target('choose', 'Choose eligible Clipt', 'clips', '#boost-target-label'),
    target('packages', 'Review Boost options', 'eye', '[data-page-controller="boost-options"]'),
    target('history', 'My Boosts and status', 'chart', '[data-page-controller="boost-history"]'),
    route('ledger', 'Token wallet and history', 'history', '/tokens'),
  ]);
  if (pathname === '/settings') return layout('settings', [
    target('account', 'Account settings', 'users', '#settings-account'),
    target('accessibility', 'Accessibility settings', 'settings', '#settings-accessibility'),
    target('privacy', 'Privacy and account data', 'shield', '#settings-privacy'),
    target('help', 'Help and documentation', 'help', '#settings-help'),
  ]);
  if (pathname === '/new-post') return layout('create', [
    target('media', 'Add media', 'camera', 'input[type="file"][aria-label^="Clipt "]', 'click'),
    target('caption', 'Edit caption', 'edit', '#clip-caption', 'focus'),
    target('preview', 'Media preview', 'eye', '[aria-label="Media preview and upload"]'),
    // Deliberately focus review, never submit or publish on a controller tap.
    target('review', 'Review before publishing — use the form to confirm', 'check', '.clipt-create-details button[type="submit"]', 'reveal'),
  ]);
  if (pathname === '/edit-profile' || pathname === '/profile/edit') return layout('edit-profile', [
    button('account', 'Account tab', 'users', 'Account', '[role="tab"]'),
    button('preferences', 'Preferences tab', 'settings', 'Preferences', '[role="tab"]'),
    button('notifications', 'Notifications tab', 'bell', 'Notifications', '[role="tab"]'),
    route('profile', 'Return to my profile', 'eye', '/profile'),
  ]);
  if (pathname === '/top-games') return layout('games', [target('search', 'Search games', 'search', 'input[aria-label="Search games"]', 'focus'), route('discovery', 'Discovery', 'eye', '/discovery'), button('more', 'Load more games', 'games', 'Load more games')]);
  if (pathname === '/top-clipts') return layout('rankings', [target('period', 'Choose ranking period', 'history', '[aria-label="Ranking period"]'), target('rankings', 'Browse Clipt rankings', 'chart', '[aria-label="Clipt rankings"]'), route('feed', 'Watch Clipts', 'clips', '/clipts')]);
  if (/^\/game\/[^/]+$/.test(pathname)) return layout('game', [target('creators', 'Find game creators', 'users', 'a[href^="/game-streamers/"]', 'click'), target('clips', 'Recent game Clipts', 'clips', 'h2', 'reveal', 'Recent organic Clipts'), route('catalog', 'Game catalog', 'games', '/top-games')]);
  if (/^\/game-streamers\//.test(pathname)) return layout('game-creators', [target('clips', 'Browse game Clipts', 'clips', 'a[href^="/game/"]', 'click'), route('catalog', 'Game catalog', 'games', '/top-games'), route('search', 'Search creators', 'search', '/retro-search')]);
  if (pathname === '/drafts') return layout('drafts', [route('create', 'Create a Clipt', 'camera', '/new-post'), target('draft', 'Open first saved draft', 'edit', 'a[href^="/new-post?draft="]', 'click'), button('more', 'Load more drafts', 'history', 'Load more drafts')]);
  if (pathname === '/subscription') return layout('membership', [target('status', 'Server-confirmed membership status', 'shield', '[aria-label="Server membership status"]'), button('refresh', 'Refresh membership status', 'history', 'Refresh membership status'), route('store', 'Token store', 'coins', '/tokens'), route('terms', 'Membership terms', 'help', '/terms')]);
  if (/^\/(?:post\/[^/]+\/comments|comments\/[^/]+)$/.test(pathname)) return layout('comments', [target('write', 'Write a comment', 'edit', 'textarea, input[placeholder*="comment"]', 'focus'), target('clip', 'View this Clipt', 'clips', 'a[href^="/post/"]', 'click'), target('creator', 'View creator', 'users', 'a[href^="/user/"]', 'click')]);
  if (pathname === '/stream-setup') return layout('stream-setup', [target('instructions', 'Broadcast instructions', 'help', '[aria-label="Broadcast instructions"]'), route('live', 'Browse live streams', 'radio', '/live'), route('dashboard', 'Creator analytics', 'chart', '/creator-dashboard')]);
  if (pathname === '/admin' || pathname === '/moderation') return layout('moderation', [target('reports', 'Content reports — authorized staff only', 'shield', '#moderation-reports'), route('guidance', 'Moderation guidance and limitations', 'help', '/docs/user-guide')]);
  if (pathname === '/menu') return layout('navigation', [route('feed', 'Main feed', 'clips', '/clipts'), route('discovery', 'Discovery', 'search', '/discovery'), route('profile', 'My profile', 'users', '/profile'), route('settings', 'Settings', 'settings', '/settings')]);
  // Utility/auth/moderation pages keep their existing permission-gated UI.
  // Do not synthesize privileged, destructive or financial actions.
  return layout('utility', [route('guide', 'User guide', 'help', '/docs/user-guide'), route('privacy', 'Privacy policy', 'shield', '/privacy'), route('terms', 'Terms of service', 'help', '/terms')]);
}

export function pageControllerContext(root: ParentNode): PageControllerContext {
  return {
    ownProfile: Boolean(Array.from(root.querySelectorAll('.clipt-profile button')).find(element => element.textContent?.trim() === 'Edit Profile')),
    conversation: Boolean(root.querySelector('input[aria-label="Message"]')),
  };
}

/** Resolve inside the current routed page, never another dialog/controller. */
export function pageActionTarget(root: ParentNode, action: PageControllerAction, allowPanelBackground = false): HTMLElement | null {
  if (!action.selector) return null;
  return Array.from(root.querySelectorAll<HTMLElement>(action.selector)).find(element => {
    if (action.text && element.textContent?.replace(/\s+/g, ' ').trim() !== action.text) return false;
    // A full CLIPT panel temporarily inerts its own background. Its action list
    // may describe those controls, but activation still uses the strict default
    // after closing the panel. Pre-existing/nested inert regions remain blocked.
    const blocked = allowPanelBackground ? '[inert]:not([data-clipt-panel-inert="true"]), [hidden], [aria-hidden="true"]' : '[inert], [hidden], [aria-hidden="true"]';
    if (element.closest(blocked) || element.matches(':disabled, [aria-disabled="true"]')) return false;
    // File inputs intentionally use sr-only; their native file picker remains accessible.
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && Boolean(element.getClientRects().length);
  }) ?? null;
}

/** Radix Tabs select on pointer-down or Enter, not on a synthetic click.
 * Use their existing keyboard handler rather than duplicating tab state. */
export function activatePageControl(target: HTMLElement) {
  if (target.getAttribute('role') === 'tab') target.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true}));
  else target.click();
}
