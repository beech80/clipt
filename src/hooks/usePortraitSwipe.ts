import { useEffect, useRef, type RefObject } from 'react';
import { portraitSwipeDirection } from '@/lib/mobile-controls';
import { useMobileControlsPreferences } from '@/hooks/useMobileControlsPreferences';

/** No React updates per pointer move; a bounded SVG path follows real input. */
export function usePortraitSwipe(track: RefObject<HTMLElement>, enabled: boolean) {
  const path = useRef<SVGPathElement>(null);
  const { preferences: { trail } } = useMobileControlsPreferences();
  useEffect(() => {
    const surface = track.current;
    if (!surface || !enabled) return;
    let origin: { id: number; x: number; y: number; at: number } | null = null;
    let points: string[] = [], frame = 0, fade: ReturnType<typeof setTimeout> | undefined;
    let suppressClick = false;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const clear = () => { if (path.current) { path.current.setAttribute('d', ''); path.current.style.opacity = '0'; } points = []; };
    const cancel = () => { origin = null; clear(); };
    const draw = () => {
      frame = 0;
      if (!path.current) return;
      // Rounded quadratic segments give the energy ribbon a fluid curved tail.
      const coords = points.map(point => point.split(',').map(Number));
      let curve = coords.length ? `M${coords[0].join(',')}` : '';
      for (let i = 1; i < coords.length; i++) {
        const previous = coords[i - 1], current = coords[i];
        curve += ` Q${previous.join(',')} ${(previous[0] + current[0]) / 2},${(previous[1] + current[1]) / 2}`;
      }
      path.current.setAttribute('d', curve);
      path.current.style.opacity = '1';
    };
    const down = (event: PointerEvent) => {
      if (!matchMedia('(orientation: portrait)').matches || event.pointerType === 'mouse' || !event.isPrimary || origin) { cancel(); return; }
      const target = event.target;
      const zone = target instanceof Element ? target.closest<HTMLElement>('.clipt-bottom-swipe-zone') : null;
      if (!zone) return;
      if (!(target instanceof Element) || target.closest('input,textarea,select,a,[contenteditable="true"],[role="slider"]') ||
        (target.closest('button') && !target.closest('.clipt-cinematic-media')) || document.querySelector('[data-sliding-panel][data-panel-size="full"]')) return;
      // Native player controls are retargeted to VIDEO by the shadow DOM. Keep
      // their bottom strip available for scrubbing, volume and fullscreen taps.
      if (target.tagName === 'VIDEO' && (target as HTMLVideoElement).controls && event.clientY > target.getBoundingClientRect().bottom - 48) return;
      if (fade) clearTimeout(fade);
      clear(); suppressClick = false;
      origin = { id: event.pointerId, x: event.clientX, y: event.clientY, at: performance.now() };
      zone.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (origin?.id !== event.pointerId || !trail || motion.matches || document.documentElement.classList.contains('reduce-motion')) return;
      const bounds = surface.querySelector('.clipt-bottom-swipe-zone')?.getBoundingClientRect();
      if (!bounds) return;
      points.push(`${Math.max(bounds.left, Math.min(bounds.right, event.clientX))},${Math.max(bounds.top, Math.min(bounds.bottom, event.clientY))}`);
      if (points.length > 32) points.shift();
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const up = (event: PointerEvent) => {
      if (origin?.id !== event.pointerId) return;
      const dx = event.clientX - origin.x, dy = event.clientY - origin.y, elapsed = performance.now() - origin.at;
      const direction = portraitSwipeDirection(dx, dy, elapsed) ||
        (elapsed <= 1200 && Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.3 ? (dx < 0 ? 1 : -1) : 0);
      origin = null;
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      if (direction) { suppressClick = true; window.dispatchEvent(new CustomEvent('clipt:navigate', { detail: { direction } })); }
      if (path.current) path.current.style.opacity = '0';
      fade = setTimeout(clear, 450);
    };
    const click = (event: MouseEvent) => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; } };
    surface.addEventListener('pointerdown', down, { passive: true }); surface.addEventListener('pointermove', move, { passive: true });
    surface.addEventListener('pointerup', up); surface.addEventListener('pointercancel', cancel); surface.addEventListener('click', click, true);
    window.addEventListener('blur', cancel);
    return () => {
      cancelAnimationFrame(frame); if (fade) clearTimeout(fade); clear();
      surface.removeEventListener('pointerdown', down); surface.removeEventListener('pointermove', move);
      surface.removeEventListener('pointerup', up); surface.removeEventListener('pointercancel', cancel); surface.removeEventListener('click', click, true);
      window.removeEventListener('blur', cancel);
    };
  }, [track, enabled, trail]);
  return path;
}
