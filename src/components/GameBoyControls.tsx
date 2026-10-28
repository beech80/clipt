import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Trophy, UserPlus, Menu, Camera, DollarSign, SlidersHorizontal, X, Settings, MoreHorizontal, Clapperboard, UsersRound, Search, Gamepad2, Pencil, History, BarChart3, Coins, HelpCircle, Shield, Eye, Bell, Check, Radio } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ControllerSettings } from './ControllerSettings';
import { useControllerPreferences } from '@/hooks/useControllerPreferences';
import { useImmersiveController } from '@/hooks/useImmersiveController';
import './GameBoyControls.css';
import { useMobileControlsPreferences } from '@/hooks/useMobileControlsPreferences';
import { HandPreferenceSettings } from './accessibility/HandPreferenceSettings';
import { AdjustablePanel } from './AdjustablePanel';
import NavigationMenu from '@/pages/Menu';
import { pageControllerLayout, pageControllerContext, pageActionTarget, activatePageControl, type PageControllerAction, type PageControllerLayout } from '@/lib/page-controller';

const pageIcons = { search: Search, games: Gamepad2, clips: Clapperboard, users: UsersRound, edit: Pencil, settings: Settings, message: MessageSquare, history: History, chart: BarChart3, coins: Coins, help: HelpCircle, shield: Shield, eye: Eye, camera: Camera, bell: Bell, check: Check, radio: Radio };

type Action = 'like' | 'comment' | 'trophy' | 'follow';
const actions: Action[] = ['trophy', 'comment', 'like', 'follow'];
const selectors: Record<Action, string> = {
  like: 'button[data-action="like"],button.like-button',
  comment: 'button[data-action="comment"],button.comment-button',
  trophy: 'button[data-action="trophy"],button.trophy-button',
  follow: 'button[data-action="follow"],button.follow-button',
};

// Only real post containers are eligible. No IDs are inferred or fabricated.
function visiblePost(preferredId?: string | null): HTMLElement | null {
  const controller = document.querySelector<HTMLElement>('.clipt-controller');
  const bottom = controller?.dataset.layout === 'immersive' || controller?.dataset.mobileV2 === 'true' ? innerHeight : controller?.getBoundingClientRect().top ?? innerHeight;
  const candidates = Array.from(document.querySelectorAll<HTMLElement>('[data-post-id]'))
    .filter(element => {
      if (element.dataset.activeClip === 'false') return false;
      const rect = element.getBoundingClientRect();
      return Boolean(element.dataset.postId) && rect.width > 0 && rect.height > 0
        && rect.top < bottom && rect.bottom > 0 && rect.right > 0 && rect.left < innerWidth
        && getComputedStyle(element).visibility !== 'hidden';
    });
  const preferred = candidates.find(element => element.dataset.postId === preferredId);
  if (preferred) return preferred;
  const middle = bottom / 2;
  return candidates.sort((a, b) => {
    const distance = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return Math.abs((Math.max(0, rect.top) + Math.min(bottom, rect.bottom)) / 2 - middle);
    };
    return distance(a) - distance(b);
  })[0] ?? null;
}

function postButton(post: HTMLElement | null, action: Action) {
  return post?.querySelector<HTMLButtonElement>(selectors[action]) ?? null;
}

function liveButton(action: Action) {
  return document.querySelector<HTMLButtonElement>(`[data-active-stream="true"] button[data-live-action="${action}"]`) ?? null;
}

function scrollContent(amount: number) {
  // Prefer the focused page region (e.g. a conversation log), not a form or
  // an unrelated background feed. Joystick input never submits a form.
  const page = document.querySelector<HTMLElement>('.page-content');
  let target: HTMLElement | null = page?.contains(document.activeElement) ? document.activeElement as HTMLElement : visiblePost();
  if (!target) target = page?.querySelector<HTMLElement>('.clipt-dm-history, .clipt-inbox') ?? page;
  while (target && target !== document.body) {
    const style = getComputedStyle(target);
    if (/(auto|scroll)/.test(style.overflowY) && target.scrollHeight > target.clientHeight) {
      target.scrollBy({ top: amount, behavior: 'instant' });
      return;
    }
    target = target.parentElement;
  }
  window.scrollBy({ top: amount, behavior: 'instant' });
}

function FeedFlipButton({ feed, onToggle }: { feed: string; onToggle: () => void }) {
  const squad = feed === 'squad';
  return <button type="button" role="switch" aria-label="Squad feed" aria-checked={squad}
    title={`Showing ${squad ? 'Squad' : 'Clipts'}. Switch to ${squad ? 'Clipts' : 'Squad'}`}
    className="clipt-feed-flip" onClick={onToggle}>
    <span key={feed} className="clipt-feed-flip-face" aria-hidden="true">{squad ? <UsersRound size={22} /> : <Clapperboard size={22} />}</span>
    <span className="sr-only">{squad ? 'Squad' : 'Clipts'}</span>
    <span className="clipt-feed-flip-label" aria-hidden="true">{squad ? 'SQUAD' : 'FYP'}</span>
  </button>;
}

export function PortraitFeedToggle({ feed, onToggle }: { feed: string; onToggle: () => void }) {
  return <div className="clipt-portrait-feed-toggle" role="group" aria-label="Choose feed">
    {['clipts', 'squad'].map(value => <button key={value} type="button" aria-pressed={feed === value}
      onClick={() => { if (feed !== value) onToggle(); }}>{value === 'clipts' ? 'CLIPT' : 'SQUAD'}</button>)}
  </div>;
}

export default function GameBoyControls({ currentPostId }: { currentPostId?: string | null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activePathRef = useRef(location.pathname);
  activePathRef.current = location.pathname;
  const horizontal = location.pathname === '/' || location.pathname === '/clipts';
  const [controlsExpanded, setControlsExpanded] = useState(horizontal);
  const controlsToggleRef = useRef<HTMLButtonElement>(null);
  const liveContext = location.pathname.startsWith('/streaming/');
  const mediaContext = horizontal || liveContext || /^\/post\/[^/]+$/.test(location.pathname);
  const [pageState, setPageState] = useState<{path: string; layout: PageControllerLayout; enabled: string[]; pressed?: Record<string, boolean>}>({path: location.pathname, layout: pageControllerLayout(location.pathname), enabled: []});
  const { preferences } = useControllerPreferences();
  const { preferences: mobilePreferences } = useMobileControlsPreferences();
  // The floating/immersive presentation belongs only to the video feed.
  // Other routes retain the classic joystick + diamond + central CLIPT shell,
  // independently of whether their actions operate a post or a livestream.
  const immersive = useImmersiveController(horizontal, preferences, location.pathname, horizontal);
  const portraitZoom = horizontal && immersive.immersive && !immersive.viewport.landscape;
  const [menuOpen, setMenuOpen] = useState(false);
  const homeButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!horizontal) return;
    const open = () => setMenuOpen(true);
    window.addEventListener('clipt:open-navigation', open);
    return () => window.removeEventListener('clipt:open-navigation', open);
  }, [horizontal]);
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const handoffFocus = useRef(false);
  const navigationHandoffFocus = useRef(false);
  const compact = immersive.immersive && (immersive.viewport.height < (portraitZoom ? 420 : 320) || immersive.viewport.width < (portraitZoom ? 240 : 320) || (immersive.viewport.landscape && immersive.viewport.width < 420));
  const emergency = immersive.immersive && (immersive.viewport.width < (portraitZoom ? 220 : 320) || immersive.viewport.height < 180);
  const lastStep = useRef(0);
  const [enabled, setEnabled] = useState<Record<Action, boolean>>({ like: false, comment: false, trophy: false, follow: false });
  const [likeLabel, setLikeLabel] = useState('Like');
  const [selectedFeed, setSelectedFeed] = useState('clipts');
  const [counts, setCounts] = useState<Partial<Record<Action,string>>>({});
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const velocity = useRef(0);
  const frame = useRef<number>();
  const pointer = useRef<number | null>(null);
  const refreshFrame = useRef<number>();

  const refresh = useCallback(() => {
    if (!mediaContext) {
      const root = document.querySelector('.page-content');
      const layout = pageControllerLayout(location.pathname, root ? pageControllerContext(root) : {});
      const pressed: Record<string, boolean> = {};
      const enabled: string[] = [];
      const panelBackground = menuOpen && Boolean(document.querySelector('.clipt-navigation-panel[data-panel-size="full"]'));
      for (const action of layout.actions) {
        const target = root && pageActionTarget(root, action, panelBackground);
        if (action.kind === 'navigate' || target) enabled.push(action.id);
        const state = target?.getAttribute('aria-pressed') ?? target?.getAttribute('aria-selected');
        if (state === 'true' || state === 'false') pressed[action.id] = state === 'true';
        if (action.id === 'follow' && target?.textContent?.trim()) action.label = `${target.textContent.trim()} creator`;
      }
      const next = {path: location.pathname, layout, enabled, pressed};
      setPageState(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
      return;
    }
    const actualFeed = document.querySelector<HTMLElement>('.clipt-fyp')?.dataset.feed === 'squad' ? 'squad' : 'clipts';
    setSelectedFeed(previous => previous === actualFeed ? previous : actualFeed);
    const post = visiblePost(currentPostId);
    const state = Object.fromEntries(actions.map(action => {
      const button = liveContext ? liveButton(action) : postButton(post, action);
      return [action, Boolean(button && !button.disabled && button.getAttribute('aria-disabled') !== 'true')];
    })) as Record<Action, boolean>;
    setEnabled(previous => actions.every(action => previous[action] === state[action]) ? previous : state);
    const confirmedLikeLabel = (liveContext ? liveButton('like') : postButton(post, 'like'))?.getAttribute('aria-label') || 'Like';
    setLikeLabel(previous => previous === confirmedLikeLabel ? previous : confirmedLikeLabel);
    const nextCounts = Object.fromEntries(actions.map(action => {
      const text = (liveContext ? liveButton(action) : postButton(post,action))?.textContent?.trim() || '';
      return [action, /^\d[\d,.]*[kKmM]?$/.test(text) ? text : ''];
    }));
    setCounts(previous => actions.every(action => previous[action] === nextCounts[action]) ? previous : nextCounts);
  }, [currentPostId, liveContext, mediaContext, location.pathname, menuOpen]);

  const stop = useCallback(() => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    frame.current = undefined;
    pointer.current = null;
    velocity.current = 0;
    setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshFrame.current !== undefined) return;
      refreshFrame.current = requestAnimationFrame(() => {
        refreshFrame.current = undefined;
        refresh();
      });
    };
    const observer = new MutationObserver(scheduleRefresh);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['disabled', 'hidden', 'inert', 'class', 'data-state', 'aria-pressed', 'data-post-id', 'data-active-clip', 'data-feed', 'aria-disabled', 'aria-label'] });
    document.addEventListener('scroll', scheduleRefresh, true);
    window.addEventListener('resize', scheduleRefresh);
    window.addEventListener('blur', stop);
    scheduleRefresh();
    return () => {
      observer.disconnect();
      document.removeEventListener('scroll', scheduleRefresh, true);
      window.removeEventListener('resize', scheduleRefresh);
      window.removeEventListener('blur', stop);
      if (refreshFrame.current !== undefined) cancelAnimationFrame(refreshFrame.current);
      refreshFrame.current = undefined;
      stop();
    };
  }, [location.pathname, refresh, stop]);

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    const scale = Math.min(1, 22 / Math.max(1, Math.hypot(x, y)));
    const displacement = { x: x * scale, y: y * scale };
    const axis = horizontal ? displacement.x : displacement.y;
    velocity.current = Math.abs(axis) < 4 ? 0 : axis * 32;
    setPosition(displacement);
  };

  const start = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== null || event.button !== 0) return;
    event.preventDefault();
    pointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    move(event);
    let last = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(40, now - last) / 1000;
      last = now;
      if (velocity.current && horizontal && now - lastStep.current > 500) {
        window.dispatchEvent(new CustomEvent('clipt:navigate', { detail: { direction: Math.sign(velocity.current) } }));
        lastStep.current = now;
      } else if (velocity.current && !horizontal) scrollContent(velocity.current * delta);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  const act = (action: Action) => {
    if (typeof window !== 'undefined' && window.location && window.location.pathname !== location.pathname) return;
    // Re-resolve at the instant of activation to avoid acting on stale content.
    const button = liveContext ? liveButton(action) : postButton(visiblePost(currentPostId), action);
    if (button && !button.disabled && button.getAttribute('aria-disabled') !== 'true') button.click();
    refresh();
  };
  const actOnPage = (id: string, focusTarget = false) => {
    if (activePathRef.current !== location.pathname) return;
    if (typeof window !== 'undefined' && window.location && window.location.pathname !== location.pathname) return;
    const root = document.querySelector('.page-content');
    // Recompute route context and permission-controlled target at click time.
    const action = pageControllerLayout(location.pathname, root ? pageControllerContext(root) : {}).actions.find(item => item.id === id);
    if (!action) return;
    if (action.kind === 'navigate' && action.to) { navigate(action.to); return; }
    const target = root && pageActionTarget(root, action);
    if (!target) return;
    if (action.kind === 'click') {
      if (focusTarget) target.focus({preventScroll: true});
      activatePageControl(target);
    }
    else {
      target.scrollIntoView({block: 'center', behavior: 'instant'});
      if (!target.matches('button, input, textarea, select, a[href], [tabindex]')) target.tabIndex = -1;
      target.focus({preventScroll: true});
    }
    refresh();
  };
  const stepFromOverflow = (direction: number) => {
    setMoreOpen(false);
    requestAnimationFrame(() => horizontal ? window.dispatchEvent(new CustomEvent('clipt:navigate',{detail:{direction}})) : scrollContent(direction * 90));
  };
  const toggleFeed = () => {
    window.dispatchEvent(new Event('clipt:toggle-feed'));
  };

  const mediaDefinitions = [
    { action: 'trophy' as const, label: liveContext ? 'Donate — Live donation review' : 'Trophy — Rank this Clipt', Icon: liveContext ? DollarSign : Trophy },
    { action: 'comment' as const, label: liveContext ? 'Live Chat' : 'Comment — Open engagement', Icon: MessageSquare },
    { action: 'like' as const, label: likeLabel, Icon: Heart },
    { action: 'follow' as const, label: 'Follow creator', Icon: UserPlus },
  ];
  const currentPage = pageState.path === location.pathname ? pageState.layout : pageControllerLayout(location.pathname);
  const definitions = mediaContext ? mediaDefinitions : currentPage.actions.map(action => ({action: action.slot, label: action.label, Icon: pageIcons[action.icon]}));
  const pageAction = (slot: Action): PageControllerAction | undefined => currentPage.actions.find(action => action.slot === slot);
  const actionEnabled = (slot: Action) => mediaContext ? enabled[slot] : pageState.path === location.pathname && pageState.enabled.includes(pageAction(slot)?.id ?? '');
  const activate = (slot: Action) => mediaContext ? act(slot) : actOnPage(pageAction(slot)?.id ?? '');

  const landscapeFeed = horizontal && !portraitZoom;
  const postControl = <button type="button" className="clipt-controller-post" aria-label="POST" title="Create a post" onClick={() => navigate('/new-post')}><Camera size={16} aria-hidden="true" /><span className="clipt-post-label">POST</span></button>;
  const homeControl = <button ref={homeButtonRef} type="button" className="clipt-controller-home" aria-label="CLIPT — Open navigation" onClick={() => setMenuOpen(true)} aria-describedby={!horizontal ? 'clipt-page-controls-guide' : undefined} title="Navigation and page controls" onPointerDown={event => {
        // Keep the typing layout stable through pointer-up. Otherwise the
        // input blurs on pointer-down and the home button moves before click.
        if (!horizontal && immersive.viewport.height < 500 && document.activeElement?.matches('input, textarea, [contenteditable="true"]')) event.preventDefault();
      }}>CLIPT</button>;
  return <><nav ref={immersive.rootRef} aria-label="Clipt game controls" data-expanded={controlsExpanded}
    data-mobile-v2={horizontal} data-portrait-viewing={portraitZoom} data-hand={mobilePreferences.hand} data-page-controller={!horizontal ? (mediaContext ? liveContext ? 'live-viewer' : 'post-viewer' : currentPage.pageId) : undefined} data-page-media={mediaContext}
    data-layout={immersive.immersive ? 'immersive' : 'classic'} data-portrait-zoom={portraitZoom} data-hidden={immersive.hidden} data-compact={compact} data-emergency={emergency}
    style={immersive.immersive ? {left:immersive.viewport.left,top:immersive.viewport.top,width:immersive.viewport.width,height:immersive.viewport.height} : undefined}
    onKeyDown={event => { if (horizontal && event.key === 'Escape' && (immersive.immersive ? !immersive.hidden : controlsExpanded)) { event.preventDefault(); if (immersive.immersive) immersive.hide(); else setControlsExpanded(false); requestAnimationFrame(() => controlsToggleRef.current?.focus()); } }}
    className={'gameboy-controls clipt-controller' + (horizontal ? ' clipt-controller-feed' : '')}>
    {(horizontal || immersive.immersive) && <button ref={controlsToggleRef} type="button" className="clipt-controller-toggle" aria-expanded={immersive.immersive ? !immersive.hidden : controlsExpanded}
      aria-label={(immersive.immersive ? !immersive.hidden : controlsExpanded) ? 'Hide controls' : 'Show controls'} title={(immersive.immersive ? !immersive.hidden : controlsExpanded) ? 'Hide controls' : 'Show controls'}
      aria-controls="clipt-feed-extra-controls" onClick={() => { if (immersive.immersive) { if (immersive.hidden) immersive.wake(); else immersive.hide(); } else setControlsExpanded(value => !value); }}>
      {(immersive.immersive ? !immersive.hidden : controlsExpanded) ? <X size={22} aria-hidden="true" /> : <SlidersHorizontal size={22} aria-hidden="true" />}
    </button>}
    <div className="clipt-controller-body" id={horizontal || immersive.immersive ? 'clipt-feed-extra-controls' : undefined}>
    <button ref={settingsButtonRef} type="button" className="clipt-controller-settings" aria-label="Controller settings" onClick={() => setSettingsOpen(true)}><Settings size={20} aria-hidden="true" /></button>
    {compact && <button ref={moreButtonRef} type="button" className="clipt-controller-more" aria-haspopup="dialog" aria-label="All controller actions" onClick={() => setMoreOpen(true)}><MoreHorizontal size={22} aria-hidden="true" /></button>}
    <div className="clipt-controller-joystick" role="slider" tabIndex={0}
      aria-label={horizontal ? 'Scroll feed joystick' : 'Scroll page joystick'} aria-orientation={horizontal ? 'horizontal' : 'vertical'} aria-valuemin={-100} aria-valuemax={100}
      aria-valuenow={Math.round((horizontal ? position.x : position.y) / 22 * 100)}
      aria-valuetext={horizontal ? (position.x < -4 ? 'Previous Clipt' : position.x > 4 ? 'Next Clipt' : 'Stopped') : (position.y < -4 ? 'Scrolling up' : position.y > 4 ? 'Scrolling down' : 'Stopped')}
      onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}
      onKeyDown={event => {
        if (horizontal) {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            window.dispatchEvent(new CustomEvent('clipt:navigate', { detail: { direction: event.key === 'ArrowRight' ? 1 : -1 } }));
          }
          return;
        }
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
          const amount = event.key === 'Home' ? -document.body.scrollHeight : event.key === 'End' ? document.body.scrollHeight
            : (event.key.includes('Up') ? -1 : 1) * (event.key.startsWith('Page') ? innerHeight * 0.7 : 90);
          scrollContent(amount);
        }
      }}>
      <div className="clipt-controller-stick" style={{ transform: 'translate(' + position.x + 'px,' + position.y + 'px)' }} />
    </div>
    <div className="clipt-controller-center">
      {!horizontal && homeControl}
      {!horizontal && <span id="clipt-page-controls-guide" className="sr-only">Press CLIPT for guide. Navigation and this page’s four actions are available there.</span>}
      {horizontal && <div className="clipt-controller-secondary">
        <button type="button" aria-label="Open menu" onClick={() => navigate('/menu')}><Menu size={16} /> MENU</button>
        {!landscapeFeed && postControl}
      </div>}
    </div>
    <div className="clipt-controller-actions">
      {(immersive.immersive ? [...definitions].sort((a,b)=>(portraitZoom ? ['like','comment','follow','trophy'] : ['like','comment','trophy','follow']).indexOf(a.action)-(portraitZoom ? ['like','comment','follow','trophy'] : ['like','comment','trophy','follow']).indexOf(b.action)) : definitions).map(({ action, label, Icon }) => <button key={action} type="button"
        data-controller-action={mediaContext ? action : pageAction(action)?.id}
        className={'clipt-controller-action clipt-controller-' + action} aria-label={label}
        title={label} aria-pressed={mediaContext ? action === 'like' ? /^unlike\b/i.test(likeLabel) : undefined : pageState.path === location.pathname ? pageState.pressed?.[pageAction(action)?.id ?? ''] : undefined}
        aria-describedby={mediaContext && immersive.immersive && counts[action] ? `clipt-controller-count-${action}` : undefined}
        disabled={!actionEnabled(action)} onClick={() => activate(action)}><Icon key={mediaContext ? action : pageAction(action)?.id} size={18} aria-hidden="true" />{!mediaContext && <span className="clipt-controller-action-label">{label}</span>}{mediaContext && immersive.immersive && counts[action] && <span id={`clipt-controller-count-${action}`} className="clipt-controller-count">{counts[action]}</span>}</button>)}
      {horizontal && immersive.immersive && (portraitZoom ? <PortraitFeedToggle feed={selectedFeed} onToggle={toggleFeed} /> : <FeedFlipButton feed={selectedFeed} onToggle={toggleFeed} />)}
      {landscapeFeed && homeControl}
    </div>
    </div>
  </nav>
  <Dialog open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
    <AdjustablePanel id="clipt-navigation-panel" className="clipt-navigation-panel" constrained={!horizontal && immersive.viewport.height > 0 && immersive.viewport.height < 320} onInteractOutside={event => event.preventDefault()} onCloseAutoFocus={event => {
      if (navigationHandoffFocus.current) { event.preventDefault(); navigationHandoffFocus.current = false; return; }
      const trigger = homeButtonRef.current?.getClientRects().length ? homeButtonRef.current
        : document.querySelector<HTMLButtonElement>('[data-swipe-menu]');
      if (trigger?.isConnected && trigger.getClientRects().length) { event.preventDefault(); immersive.wake(); trigger.focus(); }
    }}>
      <DialogTitle>CLIPT navigation</DialogTitle>
      <DialogDescription>Navigation and viewing preferences. Video continues playing.</DialogDescription>
      {mediaContext && !liveContext && <p>Trophy rankings accept published public videos, not photos, drafts or Squad posts. Like remains available for photos. Disabled actions can also require sign-in.</p>}
      {!mediaContext && <section aria-label="Current page controller actions" className="clipt-overflow-actions">
        <h2>{currentPage.pageId.replace(/-/g, ' ')} controls</h2>
        <p>The colored buttons match the actions below. The joystick scrolls this page or its open conversation. Disabled actions are not available in the current context.</p>
        {currentPage.actions.map(action => <button key={action.id} type="button" aria-label={action.label} disabled={!actionEnabled(action.slot)} onClick={() => { navigationHandoffFocus.current = true; setMenuOpen(false); requestAnimationFrame(() => actOnPage(action.id, true)); }}><span aria-hidden="true">{{like:'Top · pink',comment:'Right · cyan',follow:'Bottom · teal',trophy:'Left · gold'}[action.slot]} — </span>{action.label}</button>)}
      </section>}
      {!horizontal && mediaContext && <section aria-label="Current video controller actions" className="clipt-overflow-actions">{definitions.map(({action,label}) => <button key={action} type="button" disabled={!actionEnabled(action)} onClick={() => { navigationHandoffFocus.current = action === 'comment' || action === 'trophy'; setMenuOpen(false); requestAnimationFrame(() => activate(action)); }}>{label}</button>)}</section>}
      <div onClick={event => { if (event.target instanceof Element && event.target.closest('a[href]')) setMenuOpen(false); }}><NavigationMenu embedded /></div>
      {horizontal && <div className="clipt-overflow-actions">
        <button type="button" onClick={() => { toggleFeed(); setMenuOpen(false); }}>Switch to {selectedFeed === 'squad' ? 'Clipts' : 'Squad'}</button>
        <button type="button" onClick={() => { setMenuOpen(false); stepFromOverflow(-1); }}>Previous Clipt</button><button type="button" onClick={() => { setMenuOpen(false); stepFromOverflow(1); }}>Next Clipt</button>
      </div>}
      <HandPreferenceSettings />
      <ControllerSettings />
    </AdjustablePanel>
  </Dialog>
  <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}><DialogContent className="clipt-controller-dialog" onCloseAutoFocus={event=>{
    const target=settingsButtonRef.current?.getClientRects().length ? settingsButtonRef.current : controlsToggleRef.current;
    if(target?.isConnected && getComputedStyle(target).visibility==='visible'){event.preventDefault();target.focus();}
  }}><DialogTitle>Controller settings</DialogTitle><DialogDescription>Layout and visibility preferences for this browser.</DialogDescription><ControllerSettings /><HandPreferenceSettings /></DialogContent></Dialog>
  <Dialog open={moreOpen} onOpenChange={setMoreOpen}><DialogContent className="clipt-controller-dialog" onCloseAutoFocus={event=>{
    if(handoffFocus.current){event.preventDefault();handoffFocus.current=false;return;}
    const target=moreButtonRef.current?.getClientRects().length ? moreButtonRef.current : controlsToggleRef.current;
    if(target?.isConnected && getComputedStyle(target).visibility==='visible'){event.preventDefault();target.focus();}
  }}><DialogTitle>Controller actions</DialogTitle><DialogDescription>All actions remain available when screen space is limited.</DialogDescription>
    <div className="clipt-overflow-actions">{definitions.map(({action,label,Icon})=><button type="button" key={action} disabled={!actionEnabled(action)} onClick={()=>{handoffFocus.current=action==='comment'||action==='trophy';setMoreOpen(false);activate(action);}}><Icon size={22} aria-hidden="true" />{label}{mediaContext && counts[action] && <span>{counts[action]}</span>}</button>)}
      {horizontal && (portraitZoom ? <PortraitFeedToggle feed={selectedFeed} onToggle={toggleFeed} /> : <FeedFlipButton feed={selectedFeed} onToggle={toggleFeed} />)}
    </div>
    {emergency && <div className="clipt-overflow-actions"><p>Compact navigation replaces the joystick when there is too little room for separate controls.</p>
      <button onClick={()=>stepFromOverflow(-1)}>Previous Clipt</button>
      <button onClick={()=>stepFromOverflow(1)}>Next Clipt</button>
      <button onClick={()=>navigate('/menu')}>Menu</button><button onClick={()=>navigate('/clipts')}>CLIPT home</button><button onClick={()=>navigate('/new-post')}>Post</button>
    </div>}
  </DialogContent></Dialog></>;
}
