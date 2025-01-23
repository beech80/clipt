import { usePostForm } from "@/contexts/PostFormContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function PostFormMediaPreview() {
  const {
    selectedImage,
    selectedVideo,
    selectedGif,
    imageProgress,
    videoProgress,
    setSelectedImage,
    setSelectedVideo,
    setSelectedGif,
    setShowEditor,
  } = usePostForm();

  if (!selectedImage && !selectedVideo && !selectedGif) {
    return null;
  }

  return (
    <div className="space-y-4">
      {selectedImage && (
        <>
          <div className="relative">
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="Selected"
              className="w-full rounded-lg max-h-[300px] object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => setSelectedImage(null)}
            >
              Remove
            </Button>
          </div>
          {imageProgress > 0 && imageProgress < 100 && (
            <Progress value={imageProgress} className="h-2" />
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowEditor(true)}
            className="w-full sm:w-auto"
          >
            Edit Image
          </Button>
        </>
      )}

      {selectedVideo && (
        <>
          <div className="relative">
            <video
              src={URL.createObjectURL(selectedVideo)}
              controls
              className="w-full rounded-lg max-h-[300px] object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => setSelectedVideo(null)}
            >
              Remove
            </Button>
          </div>
          {videoProgress > 0 && videoProgress < 100 && (
            <Progress value={videoProgress} className="h-2" />
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowEditor(true)}
            className="w-full sm:w-auto"
          >
            Edit Video
          </Button>
        </>
      )}

      {selectedGif && (
        <div className="relative">
          <img
            src={selectedGif}
            alt="Selected GIF"
            className="rounded-lg max-h-96 w-auto"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => setSelectedGif(null)}
          >
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}