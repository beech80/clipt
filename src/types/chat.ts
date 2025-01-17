export interface RealtimePresenceState {
  [key: string]: {
    user_id?: string;
    username?: string;
    timestamp?: number;
  }[];
}