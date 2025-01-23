import { motion } from "framer-motion";
import { useEmotes } from '@/contexts/EmoteContext';

interface ChatMessageContentProps {
  content: string;
}

export const ChatMessageContent = ({ content }: ChatMessageContentProps) => {
  const { emotes } = useEmotes();

  const renderMessageContent = (content: string) => {
    const words = content.split(' ');
    return words.map((word, index) => {
      const emote = emotes.find(e => e.name === word);
      if (emote) {
        return (
          <motion.img
            key={`${index}-${word}`}
            src={emote.url}
            alt={emote.name}
            className="inline-block h-6 align-middle mx-1"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ 
              scale: 1.2,
              transition: { duration: 0.2 }
            }}
            title={emote.name}
          />
        );
      }
      return (
        <span key={`${index}-${word}`} className="mr-1">
          {word}
        </span>
      );
    });
  };

  return (
    <div className="text-sm break-words">
      {renderMessageContent(content)}
    </div>
  );
};