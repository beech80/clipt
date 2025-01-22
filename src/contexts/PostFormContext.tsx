import { createContext, useContext, ReactNode } from "react";
import { useState } from "react";

interface PostFormState {
  content: string;
  selectedImage: File | null;
  selectedVideo: File | null;
  selectedGif: string | null;
  imageProgress: number;
  videoProgress: number;
  showEditor: boolean;
  showGifPicker: boolean;
  scheduledDate?: Date;
  scheduledTime: string;
  error: string | null;
  isSubmitting: boolean;
}

interface PostFormContextType extends PostFormState {
  setContent: (content: string) => void;
  setSelectedImage: (file: File | null) => void;
  setSelectedVideo: (file: File | null) => void;
  setSelectedGif: (url: string | null) => void;
  setImageProgress: (progress: number) => void;
  setVideoProgress: (progress: number) => void;
  setShowEditor: (show: boolean) => void;
  setShowGifPicker: (show: boolean) => void;
  setScheduledDate: (date: Date | undefined) => void;
  setScheduledTime: (time: string) => void;
  setError: (error: string | null) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  resetForm: () => void;
}

const PostFormContext = createContext<PostFormContextType | undefined>(undefined);

export function PostFormProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [imageProgress, setImageProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setContent("");
    setSelectedImage(null);
    setSelectedVideo(null);
    setSelectedGif(null);
    setImageProgress(0);
    setVideoProgress(0);
    setScheduledDate(undefined);
    setScheduledTime("");
    setError(null);
    setIsSubmitting(false);
  };

  return (
    <PostFormContext.Provider
      value={{
        content,
        selectedImage,
        selectedVideo,
        selectedGif,
        imageProgress,
        videoProgress,
        showEditor,
        showGifPicker,
        scheduledDate,
        scheduledTime,
        error,
        isSubmitting,
        setContent,
        setSelectedImage,
        setSelectedVideo,
        setSelectedGif,
        setImageProgress,
        setVideoProgress,
        setShowEditor,
        setShowGifPicker,
        setScheduledDate,
        setScheduledTime,
        setError,
        setIsSubmitting,
        resetForm,
      }}
    >
      {children}
    </PostFormContext.Provider>
  );
}

export function usePostForm() {
  const context = useContext(PostFormContext);
  if (context === undefined) {
    throw new Error("usePostForm must be used within a PostFormProvider");
  }
  return context;
}