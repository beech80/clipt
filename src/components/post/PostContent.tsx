interface PostContentProps {
  content: string;
  imageUrl: string | null;
}

const PostContent = ({ imageUrl }: PostContentProps) => {
  return (
    <div className="relative w-full h-[calc(100vh-200px)] bg-black">
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Post content"
          className="w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
    </div>
  );
};

export default PostContent;