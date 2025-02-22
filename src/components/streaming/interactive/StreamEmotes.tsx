
import React from 'react';

interface StreamEmotesProps {
  onSelectEmote: (emote: string) => void;
}

export const StreamEmotes = ({ onSelectEmote }: StreamEmotesProps) => {
  return (
    <button
      type="button"
      className="p-2 hover:bg-accent rounded"
      onClick={() => onSelectEmote('heart')}
    >
      😊
    </button>
  );
};
