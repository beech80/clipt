import { useEffect, useRef, type RefObject } from 'react';
import { portraitSwipeDirection } from '@/lib/mobile-controls';
import { useMobileControlsPreferences } from '@/hooks/useMobileControlsPreferences';

/** The bottom menu pad accepts taps and swipes; no React updates per pointer move. */
export function usePortraitSwipe(track: RefObject<HTMLElement>, enabled: boolean) {
  const path = useRef<SVGPathElement>(null);
  const { preferences: { trail } } = useMobileControlsPreferences();
  useEffect(() => {
    const surface = track.current;
    if (!surface || !enabled) return;
    let origin: { id: number; x: number; y: number; at: number; bounds: DOMRect; committed: boolean } | null = null;
    let points: [number, number][] = [], frame = 0, fade: ReturnType<typeof setTimeout> | undefined;
    let suppressClick = false;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const clear = () => { if (path.current) { path.current.setAttribute('d', ''); path.current.style.opacity = '0'; } points = []; };
    const cancel = () => { origin = null; if (frame) cancelAnimationFrame(frame); frame = 0; clear(); };
    const draw = () => {
      frame = 0;
      if (!path.current) return;
      // Rounded quadratic segments give the energy ribbon a fluid curved tail.
      const coords = points;
      let curve = coords.length ? `M${coords[0].join(',')}` : '';
      for (let i = 1; i < coords.length; i++) {
        const previous = coords[i - 1], current = coords[i];
        curve += ` Q${previous.join(',')} ${(previous[0] + current[0]) / 2},${(previous[1] + current[1]) / 2}`;
      }
      path.current.setAttribute('d', curve);
      path.current.style.opacity = '1';
    };
    const commit = (event: PointerEvent) => {
      if (!origin || origin.id !== event.pointerId || origin.committed) return;
      const dx = event.clientX - origin.x, dy = event.clientY - origin.y, elapsed = performance.now() - origin.at;
      const direction = portraitSwipeDirection(dx, dy, elapsed) ||
        (elapsed <= 1200 && Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.3 ? (dx < 0 ? 1 : -1) : 0);
      if (!direction) return;
      origin.committed = true; suppressClick = true;
      window.dispatchEvent(new CustomEvent('clipt:navigate', { detail: { direction, source: 'bottom-swipe' } }));
    };
    const down = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') { suppressClick = false; cancel(); return; }
      if (!matchMedia('(orientation: portrait)').matches || !event.isPrimary || origin) { cancel(); return; }
      const target = event.target;
      const zone = target instanceof Element ? target.closest<HTMLElement>('.clipt-bottom-swipe-zone') : null;
      if (!zone) return;
      if (!(target instanceof Element) || target.closest('input,textarea,select,a,[contenteditable="true"],[role="slider"]') ||
        (target.closest('button') && !target.closest('[data-swipe-menu]')) || document.querySelector('[data-sliding-panel][data-panel-size="full"]')) return;
      // Native player controls are retargeted to VIDEO by the shadow DOM. Keep
      // their bottom strip available for scrubbing, volume and fullscreen taps.
      if (target.tagName === 'VIDEO' && (target as HTMLVideoElement).controls && event.clientY > target.getBoundingClientRect().bottom - 48) return;
      if (fade) clearTimeout(fade);
      clear(); suppressClick = false;
      origin = { id: event.pointerId, x: event.clientX, y: event.clientY, at: performance.now(), bounds: surface.getBoundingClientRect(), committed: false };
      zone.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (origin?.id !== event.pointerId) return;
      commit(event);
      if (!trail || motion.matches || document.documentElement.classList.contains('reduce-motion')) return;
      const bounds = origin.bounds;
      const samples = event.getCoalescedEvents?.();
      for (const sample of samples?.length ? samples : [event]) {
        points.push([Math.max(bounds.left, Math.min(bounds.right, sample.clientX)), Math.max(bounds.top, Math.min(bounds.bottom, sample.clientY))]);
      }
      if (points.length > 24) points.splice(0, points.length - 24);
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const up = (event: PointerEvent) => {
      if (origin?.id !== event.pointerId) return;
      commit(event);
      origin = null;
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      if (path.current) path.current.style.opacity = '0';
      fade = setTimeout(clear, 300);
    };
    const click = (event: MouseEvent) => {
      if (!suppressClick) return;
      suppressClick = false;
      // Keyboard and assistive-technology activation must still open navigation.
      if (event.detail === 0) return;
      event.preventDefault(); event.stopPropagation();
    };
    surface.addEventListener('pointerdown', down, { passive: true }); surface.addEventListener('pointermove', move, { passive: true });
    surface.addEventListener('pointerup', up); surface.addEventListener('pointercancel', cancel); surface.addEventListener('click', click, true);
    window.addEventListener('blur', cancel); window.addEventListener('resize', cancel);
    return () => {
      cancelAnimationFrame(frame); if (fade) clearTimeout(fade); clear();
      surface.removeEventListener('pointerdown', down); surface.removeEventListener('pointermove', move);
      surface.removeEventListener('pointerup', up); surface.removeEventListener('pointercancel', cancel); surface.removeEventListener('click', click, true);
      window.removeEventListener('blur', cancel); window.removeEventListener('resize', cancel);
    };
  }, [track, enabled, trail]);
  return path;
}
