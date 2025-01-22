import React from 'react';
import { useParams } from 'react-router-dom';

export default function Tournament() {
  const { tournamentId } = useParams();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tournament {tournamentId}</h1>
      {/* Tournament implementation will go here */}
    </div>
  );
}