export interface AlertData {
  id: string;
  type: 'follow' | 'subscription' | 'donation' | 'host' | 'raid';
  data: {
    username: string;
    amount?: number;
    message?: string;
  };
  styles: AlertStyles;
}

export interface AlertStyles {
  animation: string;
  duration: number;
  soundEnabled: boolean;
  soundVolume: number;
  fontSize: string;
  textColor: string;
  backgroundColor: string;
}

export interface AlertSettings {
  id: string;
  alert_type: string;
  enabled: boolean;
  styles: AlertStyles;
  message_template: string;
}