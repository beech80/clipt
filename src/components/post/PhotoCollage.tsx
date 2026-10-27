import React from 'react';

interface PhotoCollageProps {
  images: string[];
  onImageClick?: (index: number) => void;
  onImageLoad?: () => void;
  onImageError?: () => void;
}

const PhotoCollage: React.FC<PhotoCollageProps> = ({ images, onImageClick, onImageLoad, onImageError }) => {
  if (!images || images.length === 0) {
    return null;
  }

  const handleImageClick = (index: number) => {
    if (onImageClick) {
      onImageClick(index);
    }
  };

  const imageControl = (index: number): React.HTMLAttributes<HTMLImageElement> => ({
    onLoad: onImageLoad,
    onError: onImageError,
    ...(onImageClick ? {
    role: 'button',
    tabIndex: 0,
    'aria-label': `Open post image ${index + 1} of ${images.length}`,
    onClick: () => handleImageClick(index),
    onKeyDown: event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleImageClick(index);
      }
    },
    } : {}),
  });

  // Single image
  if (images.length === 1) {
    return (
      <div className="w-full aspect-video relative overflow-hidden">
        <img 
          src={images[0]} 
          alt="Post content" 
          className="w-full h-full object-cover"
          {...imageControl(0)}
        />
      </div>
    );
  }

  // Two images
  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 aspect-video">
        {images.map((image, index) => (
          <div key={index} className="relative overflow-hidden">
            <img 
              src={image} 
              alt={`Post content ${index + 1}`} 
              className="w-full h-full object-cover"
              {...imageControl(index)}
            />
          </div>
        ))}
      </div>
    );
  }

  // Three images
  if (images.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 aspect-video">
        <div className="relative overflow-hidden">
          <img 
            src={images[0]} 
            alt="Post content 1" 
            className="w-full h-full object-cover"
            {...imageControl(0)}
          />
        </div>
        <div className="grid grid-rows-2 gap-1">
          {images.slice(1, 3).map((image, index) => (
            <div key={index} className="relative overflow-hidden">
              <img 
                src={image} 
                alt={`Post content ${index + 2}`} 
                className="w-full h-full object-cover"
                {...imageControl(index + 1)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Four or more images
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-1 aspect-video">
      {images.slice(0, 4).map((image, index) => (
        <div key={index} className="relative overflow-hidden">
          <img 
            src={image} 
            alt={`Post content ${index + 1}`} 
            className="w-full h-full object-cover"
            {...imageControl(index)}
          />
          {index === 3 && images.length > 4 && (
            <div 
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl"
            >
              +{images.length - 4} more
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PhotoCollage;
