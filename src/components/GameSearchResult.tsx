import React from 'react';

interface GameSearchResultProps {
  id: string;
  name: string;
  external?: boolean;
  onClick: (id: string, external?: boolean) => void;
}

const GameSearchResult = ({ id, name, external = false, onClick }: GameSearchResultProps) => {
  return (
    <div
      className="p-3 hover:bg-indigo-900/50 cursor-pointer transition-colors"
      onClick={() => onClick(id, external)}
    >
      <div className="font-medium">{name}</div>
    </div>
  );
};

export default GameSearchResult;
