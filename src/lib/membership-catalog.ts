// Approved product information, not proof of a user's entitlement.
export const membershipCatalog = {
  premium: { name: 'Premium', cents: 499, monthly: true, discount: 10, dailyTokens: 30, storage: 400,
    features: ['10% Boost discount', 'Earn up to 30 Tokens daily', 'Store up to 400 Tokens', 'One free weekly content Boost', 'Ad-free experience', 'Premium badge'] },
  maxed: { name: 'Maxed', cents: 1499, monthly: true, discount: 20, dailyTokens: 50, storage: 1000,
    features: ['20% Boost discount', 'Earn up to 50 Tokens daily', 'Store up to 1,000 Tokens', 'One 24-hour Mega Boost every 7 days', 'Ad-free experience', 'Premium features included', 'Maxed badge'] },
} as const;
