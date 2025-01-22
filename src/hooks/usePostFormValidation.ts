import { usePostForm } from "@/contexts/PostFormContext";
import { useAuth } from "@/contexts/AuthContext";

export function usePostFormValidation() {
  const { user } = useAuth();
  const {
    content,
    selectedImage,
    selectedVideo,
    selectedGif,
    setError,
  } = usePostForm();

  const validateForm = () => {
    if (!user) {
      setError("Please login to create a post");
      return false;
    }

    if (!content.trim() && !selectedImage && !selectedVideo && !selectedGif) {
      setError("Please add some content, image, GIF, or video to your post");
      return false;
    }

    if (
      (selectedImage && selectedVideo) ||
      (selectedImage && selectedGif) ||
      (selectedVideo && selectedGif)
    ) {
      setError("Please choose only one type of media");
      return false;
    }

    setError(null);
    return true;
  };

  return { validateForm };
}