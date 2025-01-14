interface PostContentProps {
  content: string;
  imageUrl: string | null;
}

const PostContent = ({ content, imageUrl }: PostContentProps) => {
  return (
    <>
      <p className="mt-4 whitespace-pre-wrap">{content}</p>
      {imageUrl && (
        <div className="mt-4 -mx-4">
          <img
            src={imageUrl}
            alt="Post content"
            className="w-full object-cover max-h-[500px]"
          />
        </div>
      )}
    </>
  );
};

export default PostContent;