import { ProfileEditForm } from "@/components/profile/ProfileEditForm"

const EditProfile = () => {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground">
            Update your profile information and social media presence.
          </p>
        </div>
        <ProfileEditForm />
      </div>
    </div>
  )
}

export default EditProfile