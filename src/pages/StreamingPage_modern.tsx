import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

interface StreamerType {
  id: string;
  name: string;
  genres: string[];
  description?: string;
}

const mockStreamers: StreamerType[] = [
  {
    id: '1',
    name: 'Streamer 1',
    genres: ['gaming', 'fps'],
    description: 'Pro FPS player'
  },
  {
    id: '2',
    name: 'Streamer 2',
    genres: ['art', 'creative'],
    description: 'Digital artist'
  }
];

const genres = [
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'art', name: 'Art', icon: '🎨' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'chat', name: 'Just Chatting', icon: '💬' }
];

const GlobalStyle = styled.div`
  margin: 0;
  padding: 0;
  box-sizing: border-box;
`;

const ExtraSpace = styled.div`
  height: 20px;
`;

const Header = styled(motion.div)`
  display: flex;
  align-items: center;
  padding: 1rem;
  gap: 1rem;
  
  h1 {
    margin: 0;
    font-size: 1.5rem;
  }
`;

const GenresContainer = styled(motion.div)`
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
  
  .genre {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: all 0.2s;
    
    &.selected {
      background: rgba(255, 85, 0, 0.2);
      border: 1px solid rgba(255, 85, 0, 0.3);
    }
    
    &:hover {
      background: rgba(255, 85, 0, 0.1);
    }
  }
`;

const StreamerCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 0.5rem 1rem;
  
  .streamer-info {
    h3 {
      margin: 0;
      font-size: 1.2rem;
    }
    
    p {
      margin: 0.5rem 0 0;
      font-size: 0.9rem;
      opacity: 0.8;
    }
  }
`;

const StreamingPageModern: React.FC = () => {
  const navigate = useNavigate();
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [streamers] = useState<StreamerType[]>(mockStreamers);

  const filteredStreamers = selectedGenre
    ? streamers.filter(streamer => streamer.genres.includes(selectedGenre))
    : streamers;

  return (
    <div>
      <GlobalStyle />
      <motion.div
        className="console-layout"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          backgroundColor: '#0C0C0C',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Header>
          <ChevronLeft onClick={() => navigate(-1)} />
          <h1>CLIPT Live</h1>
        </Header>

        {/* Genres */}
        <GenresContainer>
          {genres.map((genre) => (
            <motion.div
              key={genre.id}
              className={`genre ${selectedGenre === genre.id ? 'selected' : ''}`}
              onClick={() => setSelectedGenre(genre.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {genre.icon}
              <span>{genre.name}</span>
            </motion.div>
          ))}
        </GenresContainer>

        {/* Streamers */}
        <AnimatePresence>
          {filteredStreamers.map((streamer) => (
            <StreamerCard
              key={streamer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="streamer-info">
                <h3>{streamer.name}</h3>
                {streamer.description && <p>{streamer.description}</p>}
              </div>
            </StreamerCard>
          ))}
        </AnimatePresence>
        <ExtraSpace />
      </motion.div>
    </div>
  );
};

export default StreamingPageModern;
