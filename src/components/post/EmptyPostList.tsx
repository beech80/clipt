import { useAuth } from "@/contexts/AuthContext";

export const EmptyPostList = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      {user ? (
        <p className="text-muted-foreground text-center max-w-md">
          Follow some creators to see their posts here!
        </p>
      ) : (
        <p className="text-muted-foreground text-center max-w-md">
          Sign in to see personalized content from creators you follow!
        </p>
      )}
    </div>
  );
};