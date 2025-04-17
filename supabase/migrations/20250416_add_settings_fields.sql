-- Add new settings fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS enable_2fa BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS contact_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hardware_acceleration BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS reduce_animations BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS background_processing BOOLEAN DEFAULT TRUE;

-- Create two_factor_auth table if it doesn't exist
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_method TEXT NOT NULL CHECK (contact_method IN ('email', 'phone')),
  contact_value TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON two_factor_auth(user_id);

-- Apply RLS policies
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;

-- Users can only read their own 2FA settings
CREATE POLICY "Users can view their own 2FA settings" 
  ON two_factor_auth FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only update their own 2FA settings
CREATE POLICY "Users can update their own 2FA settings" 
  ON two_factor_auth FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can only insert their own 2FA settings
CREATE POLICY "Users can insert their own 2FA settings" 
  ON two_factor_auth FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_two_factor_auth_updated_at
BEFORE UPDATE ON two_factor_auth
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
