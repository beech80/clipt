import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuthSecurity } from '@/hooks/useAuthSecurity';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const TwoFactorSettings = () => {
  const { is2FAEnabled, toggle2FA } = useAuthSecurity();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle2FA = async () => {
    setIsLoading(true);
    await toggle2FA(!is2FAEnabled);
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Add an extra layer of security to your account by enabling two-factor authentication.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-medium">Enable 2FA</div>
            <div className="text-sm text-muted-foreground">
              Require a verification code when signing in
            </div>
          </div>
          <Switch
            checked={is2FAEnabled}
            onCheckedChange={handleToggle2FA}
            disabled={isLoading}
          />
        </div>
        
        {is2FAEnabled && (
          <Alert>
            <AlertDescription>
              Two-factor authentication is enabled. You'll need to enter a verification code when signing in.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};