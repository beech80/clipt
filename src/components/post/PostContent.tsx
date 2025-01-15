interface PostContentProps {
  content: string;
  imageUrl: string | null;
  videoUrl?: string | null;
}

const PostContent = ({ imageUrl, videoUrl }: PostContentProps) => {
  return (
    <div className="relative w-full h-[calc(100vh-200px)] bg-black">
      {videoUrl ? (
        <video
          src={videoUrl}
          controls
          className="w-full h-full object-cover"
          playsInline
          loop
        />
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt="Post content"
          className="w-full h-full object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
    </div>
  );
};

export default PostContent;