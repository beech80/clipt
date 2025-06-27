import React from 'react';
import { Star } from 'lucide-react';

interface TokenCounterProps {
  count: number;
  maxCount?: number;
  className?: string;
  showMax?: boolean;
}

const TokenCounter: React.FC<TokenCounterProps> = ({ 
  count, 
  maxCount, 
  className = '',
  showMax = false 
}) => {
  return (
    <div className={`token-counter flex items-center ${className}`}>
      <Star className="h-5 w-5 mr-1 text-yellow-400 fill-yellow-400" />
      <span className="font-medium">
        {count.toLocaleString()}
        {showMax && maxCount !== undefined && (
          <span className="text-gray-400 text-sm ml-1">
            / {maxCount.toLocaleString()}
          </span>
        )}
      </span>
    </div>
  );
};

export default TokenCounter;
