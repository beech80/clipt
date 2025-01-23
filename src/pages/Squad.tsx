import React from 'react';
import { useParams } from 'react-router-dom';

export default function Squad() {
  const { squadId } = useParams();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Squad {squadId}</h1>
      {/* Squad implementation will go here */}
    </div>
  );
}