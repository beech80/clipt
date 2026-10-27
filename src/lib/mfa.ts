export function validateAuthenticatorCode(code: string): string {
  const normalized = code.trim();
  if (!/^\d{6}$/.test(normalized)) throw new Error('Enter the six-digit code from your authenticator.');
  return normalized;
}

export function needsMfaChallenge(level: { currentLevel: string | null; nextLevel: string | null }): boolean {
  return level.nextLevel === 'aal2' && level.currentLevel !== 'aal2';
}
