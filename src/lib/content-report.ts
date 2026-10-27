import { supabase } from '@/lib/supabase';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const reasons = new Set(['inappropriate', 'harassment', 'spam', 'violence', 'copyright', 'other']);

export class ContentReportError extends Error {
  constructor(readonly kind: 'invalid' | 'auth' | 'unconfirmed') {
    super(kind === 'invalid' ? 'Invalid report request' : kind === 'auth' ? 'Report authorization unavailable' : 'Report submission not confirmed');
    this.name = 'ContentReportError';
  }
}

async function verifiedReporter(expectedUserId: string): Promise<string> {
  try {
    const { data: auth, error } = await supabase.auth.getUser();
    if (error || !auth.user || auth.user.is_anonymous || auth.user.id !== expectedUserId) throw new Error();
    return auth.user.id;
  } catch { throw new ContentReportError('auth'); }
}

export function supportsContentReport(type: string): type is 'post' | 'comment' | 'stream' {
  return type === 'post' || type === 'comment' || type === 'stream';
}

/** The database still enforces target visibility, account/MFA and reporter ownership. */
export async function submitContentReport(input: {
  contentId: string;
  contentType: string;
  reason: string;
  details: string;
  expectedUserId: string;
}): Promise<string> {
  if (!uuid.test(input.contentId) || !supportsContentReport(input.contentType) ||
      !reasons.has(input.reason) || typeof input.details !== 'string' ||
      input.details.length > 2000 || !input.expectedUserId) {
    throw new ContentReportError('invalid');
  }
  const reporterId = await verifiedReporter(input.expectedUserId);
  try {
    const { data, error } = await supabase.from('content_reports').insert({
      reporter_id: reporterId,
      content_id: input.contentId,
      content_type: input.contentType,
      reason: input.reason,
      notes: input.details.trim() || null,
    }).select('id').single().retry(false);
    // Do not propagate raw backend errors, report text, account IDs or URLs to logs.
    if (error || !data || typeof data.id !== 'string' || !uuid.test(data.id)) throw new Error();
    return data.id;
  } catch { throw new ContentReportError('unconfirmed'); }
}
