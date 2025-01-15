interface PostUserInfoProps {
  username: string;
  content: string;
}

const PostUserInfo = ({ username, content }: PostUserInfoProps) => {
  return (
    <div className="absolute bottom-24 left-4 right-20 text-white">
      <h3 className="font-bold">@{username}</h3>
      <p className="text-sm mt-2 line-clamp-2">{content}</p>
    </div>
  );
};

export default PostUserInfo;