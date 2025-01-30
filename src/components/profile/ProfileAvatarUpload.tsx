import { useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

interface ProfileAvatarUploadProps {
  avatarUrl: string | null
  displayName: string | null
  username: string | null
  onAvatarChange: (url: string) => void
  refetch: () => void
}

export function ProfileAvatarUpload({ 
  avatarUrl, 
  displayName, 
  username, 
  onAvatarChange,
  refetch 
}: ProfileAvatarUploadProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return
      }
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}.${fileExt}`

      setUploading(true)

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id)

      if (updateError) throw updateError

      onAvatarChange(publicUrl)
      toast.success("Profile picture updated successfully!")
      refetch()
    } catch (error) {
      toast.error("Error updating profile picture")
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="w-24 h-24 cursor-pointer hover:opacity-90 transition-opacity border-4 border-purple-500" onClick={handleAvatarClick}>
          <AvatarImage src={avatarUrl || ''} />
          <AvatarFallback className="bg-purple-600">
            {displayName?.charAt(0) || username?.charAt(0) || '?'}
          </AvatarFallback>
          <div className="absolute bottom-0 right-0 p-1 bg-purple-500 rounded-full">
            <Camera className="w-4 h-4 text-white" />
          </div>
        </Avatar>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarChange}
          className="hidden"
          accept="image/*"
          disabled={uploading}
        />
      </div>
      {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
    </div>
  )
}