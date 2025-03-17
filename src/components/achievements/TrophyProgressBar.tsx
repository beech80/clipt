import React from 'react';
import styled from 'styled-components';

interface TrophyProgressBarProps {
  currentValue: number;
  targetValue: number;
  color?: string;
  height?: number;
  showPercentage?: boolean;
  isCompleted?: boolean;
}

const ProgressBarContainer = styled.div<{ height: number }>`
  width: 100%;
  height: ${props => props.height}px;
  background-color: #222222;
  border-radius: 2px;
  overflow: hidden;
  position: relative;
`;

const ProgressBarFill = styled.div<{ 
  width: number; 
  color: string;
  isCompleted: boolean;
}>`
  height: 100%;
  width: ${props => props.width}%;
  background-color: ${props => props.isCompleted ? '#34dfeb' : props.color};
  border-radius: 2px;
  transition: width 0.5s ease-in-out;
`;

const ProgressText = styled.div`
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  font-weight: bold;
  color: white;
  text-shadow: 0px 0px 2px rgba(0, 0, 0, 0.7);
`;

const TrophyProgressBar: React.FC<TrophyProgressBarProps> = ({ 
  currentValue, 
  targetValue, 
  color = '#0078d7', 
  height = 8,
  showPercentage = true,
  isCompleted = false
}) => {
  // Calculate the percentage, cap at 100%
  const percentage = Math.min(Math.round((currentValue / targetValue) * 100), 100);
  
  return (
    <ProgressBarContainer height={height}>
      <ProgressBarFill 
        width={percentage} 
        color={color}
        isCompleted={isCompleted}
      />
      {showPercentage && (
        <ProgressText>
          {percentage}%
        </ProgressText>
      )}
    </ProgressBarContainer>
  );
};

export default TrophyProgressBar;
