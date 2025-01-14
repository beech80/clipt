interface PostContentProps {
  content: string;
  imageUrl: string | null;
}

const PostContent = ({ content, imageUrl }: PostContentProps) => {
  return (
    <div className="relative h-full">
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Post content"
          className="w-full h-full object-cover"
        />
      )}
      <p className="absolute bottom-20 left-4 right-4 text-white text-lg z-10 line-clamp-2">
        {content}
      </p>
    </div>
  );
};

export default PostContent;