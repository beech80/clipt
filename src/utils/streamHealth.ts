export type HealthStatus = 'excellent' | 'good' | 'poor' | 'critical' | 'unknown';

export const calculateHealthStatus = (
  bitrate: number | null,
  fps: number | null,
  resolution: string | null
): HealthStatus => {
  if (!bitrate || !fps || !resolution) return 'unknown';

  const [width] = resolution.split('x').map(Number);
  
  // Health checks based on resolution
  if (width >= 1920) { // 1080p
    if (bitrate >= 6000 && fps >= 60) return 'excellent';
    if (bitrate >= 4500 && fps >= 30) return 'good';
    if (bitrate >= 3000) return 'poor';
    return 'critical';
  } else if (width >= 1280) { // 720p
    if (bitrate >= 4500 && fps >= 60) return 'excellent';
    if (bitrate >= 3000 && fps >= 30) return 'good';
    if (bitrate >= 2000) return 'poor';
    return 'critical';
  }
  
  // Default for lower resolutions
  if (bitrate >= 2500 && fps >= 30) return 'excellent';
  if (bitrate >= 1500 && fps >= 30) return 'good';
  if (bitrate >= 1000) return 'poor';
  return 'critical';
};

export const getHealthColor = (status: HealthStatus): string => {
  switch (status) {
    case 'excellent':
      return 'bg-green-500';
    case 'good':
      return 'bg-green-400';
    case 'poor':
      return 'bg-yellow-500';
    case 'critical':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
};

export const getHealthDescription = (status: HealthStatus): string => {
  switch (status) {
    case 'excellent':
      return 'Stream health is excellent';
    case 'good':
      return 'Stream health is good';
    case 'poor':
      return 'Stream quality is degraded';
    case 'critical':
      return 'Stream health is critical';
    default:
      return 'Stream health unknown';
  }
};