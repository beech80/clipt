import { useMessages, MessagesProvider } from "@/contexts/MessagesContext";
import { MessageList } from "@/components/messages/MessageList";
import { ChatList } from "@/components/messages/ChatList";
import { MessageInput } from "@/components/messages/MessageInput";

function MessagesContent() {
  const { selectedChat, setSelectedChat, messages, chats, isLoading, handleSendMessage } = useMessages();

  return (
    <div className="mx-auto max-w-4xl h-[calc(100vh-4rem)]">
      <div className="h-full border rounded-lg grid grid-cols-1 md:grid-cols-3 divide-x">
        <div className="p-4">
          <ChatList
            chats={chats}
            selectedChat={selectedChat}
            onSelectChat={setSelectedChat}
          />
        </div>

        <div className="col-span-2 flex flex-col h-full">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Loading messages...
            </div>
          ) : selectedChat ? (
            <>
              <MessageList messages={messages} />
              <MessageInput onSendMessage={handleSendMessage} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a chat to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Messages() {
  return (
    <MessagesProvider>
      <MessagesContent />
    </MessagesProvider>
  );
}