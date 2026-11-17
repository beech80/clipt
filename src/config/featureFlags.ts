export const streamingEnabled = import.meta.env.VITE_STREAMING_ENABLED !== 'false';
// Paid memberships are preserved for a future launch, but the social-media
// release is free. Re-enable only after a reviewed billing launch.
export const membershipsEnabled = import.meta.env.VITE_MEMBERSHIPS_ENABLED === 'true';

