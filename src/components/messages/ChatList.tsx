import { Search, UserSearch } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ChatUser } from "@/types/message";
import { cn } from "@/lib/utils";
import { ChatListItem } from "./ChatListItem";
import { CreateGroupChat } from "../chat/CreateGroupChat";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { UserSearch as UserSearchDialog } from "@/components/chat/UserSearch";

interface ChatListProps {
  onSelectUser: (userId: string) => void;
}

export function ChatList({ onSelectUser }: ChatListProps) {
  const [showUserSearch, setShowUserSearch] = useState(false);

  return (
    <div className="border-r border-border">
      <div className="flex items-center gap-2 mb-4">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setShowUserSearch(true)}
        >
          <UserSearch className="mr-2 h-4 w-4" />
          Find Someone to Chat With
        </Button>
        <CreateGroupChat />
      </div>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search messages..." />
      </div>
      
      <div className="space-y-2">
        {/* Sample data for preview */}
        {[
          {
            id: "1",
            username: "User 1",
            avatar_url: null,
            last_message: "Hey there!",
            unread_count: 2
          },
          {
            id: "2",
            username: "User 2",
            avatar_url: null,
            last_message: "How are you?",
            unread_count: 0
          }
        ].map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            isSelected={false}
            onSelect={() => onSelectUser(chat.id)}
          />
        ))}
      </div>

      {showUserSearch && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
            <h2 className="text-lg font-semibold">Find Someone to Chat With</h2>
            <UserSearchDialog
              onSelect={(userId) => {
                onSelectUser(userId);
                setShowUserSearch(false);
              }}
              onRemove={() => {}}
              selectedUsers={[]}
            />
            <Button variant="outline" onClick={() => setShowUserSearch(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
