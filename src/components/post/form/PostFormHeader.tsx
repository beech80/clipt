import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PostFormHeaderProps {
  showEditor: boolean;
  selectedImage: File | null;
  selectedVideo: File | null;
}

const PostFormHeader = ({ showEditor, selectedImage, selectedVideo }: PostFormHeaderProps) => {
  return (
    <DialogHeader>
      <DialogTitle>
        {selectedImage ? "Edit Image" : selectedVideo ? "Edit Video" : "Edit Media"}
      </DialogTitle>
    </DialogHeader>
  );
};

export default PostFormHeader;