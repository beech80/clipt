/** Public UI gates do not grant billing authorization; the server remains authoritative. */
export function billingPreviewMode(env: Record<string, unknown>) {
  const development = env.VITE_SUPABASE_URL === 'https://akiksrlzdqvipqbbjxpw.supabase.co'
    && ['development', 'staging'].includes(String(env.VITE_APP_ENV));
  return {
    readiness: development && (env.DEV === true || env.VITE_BILLING_READINESS_ENABLED === 'true'),
    checkoutDisabled: env.VITE_BILLING_CHECKOUT_DISABLED !== 'false',
  };
}
