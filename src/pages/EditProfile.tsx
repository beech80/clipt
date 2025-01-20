import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const EditProfile = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
        <ProfileEditForm />
      </Card>
    </div>
  );
};

export default EditProfile;