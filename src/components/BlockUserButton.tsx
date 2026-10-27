import { Button } from "@/components/ui/button";
import { useBlockUser } from "@/hooks/useBlockUser";
import { Ban, UserX2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface BlockUserButtonProps {
  userId: string;
  username: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function BlockUserButton({ userId, username, variant = "ghost", size = "icon" }: BlockUserButtonProps) {
  const { blockUser, unblockUser, checkIfBlocked, isBlocking } = useBlockUser();
  const {user}=useAuth();
  const queryClient=useQueryClient();
  const status=useQuery({queryKey:['block-status',user?.id,userId],
    queryFn:()=>checkIfBlocked(userId),enabled:!!user && user.id!==userId,retry:false});
  const isBlocked=status.data===true;
  const [showDialog, setShowDialog] = useState(false);

  const handleBlock = async () => {
    try {
      if (isBlocked) {
        await unblockUser(userId);
        toast.success(`Unblocked ${username}`);
      } else {
        await blockUser(userId);
        toast.success(`Blocked ${username}`);
      }
      queryClient.setQueryData(['block-status',user?.id,userId],!isBlocked);
      await queryClient.invalidateQueries({queryKey:['blocked-users']});
      await queryClient.invalidateQueries({queryKey:['clipts-feed']});
      await queryClient.invalidateQueries({queryKey:['squad-following']});
      setShowDialog(false);
    } catch (error) {
      toast.error("Failed to update block status");
    }
  };

  if(!user || user.id===userId) return null;
  if(status.isError) return <div role="alert" className="text-sm"><p>Block status unavailable.</p><Button variant="outline" onClick={()=>void status.refetch()}>Retry block status</Button></div>;
  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          disabled={isBlocking || status.isPending}
          className="min-h-11 min-w-11 text-muted-foreground hover:text-destructive"
        >
          {isBlocked ? <Ban className="h-4 w-4" /> : <UserX2 className="h-4 w-4" />}
          <span className={size==='icon'?'sr-only':''}>{status.isPending?'Checking block status…':isBlocked ? "Unblock user" : "Block user"}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBlocked ? "Unblock User" : "Block User"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBlocked 
              ? `Are you sure you want to unblock ${username}? They will be able to interact with your content again.`
              : `Block ${username}? Clipt will restrict account interactions. This does not remove copies of content already downloaded or seen while signed out.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            disabled={isBlocking}
            onClick={event=>{event.preventDefault();void handleBlock();}}
            className={isBlocked ? "bg-primary" : "bg-destructive"}
          >
            {isBlocking ? 'Updating…' : isBlocked ? "Unblock" : "Block"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
