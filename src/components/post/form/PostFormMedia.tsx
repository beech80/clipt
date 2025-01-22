import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Image, Video } from "lucide-react";
import ImageUpload from "../ImageUpload";
import VideoUpload from "../VideoUpload";
import MediaPreview from "./MediaPreview";
import UploadProgress from "./UploadProgress";

const gf = new GiphyFetch('pLURtkhVrUXr3KG25Gy5IvzziV5OrZGa');

interface PostFormMediaProps {
  selectedImage: File | null;
  selectedVideo: File | null;
  selectedGif: string | null;
  imageProgress: number;
  videoProgress: number;
  showGifPicker: boolean;
  onImageSelect: (file: File | null) => void;
  onVideoSelect: (file: File | null) => void;
  onGifSelect: (url: string | null) => void;
  onShowGifPickerChange: (show: boolean) => void;
  onShowEditor: () => void;
}

const PostFormMedia = ({
  selectedImage,
  selectedVideo,
  selectedGif,
  imageProgress,
  videoProgress,
  showGifPicker,
  onImageSelect,
  onVideoSelect,
  onGifSelect,
  onShowGifPickerChange,
  onShowEditor,
}: PostFormMediaProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      {selectedImage && (
        <>
          <MediaPreview 
            file={selectedImage} 
            type="image" 
            onRemove={() => onImageSelect(null)} 
          />
          <UploadProgress progress={imageProgress} type="image" />
          <Button
            type="button"
            variant="outline"
            onClick={onShowEditor}
            className="w-full sm:w-auto"
          >
            Edit Image
          </Button>
        </>
      )}

      {selectedGif && (
        <div className="relative">
          <img src={selectedGif} alt="Selected GIF" className="rounded-lg max-h-96 w-auto" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => onGifSelect(null)}
          >
            Remove
          </Button>
        </div>
      )}

      {selectedVideo && (
        <>
          <MediaPreview 
            file={selectedVideo} 
            type="video" 
            onRemove={() => onVideoSelect(null)} 
          />
          <UploadProgress progress={videoProgress} type="video" />
          <Button
            type="button"
            variant="outline"
            onClick={onShowEditor}
            className="w-full sm:w-auto"
          >
            Edit Video
          </Button>
        </>
      )}

      <div className="flex flex-wrap gap-2">
        {!selectedVideo && !selectedGif && (
          <ImageUpload
            selectedImage={selectedImage}
            onImageSelect={onImageSelect}
            fileInputRef={fileInputRef}
          />
        )}

        {!selectedImage && !selectedGif && (
          <VideoUpload
            selectedVideo={selectedVideo}
            onVideoSelect={onVideoSelect}
            videoInputRef={videoInputRef}
            uploadProgress={videoProgress}
            setUploadProgress={() => {}}
          />
        )}

        {!selectedImage && !selectedVideo && (
          <Popover open={showGifPicker} onOpenChange={onShowGifPickerChange}>
            <PopoverTrigger asChild>
              <Button 
                type="button" 
                variant="outline"
                className="w-full sm:w-auto"
              >
                Add GIF
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
              <div className="h-[300px] overflow-auto">
                <Grid
                  width={300}
                  columns={2}
                  fetchGifs={(offset: number) => gf.trending({ offset, limit: 10 })}
                  onGifClick={(gif) => {
                    onGifSelect(gif.images.fixed_height.url);
                    onShowGifPickerChange(false);
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};

export default PostFormMedia;