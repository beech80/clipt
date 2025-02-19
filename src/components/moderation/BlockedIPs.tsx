
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_at: string;
  expires_at: string | null;
}

export const BlockedIPs = () => {
  const queryClient = useQueryClient();
  const [newIP, setNewIP] = useState('');
  const [reason, setReason] = useState('');

  const { data: blockedIPs, isLoading } = useQuery<BlockedIP[]>({
    queryKey: ['blocked-ips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocked_ips')
        .select('id, ip_address, reason, blocked_at, expires_at')
        .order('blocked_at', { ascending: false });

      if (error) throw error;
      return data as BlockedIP[];
    }
  });

  const blockIPMutation = useMutation({
    mutationFn: async ({ ip, blockReason }: { ip: string, blockReason: string }) => {
      const { error } = await supabase
        .from('blocked_ips')
        .insert([{
          ip_address: ip,
          reason: blockReason,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-ips'] });
      toast.success('IP blocked successfully');
      setNewIP('');
      setReason('');
    },
    onError: (error) => {
      toast.error('Failed to block IP');
      console.error('Error blocking IP:', error);
    }
  });

  const unblockIPMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blocked_ips')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-ips'] });
      toast.success('IP unblocked successfully');
    },
    onError: (error) => {
      toast.error('Failed to unblock IP');
      console.error('Error unblocking IP:', error);
    }
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Block New IP</h3>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="IP Address"
              value={newIP}
              onChange={(e) => setNewIP(e.target.value)}
            />
            <Input
              placeholder="Reason for blocking"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => blockIPMutation.mutate({ ip: newIP, blockReason: reason })}
            disabled={!newIP.trim() || !reason.trim()}
          >
            Block IP
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Blocked IPs</h3>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {blockedIPs?.map((block) => (
              <div key={block.id} className="flex items-center justify-between p-4 bg-card-secondary rounded-lg">
                <div>
                  <p className="font-medium">{block.ip_address}</p>
                  <p className="text-sm text-muted-foreground">
                    {block.reason} • Blocked on {new Date(block.blocked_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => unblockIPMutation.mutate(block.id)}
                >
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
