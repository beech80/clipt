import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertData } from './types';
import { AlertContent } from './AlertContent';

interface AlertAnimationProps {
  alert: AlertData | null;
}

export const AlertAnimation = ({ alert }: AlertAnimationProps) => {
  const animations = {
    fade: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -50 },
    },
    scale: {
      initial: { scale: 0, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0, opacity: 0 },
    },
    slide: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '-100%' },
    },
  };

  if (!alert) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={alert.id}
        initial={animations[alert.styles.animation as keyof typeof animations].initial}
        animate={animations[alert.styles.animation as keyof typeof animations].animate}
        exit={animations[alert.styles.animation as keyof typeof animations].exit}
        transition={{ duration: 0.5 }}
      >
        <AlertContent alert={alert} />
      </motion.div>
    </AnimatePresence>
  );
};