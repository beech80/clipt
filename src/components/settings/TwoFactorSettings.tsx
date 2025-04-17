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
import { CheckCircle2, Shield } from 'lucide-react';

export const TwoFactorSettings = () => {
  const { is2FAEnabled, isContactVerified, toggle2FA, verifyContact, isLoading: securityLoading } = useAuthSecurity();
  const [isLoading, setIsLoading] = useState(false);
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email');
  const [contactValue, setContactValue] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [savedContactInfo, setSavedContactInfo] = useState<{method: 'email' | 'phone', value: string} | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

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
    // Don't allow enabling 2FA without verified contact info
    if (!is2FAEnabled && !isContactVerified) {
      toast.error('Please verify your contact information first');
      return;
    }
    
    setIsLoading(true);
    await toggle2FA(!is2FAEnabled);
    setIsLoading(false);
  };

  const handleVerifyContact = async () => {
    if (!userId || !contactValue || !savedContactInfo) return;
    
    setIsLoading(true);
    const success = await verifyContact(contactMethod, contactValue);
    
    if (success) {
      setShowVerification(false);
      setVerificationCode('');
      toast.success('Contact information verified successfully');
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
      
      // Show verification dialog
      setShowVerification(true);
      toast.success('A verification code has been sent to your ' + contactMethod);
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
            <Alert className={isContactVerified ? "bg-green-950/30 border-green-800 text-green-400" : "bg-amber-950/30 border-amber-800 text-amber-400"}>
              <AlertDescription className="flex items-center gap-2">
                {isContactVerified ? (
                  <>
                    <CheckCircle2 size={16} className="text-green-400" />
                    Your {savedContactInfo.method} ({savedContactInfo.value}) is verified and ready for 2FA.
                  </>
                ) : (
                  <>
                    Your {savedContactInfo.method} ({savedContactInfo.value}) is saved but needs verification.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Verification code input */}
          {showVerification && savedContactInfo && !isContactVerified && (
            <div className="mt-4 p-4 border border-orange-500/30 rounded-md bg-orange-500/5">
              <h4 className="text-sm font-medium mb-2">Verify your {contactMethod}</h4>
              <p className="text-xs text-muted-foreground mb-3">
                A verification code has been sent to your {contactMethod}.
                Enter the 6-digit code below to verify.
              </p>
              <div className="flex gap-2">
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  placeholder="6-digit code"
                  className="text-base"
                />
                <Button 
                  onClick={handleVerifyContact}
                  disabled={isLoading || verificationCode.length !== 6}
                  size="sm"
                >
                  Verify
                </Button>
              </div>
            </div>
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
            disabled={isLoading || !isContactVerified}
          />
        </div>
        
        {is2FAEnabled && (
          <Alert className="bg-green-950/30 border-green-800 text-green-400">
            <AlertDescription className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              Two-factor authentication is enabled. You'll need to enter a verification code when signing in.
            </AlertDescription>
          </Alert>
        )}
        
        {!isContactVerified && (
          <Alert variant="destructive">
            <AlertDescription>
              You need to verify your contact information before enabling 2FA.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};