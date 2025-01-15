import { cn } from "@/lib/utils";

interface PostContentProps {
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
}

const PostContent = ({ content, imageUrl, videoUrl }: PostContentProps) => {
  // Function to format content (convert URLs to links, handle line breaks)
  const formatContent = (text: string) => {
    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const withLinks = text.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-gaming-400 hover:underline">${url}</a>`);
    
    // Convert line breaks to <br> tags
    const withLineBreaks = withLinks.replace(/\n/g, '<br>');
    
    return withLineBreaks;
  };

  return (
    <div className="relative w-full h-full">
      {(imageUrl || videoUrl) ? (
        <div className="absolute inset-0">
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Post content"
              className="w-full h-full object-cover"
            />
          )}
          {videoUrl && (
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              controls
              loop
              playsInline
              muted
            />
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {content && (
              <p 
                className="text-white text-lg break-words"
                dangerouslySetInnerHTML={{ __html: formatContent(content) }}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center bg-black p-8">
          <p 
            className="text-white text-xl break-words max-w-2xl"
            dangerouslySetInnerHTML={{ __html: formatContent(content) }}
          />
        </div>
      )}
    </div>
  );
};

export default PostContent;