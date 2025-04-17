import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion } from 'framer-motion';

// Pulse animation for notification indicator
const pulse = keyframes`
  0% { transform: scale(0.95); opacity: 0.7; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.7; }
`;

// Scanline animation
const scanlineAnimation = keyframes`
  0% { transform: translateY(0); }
  100% { transform: translateY(100%); }
`;

// Message typing indicator animation
const ellipsisAnimation = keyframes`
  0% { content: '.'; }
  33% { content: '..'; }
  66% { content: '...'; }
  100% { content: '.'; }
`;

// Retro Message Notification Indicator
export const NotificationBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff00bb 0%, #ff5500 100%);
  box-shadow: 0 0 8px #ff00bb;
  animation: ${props => css`${pulse} 1.5s infinite ease-in-out`};
`;

// Message Typing Indicator
export const TypingIndicator = ({ isTyping }: { isTyping: boolean }) => {
  if (!isTyping) return null;
  
  return (
    <TypingWrapper>
      <div className="typing-dot"></div>
      <div className="typing-dot"></div>
      <div className="typing-dot"></div>
    </TypingWrapper>
  );
};

const TypingWrapper = styled.div`
  display: flex;
  align-items: center;
  margin: 6px 10px;
  
  .typing-dot {
    width: 8px;
    height: 8px;
    margin: 0 2px;
    background-color: rgba(128, 81, 255, 0.7);
    border-radius: 50%;
    display: inline-block;
    
    &:nth-child(1) {
      animation: dotPulse 1.4s infinite ease-in-out;
    }
    
    &:nth-child(2) {
      animation: dotPulse 1.4s infinite ease-in-out 0.2s;
    }
    
    &:nth-child(3) {
      animation: dotPulse 1.4s infinite ease-in-out 0.4s;
    }
  }
  
  @keyframes dotPulse {
    0% { transform: scale(0.8); opacity: 0.4; }
    50% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(0.8); opacity: 0.4; }
  }
`;

// Retro Scanline Overlay for Message Areas
export const ScanlineOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 2;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to bottom,
      transparent 50%,
      rgba(0, 0, 0, 0.05) 51%
    );
    background-size: 100% 4px;
    z-index: 2;
    opacity: 0.3;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: -100%;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(128, 81, 255, 0.15) 50%,
      transparent 100%
    );
    animation: ${props => css`${scanlineAnimation} 8s linear infinite`};
    z-index: 1;
  }
`;

// Retro Badge Component
export const RetroBadge = styled(motion.div)`
  background: linear-gradient(135deg, #8051ff 0%, #5327ce 100%);
  color: white;
  font-size: 0.6rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  box-shadow: 0 0 6px rgba(128, 81, 255, 0.6);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

// Retro Divider
export const RetroDivider = styled.div`
  position: relative;
  height: 2px;
  width: 100%;
  background: linear-gradient(90deg, transparent, rgba(128, 81, 255, 0.5), transparent);
  margin: 10px 0;
  
  &::after {
    content: '';
    position: absolute;
    top: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 6px;
    height: 6px;
    background: #8051ff;
    border-radius: 50%;
    box-shadow: 0 0 4px #8051ff;
  }
`;

// Retro Time Display
export const RetroTimeDisplay = ({ timestamp }: { timestamp: Date | string }) => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const formattedTime = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  return (
    <TimeWrapper>
      <div className="time-display">{formattedTime}</div>
    </TimeWrapper>
  );
};

const TimeWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  .time-display {
    font-family: 'VT323', monospace;
    font-size: 0.8rem;
    color: #a78bfa;
    text-shadow: 0 0 4px rgba(167, 139, 250, 0.6);
  }
`;
