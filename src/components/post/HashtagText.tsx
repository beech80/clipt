import { Link } from 'react-router-dom';
import { hashtagParts } from '@/utils/hashtagUtils';

/** React escapes ordinary caption text; no caption HTML is ever injected. */
export function HashtagText({ text }: { text: string }) {
  return <>{hashtagParts(text).map((part, index) => part.tag
    ? <Link key={index} to={`/hashtag/${encodeURIComponent(part.tag)}`} onClick={event => event.stopPropagation()} className="text-purple-300 underline decoration-purple-400/60 hover:text-purple-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-300">{part.text}</Link>
    : part.text)}</>;
}

export default HashtagText;
