import React from "react";

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
  disabled?: boolean;
}

export default function PostFormMedia({
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
  disabled
}: PostFormMediaProps) {
  return (
    <div className="space-y-4">
      <div>
        {selectedImage && (
          <div>
            <img src={URL.createObjectURL(selectedImage)} alt="Selected" />
            <progress value={imageProgress} max="100" />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files) {
              onImageSelect(e.target.files[0]);
            }
          }}
          disabled={disabled}
        />
      </div>

      <div>
        {selectedVideo && (
          <div>
            <video controls src={URL.createObjectURL(selectedVideo)} />
            <progress value={videoProgress} max="100" />
          </div>
        )}
        <input
          type="file"
          accept="video/*"
          onChange={(e) => {
            if (e.target.files) {
              onVideoSelect(e.target.files[0]);
            }
          }}
          disabled={disabled}
        />
      </div>

      {showGifPicker && (
        <div>
          <input
            type="text"
            placeholder="Enter GIF URL"
            onChange={(e) => onGifSelect(e.target.value)}
            disabled={disabled}
          />
        </div>
      )}
      <button onClick={onShowEditor} disabled={disabled}>
        Edit Media
      </button>
    </div>
  );
}
