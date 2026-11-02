export function validateAuthenticatorCode(code: string): string {
  const normalized = code.trim();
  if (!/^\d{6}$/.test(normalized)) throw new Error('Enter the six-digit code from your authenticator.');
  return normalized;
}

export function needsMfaChallenge(level: { currentLevel: string | null; nextLevel: string | null }): boolean {
  return level.nextLevel === 'aal2' && level.currentLevel !== 'aal2';
}

type EnrollmentFactor = {
  id: string;
  factor_type: string;
  status: string;
  friendly_name?: string;
};
type EnrollmentApi = {
  listFactors(): Promise<{ data: { all: EnrollmentFactor[] } | null; error: unknown }>;
  unenroll(params: { factorId: string }): Promise<{ error: unknown }>;
  enroll(params: { factorType: 'totp'; friendlyName: string }): Promise<{
    data: { id: string; type: string; totp?: { qr_code: string; secret: string } } | null;
    error: unknown;
  }>;
};

// Only called after an explicit setup click. A refresh can lose the local QR
// while Supabase retains an unverified factor with this unique friendly name.
export async function startAuthenticatorEnrollment(mfa: EnrollmentApi) {
  const listed = await mfa.listFactors();
  if (listed.error) throw listed.error;
  if (!listed.data) throw new Error('Could not load authenticator settings.');
  if (listed.data.all.some(factor => factor.factor_type === 'totp' && factor.status === 'verified')) {
    throw new Error('An authenticator is already verified. Refresh your security settings.');
  }
  for (const factor of listed.data.all) {
    if (factor.factor_type !== 'totp' || factor.status !== 'unverified' ||
        factor.friendly_name !== 'Clipt authenticator') continue;
    const removed = await mfa.unenroll({ factorId: factor.id });
    if (removed.error) throw removed.error;
  }
  const enrolled = await mfa.enroll({ factorType: 'totp', friendlyName: 'Clipt authenticator' });
  if (enrolled.error) throw enrolled.error;
  if (enrolled.data?.type !== 'totp' || !enrolled.data.totp) {
    throw new Error('Authenticator enrollment was not returned.');
  }
  return {
    id: enrolled.data.id,
    qrCode: enrolled.data.totp.qr_code,
    secret: enrolled.data.totp.secret,
  };
}
