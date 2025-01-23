import { Post } from './post';
import { StreamChatMessage, ChatEmote, ChatCommand } from './chat';

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: Post;
      };
      stream_chat: {
        Row: StreamChatMessage;
      };
      chat_emotes: {
        Row: ChatEmote;
      };
    };
  };
}