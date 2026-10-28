import { Globe } from 'lucide-react';
import { profileWebsite } from '@/lib/profile-website';

export default function ProfileWebsite({ value }: { value?: string | null }) {
  const href = profileWebsite(value);
  if (!href) return null;
  return <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 max-w-full items-center gap-2 py-2 text-purple-200 underline [overflow-wrap:anywhere]">
    <Globe size={16} className="shrink-0" aria-hidden="true" /><span className="min-w-0 break-all">{href.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
  </a>;
}
