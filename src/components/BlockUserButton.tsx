import { Button } from "@/components/ui/button";
import { useBlockUser } from "@/hooks/useBlockUser";
import { Ban, UserX2 } from "lucide-react";
import { useState, useEffect } from "react";
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
  const [isBlocked, setIsBlocked] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const checkBlockStatus = async () => {
      try {
        const blocked = await checkIfBlocked(userId);
        setIsBlocked(blocked);
      } catch (error) {
        console.error("Error checking block status:", error);
      }
    };
    checkBlockStatus();
  }, [userId, checkIfBlocked]);

  const handleBlock = async () => {
    try {
      if (isBlocked) {
        await unblockUser(userId);
        toast.success(`Unblocked ${username}`);
      } else {
        await blockUser(userId);
        toast.success(`Blocked ${username}`);
      }
      setIsBlocked(!isBlocked);
      setShowDialog(false);
    } catch (error) {
      toast.error("Failed to update block status");
      console.error("Error updating block status:", error);
    }
  };

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          disabled={isBlocking}
          className="text-muted-foreground hover:text-destructive"
        >
          {isBlocked ? <Ban className="h-4 w-4" /> : <UserX2 className="h-4 w-4" />}
          <span className="sr-only">{isBlocked ? "Unblock user" : "Block user"}</span>
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
              : `Are you sure you want to block ${username}? They won't be able to interact with your content anymore.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleBlock}
            className={isBlocked ? "bg-primary" : "bg-destructive"}
          >
            {isBlocked ? "Unblock" : "Block"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}