type ScrollSurface = Pick<HTMLElement, 'scrollLeft' | 'scrollTo' | 'style'>;
const running = new WeakMap<ScrollSurface, { frame: number; restore: () => void }>();
export const SWIPE_SCROLL_MS = 160;

export function cancelClipScroll(track: ScrollSurface) {
  const motion = running.get(track);
  if (motion) { cancelAnimationFrame(motion.frame); running.delete(track); motion.restore(); }
}

/** A bounded transition avoids native smooth-scroll stalls on WebKit carousels. */
export function scrollClipTo(track: ScrollSurface, left: number, behavior: ScrollBehavior, quick = false) {
  cancelClipScroll(track);
  if (!quick || behavior === 'instant') { track.scrollTo({ left, behavior }); return; }
  const from = track.scrollLeft;
  track.scrollTo({ left: from, behavior: 'instant' }); // Cancel any native smooth scroll.
  if (Math.abs(left - from) < 1) { track.scrollTo({ left, behavior: 'instant' }); return; }
  const snap = track.style.scrollSnapType;
  track.style.scrollSnapType = 'none';
  const start = performance.now();
  const motion = { frame: 0, restore: () => { track.style.scrollSnapType = snap; } };
  running.set(track, motion);
  const step = (now: number) => {
    if (running.get(track) !== motion) return;
    const progress = Math.min(1, Math.max(0, (now - start) / SWIPE_SCROLL_MS));
    const eased = 1 - (1 - progress) ** 3;
    track.scrollTo({ left: progress === 1 ? left : from + (left - from) * eased, behavior: 'instant' });
    if (progress < 1) motion.frame = requestAnimationFrame(step);
    else { running.delete(track); motion.restore(); }
  };
  motion.frame = requestAnimationFrame(step);
}
