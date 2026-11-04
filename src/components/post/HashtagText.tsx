import {MentionProfileLink} from '@/components/mentions/MentionProfileLink';
import { Link } from 'react-router-dom';
import { hashtagParts } from '@/utils/hashtagUtils';

/** React escapes ordinary caption text; no caption HTML is ever injected. */
export function HashtagText({ text }: { text: string }) {
  return <>{hashtagParts(text).map((part, index) => part.tag
    ? <Link key={index} to={`/hashtag/${encodeURIComponent(part.tag)}`} onClick={event => event.stopPropagation()} className="text-purple-300 underline decoration-purple-400/60 hover:text-purple-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-300">{part.text}</Link>
    : part.text.split(/(@[A-Za-z0-9_][A-Za-z0-9_.-]{0,49})/g).map((piece,pieceIndex,parts)=>pieceIndex%2===1 && ((pieceIndex===1 && parts[0]==='') || /[\s(]$/.test(parts[pieceIndex-1] ?? '')) ? <MentionProfileLink key={pieceIndex} username={piece.slice(1)}/> : piece))}</>;
}

export default HashtagText;
