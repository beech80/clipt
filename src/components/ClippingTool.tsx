import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTimes, 
  faCut, 
  faShare, 
  faSave, 
  faTrophy, 
  faCheck, 
  faStar, 
  faStarHalfAlt, 
  faClock,
  faComment
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

interface ClippingToolProps {
  isOpen: boolean;
  videoUrl: string;
  streamerName: string;
  onClose: () => void;
  onShareInChat?: (clipData: ClipData) => void;
}

interface ClipData {
  duration: number;
  startTime: number;
  endTime: number;
  rating?: number;
  comment?: string;
  clipId?: string;
}

const ClippingTool: React.FC<ClippingToolProps> = ({
  isOpen,
  videoUrl,
  streamerName,
  onClose,
  onShareInChat
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);
  const [clipReady, setClipReady] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [startTrim, setStartTrim] = useState(0);
  const [endTrim, setEndTrim] = useState(60);
  const [maxDuration, setMaxDuration] = useState(60); // Default 60 seconds max duration
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [showRatingSection, setShowRatingSection] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  const startRecording = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0; // Reset video to beginning for demo
      videoRef.current.play();
      setIsRecording(true);
      setRecordedTime(0);
      
      recordingInterval.current = setInterval(() => {
        setRecordedTime(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }

    setIsRecording(false);
    setClipReady(true);
    setEndTrim(recordedTime > 0 ? recordedTime : 60);
  };

  useEffect(() => {
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, []);

  const saveClip = () => {
    toast({
      title: "Clip Saved!",
      description: `Your clip of ${streamerName} has been saved to your library.`,
    });

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const shareClip = () => {
    const clipData: ClipData = {
      duration: endTrim - startTrim,
      startTime: startTrim,
      endTime: endTrim,
      rating: rating,
      comment: comment,
      clipId: `clip-${Date.now()}`
    };
    
    if (onShareInChat) {
      onShareInChat(clipData);
    }
    
    toast({
      title: "Clip Shared!",
      description: `Your clip has been shared to the chat for others to rank and comment.`,
    });
    onClose();
  };

  const submitToTopClips = () => {
    toast({
      title: "Submitted to Top Clips!",
      description: `Your clip has been submitted for Top Clips consideration.`,
    });

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => {
      e.stopPropagation();
      // Only close if clicking the overlay background, not the modal content
      if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
        onClose();
      }
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-orange-500">
            {!clipReady ? 'Create a Clip' : editMode ? 'Edit Your Clip' : 'Your Clip is Ready!'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        {!clipReady && !isRecording && (
          <div className="mb-6 bg-gray-800/40 p-4 rounded-lg border-l-2 border-orange-500">
            <h3 className="text-white font-medium mb-3 flex items-center">
              <FontAwesomeIcon icon={faClock} className="mr-2 text-orange-500" />
              Select Recording Duration
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {[15, 30, 45, 60].map((seconds) => (
                <button
                  key={seconds}
                  className={`py-3 px-3 rounded-md transition ${maxDuration === seconds ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'}`}
                  onClick={() => setMaxDuration(seconds)}
                >
                  <span className="block text-lg font-bold">{seconds}</span>
                  <span className="block text-xs">seconds</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative mb-4 bg-black rounded-lg overflow-hidden aspect-video">
          <video 
            ref={videoRef}
            src={videoUrl} 
            className="w-full h-full object-contain"
            loop
            muted // For demo purposes
          />

          {isRecording && (
            <div className="absolute top-4 right-4 bg-red-600 text-white text-sm font-bold px-2 py-1 rounded-md flex items-center gap-1 animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              REC {recordedTime}s / {maxDuration}s
            </div>
          )}
        </div>

        {/* Recording controls */}
        {!clipReady && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex justify-center w-full">
              {!isRecording ? (
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white transform hover:scale-105 active:scale-100 transition w-full max-w-xs py-4 text-lg font-bold"
                  onClick={startRecording}
                >
                  <FontAwesomeIcon icon={faCut} className="mr-2" />
                  Start Recording ({maxDuration}s)
                </Button>
              ) : (
                <Button 
                  className="bg-gray-700 hover:bg-gray-800 text-white transform hover:scale-105 active:scale-100 transition w-full max-w-xs py-4 text-lg font-bold"
                  onClick={stopRecording}
                >
                  <FontAwesomeIcon icon={faCheck} className="mr-2" />
                  Stop ({recordedTime}s / {maxDuration}s)
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Editing controls */}
        {clipReady && editMode && (
          <div className="mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-200 mb-2">Trim Start Point</label>
              <div className="px-2">
                <Slider
                  defaultValue={[startTrim]}
                  max={endTrim - 1}
                  step={1}
                  onValueChange={(values) => setStartTrim(values[0])}
                />
                <div className="text-right text-sm text-gray-400 mt-1">{startTrim}s</div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-200 mb-2">Trim End Point</label>
              <div className="px-2">
                <Slider
                  defaultValue={[endTrim]}
                  min={startTrim + 1}
                  max={recordedTime}
                  step={1}
                  onValueChange={(values) => setEndTrim(values[0])}
                />
                <div className="text-right text-sm text-gray-400 mt-1">{endTrim}s</div>
              </div>
            </div>

            <div className="text-center text-sm text-gray-300 mb-4">
              Clip Duration: {endTrim - startTrim} seconds
            </div>

            <div className="flex justify-center">
              <Button 
                className="bg-orange-600 hover:bg-orange-700 text-white transform hover:scale-105 active:scale-100 transition"
                onClick={() => setEditMode(false)}
              >
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                Apply Trim
              </Button>
            </div>
          </div>
        )}

        {/* Action buttons and rating section when clip is ready */}
        {clipReady && !editMode && (
          <div>
            {showRatingSection ? (
              <div className="mb-6 bg-gray-800/50 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-3 flex items-center">
                  <FontAwesomeIcon icon={faStar} className="mr-2 text-yellow-500" />
                  Rate This Clip
                </h3>
                
                <div className="mb-4">
                  <div className="flex justify-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star} 
                        onClick={() => setRating(star)}
                        className="text-2xl focus:outline-none transform hover:scale-110 transition"
                      >
                        <FontAwesomeIcon 
                          icon={rating >= star ? faStar : faStarHalfAlt} 
                          className={rating >= star ? 'text-yellow-500' : 'text-gray-400'} 
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-sm text-gray-300">
                    {rating === 0 && "Click to rate"}
                    {rating === 1 && "Not great"}
                    {rating === 2 && "Okay"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Great!"}
                    {rating === 5 && "Amazing!"}
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Add a comment (optional)
                  </label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What makes this clip special?"
                    className="bg-gray-900 border-gray-700 text-white resize-none h-20"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                    onClick={() => setShowRatingSection(false)}
                  >
                    Back
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                    onClick={shareClip}
                    disabled={rating === 0}
                  >
                    <FontAwesomeIcon icon={faComment} className="mr-2" />
                    Share in Chat
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  className="bg-gray-700 hover:bg-gray-800 text-white transform hover:scale-105 active:scale-100 transition"
                  onClick={() => setEditMode(true)}
                >
                  <FontAwesomeIcon icon={faCut} className="mr-2" />
                  Trim Clip
                </Button>

                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105 active:scale-100 transition"
                  onClick={saveClip}
                >
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  Save to Library
                </Button>

                <Button
                  className="bg-green-600 hover:bg-green-700 text-white transform hover:scale-105 active:scale-100 transition"
                  onClick={() => setShowRatingSection(true)}
                >
                  <FontAwesomeIcon icon={faShare} className="mr-2" />
                  Rate & Share in Chat
                </Button>

                <Button 
                  className="bg-yellow-600 hover:bg-yellow-700 text-white transform hover:scale-105 active:scale-100 transition"
                  onClick={submitToTopClips}
                >
                  <FontAwesomeIcon icon={faTrophy} className="mr-2" />
                  Submit to Top Clips
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClippingTool;
