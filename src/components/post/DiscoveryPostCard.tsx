import { Link } from 'react-router-dom';
import HashtagText from './HashtagText';

export default function DiscoveryPostCard({ post }: { post: { id: string; content: string | null; username?: string | null; user_id?: string | null } }) {
  return <article className="gaming-card min-w-0 space-y-3 p-4">
    {post.user_id && post.username && <Link className="inline-block min-h-11 py-2 font-semibold text-purple-200 underline" to={`/profile/${post.user_id}`}>@{post.username}</Link>}
    <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]"><HashtagText text={post.content || 'Untitled Clipt'} /></p>
    <Link className="inline-flex min-h-11 items-center rounded border border-purple-400 px-4 text-purple-100" to={`/post/${post.id}`}>Open Clipt</Link>
  </article>;
}
