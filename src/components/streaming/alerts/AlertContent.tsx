import React, { useEffect } from 'react';
import { AlertData } from './types';
import { playAlertSound } from './utils/alertSounds';

interface AlertContentProps {
  alert: AlertData;
}

export const AlertContent = ({ alert }: AlertContentProps) => {
  useEffect(() => {
    if (alert.styles.soundEnabled) {
      playAlertSound(alert.styles.soundVolume);
    }
  }, [alert.styles.soundEnabled, alert.styles.soundVolume]);

  const getAlertContent = (alert: AlertData) => {
    switch (alert.type) {
      case 'follow':
        return `${alert.data.username} just followed!`;
      case 'subscription':
        return `${alert.data.username} just subscribed!`;
      case 'donation':
        return `${alert.data.username} donated ${alert.data.amount}!`;
      case 'host':
        return `${alert.data.username} is hosting with ${alert.data.amount} viewers!`;
      case 'raid':
        return `${alert.data.username} is raiding with ${alert.data.amount} viewers!`;
      default:
        return 'New alert!';
    }
  };

  return (
    <div
      style={{
        backgroundColor: alert.styles.backgroundColor,
        color: alert.styles.textColor,
        fontSize: alert.styles.fontSize,
      }}
      className="rounded-lg p-4 shadow-lg min-w-[300px]"
    >
      {getAlertContent(alert)}
      {alert.data.message && (
        <p className="mt-2 text-sm opacity-80">{alert.data.message}</p>
      )}
    </div>
  );
};