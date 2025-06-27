# Vercel Deployment Guide for Clipt

## Setting Up Environment Variables in Vercel

When deploying your Clipt application to Vercel, you need to configure your environment variables in the Vercel dashboard rather than relying on local `.env` files.

### Step 1: Log in to Vercel
Go to [https://vercel.com/dashboard](https://vercel.com/dashboard) and log in to your account.

### Step 2: Select Your Project
Choose the Clipt project from your dashboard.

### Step 3: Navigate to Environment Variables Settings
1. Click the "Settings" tab at the top of your project page
2. In the left sidebar, click "Environment Variables"

### Step 4: Add Each Environment Variable
For each variable in your local `.env` file:

1. Click the "Add New" button
2. Enter the variable name exactly as it appears in your `.env` file (e.g., `VITE_SUPABASE_URL`)
3. Enter the actual value in the "Value" field
4. Choose which environments this variable should be available in:
   - Production (for the live site)
   - Preview (for deployment previews)
   - Development (for local development with Vercel CLI)
5. Click "Add" to save the variable

### Step 5: Add All Required Environment Variables

Here's the complete list of environment variables your project needs:

```
# Supabase Configuration
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

# Stripe API keys and product IDs
VITE_STRIPE_PUBLISHABLE_KEY
VITE_STRIPE_SECRET_KEY
VITE_STRIPE_PRO_PRICE_ID
VITE_STRIPE_MAXED_PRICE_ID

# Cloudinary credentials needed for media uploads
VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_API_KEY
VITE_CLOUDINARY_API_SECRET

# Push notification VAPID keys
VITE_VAPID_PUBLIC_KEY
VITE_VAPID_PRIVATE_KEY

# Cloudflare Stream API credentials
VITE_CLOUDFLARE_ACCOUNT_ID
VITE_CLOUDFLARE_API_TOKEN
VITE_CLOUDFLARE_STREAM_URL
```

### Step 6: Redeploy Your Application
After adding all environment variables, deploy or redeploy your application to apply the changes.

## Important Security Notes

1. **Never commit real API keys to version control**
   - Your `.gitignore` has been updated to exclude `.env` files
   - Use the `.env.example` file as a template showing which variables are needed (without real values)

2. **Rotate API keys periodically**
   - For security best practices, regularly generate new API keys for production services

3. **Use separate API keys for development and production**
   - This isolates your production environment from development testing

4. **Restrict API key permissions**
   - When possible, limit the scope and permissions of your API keys to only what's needed

## Local Development

For local development:
1. Keep a copy of your actual keys in your local `.env` file
2. This file won't be committed to git (because of `.gitignore`)
3. Run your application locally using `npm run dev` or your preferred command
