import ImageUpload from "../ImageUpload";
import VideoUpload from "../VideoUpload";
import MediaPreview from "./MediaPreview";
import UploadProgress from "./UploadProgress";

interface MediaUploadSectionProps {
  selectedImage: File | null;
  selectedVideo: File | null;
  imageProgress: number;
  videoProgress: number;
  onImageSelect: (file: File | null) => void;
  onVideoSelect: (file: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  videoInputRef: React.RefObject<HTMLInputElement>;
}

const MediaUploadSection = ({
  selectedImage,
  selectedVideo,
  imageProgress,
  videoProgress,
  onImageSelect,
  onVideoSelect,
  fileInputRef,
  videoInputRef,
}: MediaUploadSectionProps) => {
  return (
    <>
      {selectedImage && (
        <>
          <MediaPreview 
            file={selectedImage} 
            type="image" 
            onRemove={() => onImageSelect(null)} 
          />
          <UploadProgress progress={imageProgress} type="image" />
        </>
      )}

      {selectedVideo && (
        <>
          <MediaPreview 
            file={selectedVideo} 
            type="video" 
            onRemove={() => onVideoSelect(null)} 
          />
          <UploadProgress progress={videoProgress} type="video" />
        </>
      )}

      {!selectedVideo && (
        <ImageUpload
          selectedImage={selectedImage}
          onImageSelect={onImageSelect}
          fileInputRef={fileInputRef}
        />
      )}

      {!selectedImage && (
        <VideoUpload
          selectedVideo={selectedVideo}
          onVideoSelect={onVideoSelect}
          videoInputRef={videoInputRef}
          uploadProgress={videoProgress}
          setUploadProgress={() => {}}
        />
      )}
    </>
  );
};

export default MediaUploadSection;