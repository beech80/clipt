export function notificationLink(resourceType: string | null, resourceId: string | null): string | null {
  if (!resourceId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resourceId)) return null;
  switch (resourceType) {
    case 'operational_alert': return '/moderation#operations-alerts';
    case 'post': return `/post/${resourceId}`;
    case 'profile': return `/user/${resourceId}`;
    case 'stream': return `/streaming/${resourceId}`;
    default: return null;
  }
}
