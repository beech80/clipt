export type ControllerPreference = 'auto' | 'classic' | 'immersive';
export type ControllerPreferences = { layout: ControllerPreference; autoHide: boolean; portraitZoom: boolean };
export const DEFAULT_CONTROLLER_PREFERENCES: ControllerPreferences = { layout: 'auto', autoHide: true, portraitZoom: false };
export const CONTROLLER_IDLE_MS = 10_000;
export function readControllerPreferences(value: string | null): ControllerPreferences {
  try {
    const data = JSON.parse(value || '{}');
    return { layout: ['auto','classic','immersive'].includes(data?.layout) ? data.layout : 'auto',
      autoHide: typeof data?.autoHide === 'boolean' ? data.autoHide : true,
      portraitZoom: data?.portraitZoom === true };
  } catch { return DEFAULT_CONTROLLER_PREFERENCES; }
}
export function portraitZoomConstrained(width: number, height: number, wasImmersive = false, normalWidth = 0) {
  if (width <= 0 || height <= 0) return false;
  // Screen width is supporting evidence only: a naturally small phone at its
  // normal width must not be mistaken for zoom. Do not infer a zoom percentage.
  if (normalWidth > 0 && width >= normalWidth * .95) return false;
  return wasImmersive ? width < 360 || (height < 520 && width < 380) : width < 340 || (height < 500 && width < 360);
}
export function controllerLayout(width: number, height: number, landscape: boolean, preference: ControllerPreference, portraitZoom = false, wasImmersive = false, normalWidth = 0) {
  // Upright keeps the approved classic layout unless the user explicitly opts
  // into the accessibility fallback AND available space becomes constrained.
  if (!landscape) return portraitZoom && portraitZoomConstrained(width, height, wasImmersive, normalWidth) ? 'immersive' : 'classic';
  const classicFits = width >= 700 && height >= 340;
  return preference === 'immersive' || !classicFits ? 'immersive' : 'classic';
}
export function controllerMustStayVisible(pointerActive: boolean, focusWithin: boolean, interactionOpen: boolean) {
  return pointerActive || focusWithin || interactionOpen;
}
