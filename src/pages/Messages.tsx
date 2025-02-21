import React from "react";
import GameBoyControls from "@/components/GameBoyControls";
import { Button } from "@/components/ui/button";
import { Search, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Messages = () => {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    if (searchTerm.length < 1) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${searchTerm}%`)
      .limit(10);

    if (error) {
      toast.error("Error searching users");
      setIsSearching(false);
      return;
    }

    setSearchResults(data || []);
    setIsSearching(false);
  };

  const handleSearchUsers = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 3) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${term}%`)
      .limit(5);

    if (error) {
      toast.error("Error searching users");
      return;
    }

    setSearchResults(data || []);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast.error("Please enter a group name and select at least one user");
      return;
    }

    const { data: groupData, error: groupError } = await supabase
      .from('group_chats')
      .insert({
        name: groupName,
        created_by: user?.id,
      })
      .select()
      .single();

    if (groupError) {
      toast.error("Error creating group chat");
      return;
    }

    const { error: memberError } = await supabase
      .from('group_chat_members')
      .insert({
        group_id: groupData.id,
        user_id: user?.id,
        role: 'admin'
      });

    if (memberError) {
      toast.error("Error adding you as group admin");
      return;
    }

    // Create invites for selected users
    const invites = selectedUsers.map(userId => ({
      group_id: groupData.id,
      user_id: userId,
      role: 'member'
    }));

    const { error: membersError } = await supabase
      .from('group_chat_members')
      .insert(invites);

    if (membersError) {
      toast.error("Error adding members");
      return;
    }

    toast.success("Group chat created!");
    setGroupName("");
    setSelectedUsers([]);
    setSearchResults([]);
  };

  return (
    <div className="container mx-auto p-4 min-h-screen relative pb-[200px]">
      <div className="gameboy-header">
        <h1 className="gameboy-title">MESSAGES</h1>
      </div>

      <div className="mt-20 grid grid-cols-1 h-[calc(100vh-8rem)]">
        <div className="gaming-card overflow-y-auto relative">
          <div className="absolute top-4 right-4 flex gap-2">
            <div className="relative flex-1 mr-2">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch();
                }}
                className="pr-8"
              />
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                >
                  <Users className="h-4 w-4" />
                  <span className="sr-only">Create Group</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Group Chat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Group Name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  <div className="space-y-2">
                    <Input
                      placeholder="Search users to add..."
                      value={searchTerm}
                      onChange={(e) => handleSearchUsers(e.target.value)}
                    />
                    {searchResults.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-2 rounded bg-gaming-800 hover:bg-gaming-700"
                          >
                            <span>{user.username}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (!selectedUsers.includes(user.id)) {
                                  setSelectedUsers([...selectedUsers, user.id]);
                                  toast.success(`Added ${user.username} to group`);
                                }
                              }}
                              disabled={selectedUsers.includes(user.id)}
                            >
                              {selectedUsers.includes(user.id) ? 'Added' : 'Add'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedUsers.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Selected Users:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedUsers.map((userId) => {
                          const user = searchResults.find(u => u.id === userId);
                          return (
                            <div
                              key={userId}
                              className="flex items-center gap-2 bg-gaming-800 rounded px-2 py-1"
                            >
                              <span>{user?.username}</span>
                              <button
                                onClick={() => setSelectedUsers(selectedUsers.filter(id => id !== userId))}
                                className="text-red-500 hover:text-red-400"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={handleCreateGroup}
                    disabled={!groupName || selectedUsers.length === 0}
                    className="w-full mt-4"
                  >
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-16 p-4">
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded bg-gaming-800 hover:bg-gaming-700 cursor-pointer transition-colors"
                    onClick={() => {
                      // Here you can implement the logic to open a chat with this user
                      toast.info(`Chat with ${user.username} coming soon!`);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {user.avatar_url && (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <span>{user.username}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Messages;
