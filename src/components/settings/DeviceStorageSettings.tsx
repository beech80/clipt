import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';

export function DeviceStorageSettings() {
  const { data, error } = useQuery({
    queryKey: ['device-storage'],
    queryFn: async () => navigator.storage?.estimate ? navigator.storage.estimate() : null,
  });
  return <Card className="p-6 space-y-3">
    <h2 className="text-xl font-semibold">Device storage and performance</h2>
    <p>{data?.usage !== undefined ? `Browser storage used: ${(data.usage / 1024 / 1024).toFixed(1)} MB` : 'Storage measurement unavailable.'}</p>
    {error && <p role="alert">Unable to measure browser storage.</p>}
    <p className="text-sm text-muted-foreground">Hardware acceleration is managed by your browser. Use Accessibility Settings below to reduce motion. Media is not automatically downloaded for offline use.</p>
  </Card>;
}
