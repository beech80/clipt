import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { UserSearch } from "./UserSearch";

export function CreateGroupChat() {
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { user } = useAuth();

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || selectedUsers.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Create the group chat
      const { data: groupData, error: groupError } = await supabase
        .from('group_chats')
        .insert({
          name: groupName,
          created_by: user.id,
          is_private: false
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add all selected users as members
      const members = [...selectedUsers, user.id].map(userId => ({
        group_id: groupData.id,
        user_id: userId,
        role: userId === user.id ? 'admin' : 'member'
      }));

      const { error: membersError } = await supabase
        .from('group_chat_members')
        .insert(members);

      if (membersError) throw membersError;

      toast.success("Group chat created successfully!");
      setOpen(false);
      setGroupName("");
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error creating group chat:', error);
      toast.error("Failed to create group chat");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mb-4">
          Create Group Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Group Chat</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <UserSearch
              onSelect={(userId) => {
                if (!selectedUsers.includes(userId)) {
                  setSelectedUsers([...selectedUsers, userId]);
                }
              }}
              selectedUsers={selectedUsers}
              onRemove={(userId) => {
                setSelectedUsers(selectedUsers.filter(id => id !== userId));
              }}
            />
          </div>
          <Button onClick={handleCreateGroup} disabled={!groupName || selectedUsers.length === 0}>
            Create Group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}