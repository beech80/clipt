import React from 'react';
import { useParams } from 'react-router-dom';

export default function Hashtag() {
  const { tag } = useParams();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">#{tag}</h1>
      {/* Hashtag implementation will go here */}
    </div>
  );
}