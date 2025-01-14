import PostMenu from "./PostMenu";

interface PostHeaderProps {
  avatarUrl: string;
  username: string;
  createdAt: string;
  postId: string;
  userId: string;
  content: string;
}

const PostHeader = ({ avatarUrl, username, createdAt, postId, userId, content }: PostHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img
          src={avatarUrl || "/placeholder.svg"}
          alt={username || "User"}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <h3 className="font-semibold">{username || "Anonymous"}</h3>
          <p className="text-sm text-muted-foreground">
            {new Date(createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
      <PostMenu postId={postId} userId={userId} content={content} />
    </div>
  );
};

export default PostHeader;