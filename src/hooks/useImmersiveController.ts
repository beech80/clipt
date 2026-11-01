import { useEffect, useRef, useState } from 'react';
import { CONTROLLER_IDLE_MS, controllerLayout, controllerMustStayVisible, portraitZoomConstrained, type ControllerPreferences } from '@/lib/controller-layout';

export function useImmersiveController(eligible: boolean, preferences: ControllerPreferences, route: string, portraitViewing = false) {
  const rootRef = useRef<HTMLElement>(null);
  const [viewport, setViewport] = useState({width: 0, height: 0, left: 0, top: 0, landscape: false, portraitConstrained: false, normalWidth: 0});
  const [hidden, setHidden] = useState<'visible' | 'auto' | 'manual'>('visible');
  const [activity, setActivity] = useState(0);
  const interacting = useRef(false);
  const revealOnly = useRef(false);
  const layout = eligible && portraitViewing && viewport.width > 0 && !viewport.landscape ? 'immersive'
    : eligible ? controllerLayout(viewport.width, viewport.height, viewport.landscape, preferences.layout, preferences.portraitZoom, viewport.portraitConstrained, viewport.normalWidth) : 'classic';
  const immersive = layout === 'immersive';
  const wake = () => { setHidden('visible'); setActivity(value => value + 1); };

  useEffect(() => {
    const measure = () => {
      const visual = window.visualViewport;
      const next = {width: visual?.width || window.innerWidth || document.documentElement.clientWidth,
        height: visual?.height || window.innerHeight || document.documentElement.clientHeight,
        left: visual?.offsetLeft ?? 0, top: visual?.offsetTop ?? 0,
        landscape: matchMedia('(orientation: landscape)').matches, normalWidth: window.screen?.width ?? 0};
      setViewport(old => {
        // Opening the portrait keyboard can make the CSS viewport look wider
        // than tall. Preserve the current orientation during text entry.
        const editing = document.activeElement?.matches('input, textarea, [contenteditable="true"]');
        const landscape = editing ? old.landscape : next.landscape;
        const measured = {...next, landscape, portraitConstrained: !landscape && portraitZoomConstrained(next.width, next.height, old.portraitConstrained, next.normalWidth)};
        return Object.keys(measured).every(key => old[key as keyof typeof old] === measured[key as keyof typeof measured]) ? old : measured;
      });
    };
    const observer = new ResizeObserver(measure); observer.observe(document.documentElement);
    window.addEventListener('resize', measure); window.visualViewport?.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure); window.addEventListener('pageshow', measure);
    window.visualViewport?.addEventListener('scroll', measure); measure();
    return () => { observer.disconnect(); window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure); window.removeEventListener('pageshow', measure);
      window.visualViewport?.removeEventListener('resize', measure); window.visualViewport?.removeEventListener('scroll', measure); };
  }, []);
  useEffect(() => { setHidden('visible'); setActivity(value => value + 1); interacting.current = false; }, [immersive, route, preferences.autoHide]);
  useEffect(() => {
    if (!eligible || viewport.landscape || !immersive) return;
    const root = document.documentElement;
    root.style.setProperty('--clipt-portrait-visible-height', `${viewport.height}px`);
    root.style.setProperty('--clipt-portrait-visible-top', `${viewport.top}px`);
    root.style.setProperty('--clipt-portrait-visible-width', `${viewport.width}px`);
    root.style.setProperty('--clipt-portrait-visible-left', `${viewport.left}px`);
    // The keyboard may resize the sheet after focus has already been assigned.
    // Reveal that existing composer within its own scroll container, not body.
    let frame = 0;
    const size = new ResizeObserver(() => scheduleReveal());
    const revealComposer = () => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || !active.matches('input, textarea, [contenteditable="true"]')) return;
      const sheet = active.closest<HTMLElement>('.clipt-engagement-hud');
      if (!sheet) return;
      size.observe(sheet);
      if (sheet.firstElementChild) size.observe(sheet.firstElementChild);
      const field = active.getBoundingClientRect(), bounds = sheet.getBoundingClientRect();
      if (field.bottom > bounds.bottom - 12) sheet.scrollTop += field.bottom - bounds.bottom + 12;
      else if (field.top < bounds.top + 60) sheet.scrollTop -= bounds.top + 60 - field.top;
    };
    const scheduleReveal = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(revealComposer); };
    // Query/loading transitions can move an already-focused form without a new
    // focus event. Coalesce those changes; never scroll the outer page.
    const content = new MutationObserver(scheduleReveal);
    content.observe(document.body, {subtree: true, childList: true, characterData: true});
    size.observe(document.documentElement);
    document.addEventListener('focusin', scheduleReveal);
    scheduleReveal();
    return () => {
      cancelAnimationFrame(frame);
      content.disconnect(); size.disconnect();
      document.removeEventListener('focusin', scheduleReveal);
      root.style.removeProperty('--clipt-portrait-visible-height');
      root.style.removeProperty('--clipt-portrait-visible-top');
      root.style.removeProperty('--clipt-portrait-visible-width');
      root.style.removeProperty('--clipt-portrait-visible-left');
    };
  }, [eligible, immersive, viewport.landscape, viewport.height, viewport.top, viewport.width, viewport.left]);
  useEffect(() => {
    if (!immersive) return;
    let origin: {x: number; y: number} | null = null;
    const down = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (rootRef.current?.contains(target)) { interacting.current = true; setActivity(value => value + 1); }
      if (target.closest('.clipt-cinematic-media, [data-active-stream="true"] video')) {
        origin = {x: event.clientX, y: event.clientY};
        revealOnly.current = !viewport.landscape && hidden !== 'visible';
      }
    };
    const up = (event: PointerEvent) => {
      interacting.current = false;
      if (origin && Math.hypot(event.clientX-origin.x,event.clientY-origin.y) < 12) setHidden('visible');
      origin = null; setActivity(value => value + 1);
    };
    const cancel = () => { interacting.current = false; revealOnly.current = false; origin = null; setActivity(value => value + 1); };
    const activateMedia = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('.clipt-cinematic-media, [data-active-stream="true"] video')) {
        if (!viewport.landscape && (revealOnly.current || hidden !== 'visible')) {
          event.preventDefault(); event.stopPropagation();
        }
        revealOnly.current = false;
        setHidden('visible'); setActivity(value => value + 1);
      }
    };
    const focus = () => { if (rootRef.current?.contains(document.activeElement)) { setHidden('visible'); setActivity(value => value + 1); } };
    let post = document.querySelector('[data-active-clip="true"]')?.getAttribute('data-post-id');
    const observer = new MutationObserver(() => {
      const next = document.querySelector('[data-active-clip="true"]')?.getAttribute('data-post-id');
      if (next !== post) { post = next; setHidden('visible'); setActivity(value => value + 1); }
    });
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-active-clip']});
    document.addEventListener('pointerdown',down,true); document.addEventListener('pointerup',up,true);
    document.addEventListener('pointercancel',cancel,true); document.addEventListener('focusin',focus);
    document.addEventListener('click',activateMedia,true);
    document.addEventListener('focusout',cancel); window.addEventListener('blur',cancel);
    return () => { observer.disconnect(); document.removeEventListener('pointerdown',down,true); document.removeEventListener('pointerup',up,true);
      document.removeEventListener('pointercancel',cancel,true); document.removeEventListener('focusin',focus);
      document.removeEventListener('click',activateMedia,true);
      document.removeEventListener('focusout',cancel); window.removeEventListener('blur',cancel); };
  }, [immersive, viewport.landscape, hidden]);
  useEffect(() => {
    if (!immersive || !preferences.autoHide || hidden !== 'visible') return;
    let timer: ReturnType<typeof setTimeout>;
    const idle = () => {
      const blocked = controllerMustStayVisible(interacting.current, Boolean(rootRef.current?.contains(document.activeElement)),
        Boolean(document.querySelector('[role="dialog"], [role="menu"], [data-state="open"][role="listbox"], .clipt-controller details[open]')));
      if (blocked) timer = setTimeout(idle, CONTROLLER_IDLE_MS);
      else setHidden('auto');
    };
    timer = setTimeout(idle,CONTROLLER_IDLE_MS);
    return () => clearTimeout(timer);
  }, [immersive, preferences.autoHide, hidden, activity]);
  return { rootRef, immersive, viewport, hidden: immersive && (hidden === 'manual' || (preferences.autoHide && hidden === 'auto')),
    hiddenReason: hidden, wake, hide: () => setHidden('manual') };
}
