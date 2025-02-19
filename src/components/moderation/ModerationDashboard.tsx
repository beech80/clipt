
import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ContentFilters } from './ContentFilters';
import { SecurityEvents } from './SecurityEvents';
import { ReportedContent } from './ReportedContent';
import { BlockedIPs } from './BlockedIPs';

export const ModerationDashboard = () => {
  const { data: userRole } = useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data?.role;
    }
  });

  if (!userRole || !['admin', 'moderator'].includes(userRole)) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
        <p className="text-muted-foreground mt-2">
          You do not have permission to access the moderation dashboard.
        </p>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Moderation Dashboard</h1>
      
      <Tabs defaultValue="reports" className="w-full">
        <TabsList>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="filters">Content Filters</TabsTrigger>
          <TabsTrigger value="security">Security Events</TabsTrigger>
          <TabsTrigger value="blocked">Blocked IPs</TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <ReportedContent />
        </TabsContent>

        <TabsContent value="filters">
          <ContentFilters />
        </TabsContent>

        <TabsContent value="security">
          <SecurityEvents />
        </TabsContent>

        <TabsContent value="blocked">
          <BlockedIPs />
        </TabsContent>
      </Tabs>
    </div>
  );
};
