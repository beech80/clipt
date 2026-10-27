export type HandPreference = 'right' | 'left';
export type MobileControlsPreferences = { hand: HandPreference; trail: boolean };
export const MOBILE_CONTROLS_KEY = 'clipt-mobile-controls-v1';
export const MOBILE_CONTROLS_EVENT = 'clipt:mobile-controls';
export const DEFAULT_MOBILE_CONTROLS: MobileControlsPreferences = { hand: 'right', trail: true };

export function readMobileControls(value: string | null): MobileControlsPreferences {
  try {
    const data: unknown = JSON.parse(value || '{}');
    const record = data && typeof data === 'object' ? data as Record<string, unknown> : {};
    return { hand: record.hand === 'left' ? 'left' : 'right', trail: typeof record.trail === 'boolean' ? record.trail : true };
  } catch { return { ...DEFAULT_MOBILE_CONTROLS }; }
}

/** Only vertical intentional gestures; horizontal navigation stays with the carousel. */
export function portraitSwipeDirection(dx: number, dy: number, elapsed: number): -1 | 0 | 1 {
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || !Number.isFinite(elapsed) || elapsed < 0 || elapsed > 1200) return 0;
  if (Math.abs(dy) < 48 || Math.abs(dy) < Math.abs(dx) * 1.3) return 0;
  return dy < 0 ? 1 : -1;
}

export type PanelSize = 'half' | 'expanded' | 'full';
export const PANEL_SIZES: readonly PanelSize[] = ['half', 'expanded', 'full'];
export function panelSizeAfterDrag(size: PanelSize, dy: number): PanelSize {
  if (Math.abs(dy) < 32) return size;
  return PANEL_SIZES[Math.max(0, Math.min(2, PANEL_SIZES.indexOf(size) + (dy < 0 ? 1 : -1)))];
}
