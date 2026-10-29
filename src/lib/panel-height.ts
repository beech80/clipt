export const PANEL_HEIGHT_KEY = 'clipt-panel-height-v1';
export function panelHeightFraction(height: number, available: number) {
  const max = Math.max(44, available);
  return Math.max(Math.min(180 / max, 1), Math.min(1, height / max));
}
export function readPanelHeight(value: string | null, key: string): number | null {
  try { const data: unknown = JSON.parse(value || '{}'); const n = data && typeof data === 'object' ? (data as Record<string, unknown>)[key] : null;
    return typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= 1 ? n : null;
  } catch { return null; }
}
