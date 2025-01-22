import React from 'react';
import { useParams } from 'react-router-dom';

export default function Stream() {
  const { streamId } = useParams();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Stream {streamId}</h1>
      {/* Stream implementation will go here */}
    </div>
  );
}