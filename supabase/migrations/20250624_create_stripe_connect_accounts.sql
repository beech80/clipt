-- Create a table to store Stripe Connect accounts for streamers
CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  account_status TEXT DEFAULT 'pending',
  details_submitted BOOLEAN DEFAULT FALSE,
  charges_enabled BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  
  -- Each user can only have one Stripe Connect account
  CONSTRAINT unique_user_stripe_account UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own Stripe Connect account
CREATE POLICY "Users can view their own stripe connect accounts"
  ON stripe_connect_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own Stripe Connect account
CREATE POLICY "Users can insert their own stripe connect account"
  ON stripe_connect_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own Stripe Connect account
CREATE POLICY "Users can update their own stripe connect account"
  ON stripe_connect_accounts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stripe_connect_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_stripe_connect_accounts_updated_at
BEFORE UPDATE ON stripe_connect_accounts
FOR EACH ROW
EXECUTE FUNCTION update_stripe_connect_accounts_updated_at();
