import { Dialog, DialogContent } from "@/components/ui/dialog";
import ImageEditor from "../ImageEditor";
import VideoEditor from "../VideoEditor";
import GifConverter from "../GifConverter";
import PostFormHeader from "./PostFormHeader";

interface PostFormMediaEditorProps {
  showEditor: boolean;
  setShowEditor: (show: boolean) => void;
  selectedImage: File | null;
  selectedVideo: File | null;
  onEditedMedia: (blob: Blob) => void;
}

const PostFormMediaEditor = ({
  showEditor,
  setShowEditor,
  selectedImage,
  selectedVideo,
  onEditedMedia,
}: PostFormMediaEditorProps) => {
  return (
    <Dialog open={showEditor} onOpenChange={setShowEditor}>
      <DialogContent className="max-w-4xl">
        <PostFormHeader 
          showEditor={showEditor}
          selectedImage={selectedImage}
          selectedVideo={selectedVideo}
        />
        
        {selectedImage && (
          <ImageEditor
            imageFile={selectedImage}
            onSave={onEditedMedia}
          />
        )}
        
        {selectedVideo && (
          <>
            <VideoEditor
              videoFile={selectedVideo}
              onSave={onEditedMedia}
            />
            <GifConverter
              videoFile={selectedVideo}
              onConvert={onEditedMedia}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PostFormMediaEditor;