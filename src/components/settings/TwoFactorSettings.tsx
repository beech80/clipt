import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuthSecurity } from '@/hooks/useAuthSecurity';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export const TwoFactorSettings = () => {
  const { is2FAEnabled, toggle2FA } = useAuthSecurity();
  const [isLoading, setIsLoading] = useState(false);
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email');
  const [contactValue, setContactValue] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [savedContactInfo, setSavedContactInfo] = useState<{method: 'email' | 'phone', value: string} | null>(null);

  // Get current user and their 2FA contact info
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
        
        // Fetch existing contact info if any
        const { data: contactData, error } = await supabase
          .from('two_factor_auth')
          .select('contact_method, contact_value')
          .eq('user_id', data.user.id)
          .single();
          
        if (!error && contactData) {
          setContactMethod(contactData.contact_method || 'email');
          setContactValue(contactData.contact_value || '');
          setSavedContactInfo({
            method: contactData.contact_method,
            value: contactData.contact_value
          });
        }
      }
    };
    
    getUser();
  }, []);

  const handleToggle2FA = async () => {
    // Don't allow enabling 2FA without contact info
    if (!is2FAEnabled && !contactValue) {
      toast.error('Please enter your contact information first');
      return;
    }
    
    setIsLoading(true);
    await toggle2FA(!is2FAEnabled);
    
    // Save contact info when enabling 2FA
    if (!is2FAEnabled && userId) {
      const { error } = await supabase
        .from('two_factor_auth')
        .upsert({ 
          user_id: userId,
          contact_method: contactMethod,
          contact_value: contactValue,
          is_enabled: true
        });
        
      if (error) {
        toast.error('Failed to save contact information');
        console.error('Error saving contact info:', error);
      } else {
        setSavedContactInfo({
          method: contactMethod,
          value: contactValue
        });
        toast.success('Contact information saved successfully');
      }
    }
    
    setIsLoading(false);
  };
  
  const handleSaveContactInfo = async () => {
    if (!userId) return;
    
    if (!contactValue) {
      toast.error('Please enter your contact information');
      return;
    }
    
    setIsLoading(true);
    
    // Validate based on contact method
    if (contactMethod === 'email' && !contactValue.includes('@')) {
      toast.error('Please enter a valid email address');
      setIsLoading(false);
      return;
    }
    
    if (contactMethod === 'phone' && !/^\+?[\d\s-]{10,15}$/.test(contactValue)) {
      toast.error('Please enter a valid phone number');
      setIsLoading(false);
      return;
    }
    
    const { error } = await supabase
      .from('two_factor_auth')
      .upsert({ 
        user_id: userId,
        contact_method: contactMethod,
        contact_value: contactValue,
        is_enabled: is2FAEnabled
      });
      
    if (error) {
      toast.error('Failed to save contact information');
      console.error('Error saving contact info:', error);
    } else {
      setSavedContactInfo({
        method: contactMethod,
        value: contactValue
      });
      toast.success('Contact information saved successfully');
    }
    
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
      <CardContent className="space-y-6">
        {/* Contact method selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Contact Method for Verification</h3>
          <p className="text-sm text-muted-foreground">
            Choose how you want to receive verification codes when signing in.
          </p>
          
          <RadioGroup 
            value={contactMethod} 
            onValueChange={(value) => setContactMethod(value as 'email' | 'phone')}
            className="space-y-3"
          >
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="email" id="email" />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="email" className="font-medium">
                  Email
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive verification codes via email
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="phone" id="phone" />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="phone" className="font-medium">
                  Phone (SMS)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive verification codes via text message
                </p>
              </div>
            </div>
          </RadioGroup>
          
          <div className="space-y-2">
            <Label htmlFor="contactValue">
              {contactMethod === 'email' ? 'Email Address' : 'Phone Number'}
            </Label>
            <Input
              id="contactValue"
              type={contactMethod === 'email' ? 'email' : 'tel'}
              placeholder={contactMethod === 'email' ? 'your@email.com' : '+1 (555) 555-5555'}
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              {contactMethod === 'email' 
                ? 'Enter the email where you want to receive verification codes' 
                : 'Enter your phone number with country code (e.g., +1 for US)'}
            </p>
          </div>
          
          <Button 
            onClick={handleSaveContactInfo} 
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Save Contact Information
          </Button>
          
          {savedContactInfo && (
            <Alert className="bg-green-950/30 border-green-800 text-green-400">
              <AlertDescription>
                Your {savedContactInfo.method} ({savedContactInfo.value}) is saved for verification.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <div className="space-y-0.5">
            <div className="font-medium">Enable 2FA</div>
            <div className="text-sm text-muted-foreground">
              Require a verification code when signing in
            </div>
          </div>
          <Switch
            checked={is2FAEnabled}
            onCheckedChange={handleToggle2FA}
            disabled={isLoading || !contactValue}
          />
        </div>
        
        {is2FAEnabled && (
          <Alert>
            <AlertDescription>
              Two-factor authentication is enabled. You'll need to enter a verification code when signing in.
            </AlertDescription>
          </Alert>
        )}
        
        {!contactValue && (
          <Alert variant="destructive">
            <AlertDescription>
              You need to enter your contact information before enabling 2FA.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};