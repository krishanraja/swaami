import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfilePhotoUploadProps {
  existingPhotoUrl?: string | null;
  onPhotoChange?: (url: string) => void;
}

export function ProfilePhotoUpload({ existingPhotoUrl, onPhotoChange }: ProfilePhotoUploadProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [photoUrl, setPhotoUrl] = useState<string | null>(existingPhotoUrl || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!user || !profile) return;
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      const newPhotoUrl = urlData.publicUrl;

      // Upsert to user_photos table with both user_id and profile_id
      const { error: dbError } = await supabase
        .from('user_photos')
        .upsert({
          user_id: user.id,
          profile_id: profile.id,
          photo_type: 'profile',
          photo_url: newPhotoUrl,
        }, { onConflict: 'user_id,photo_type' });

      if (dbError) throw dbError;

      setPhotoUrl(newPhotoUrl);
      onPhotoChange?.(newPhotoUrl);
      
      toast({
        title: "Photo updated!",
        description: "Your profile photo has been saved",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const displayName = profile?.display_name || user?.email || "?";

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />
      
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="relative group"
      >
        <div className={cn(
          "w-20 h-20 rounded-full overflow-hidden flex items-center justify-center transition-all",
          photoUrl ? "ring-2 ring-primary/20" : "bg-primary/20",
          "group-hover:ring-2 group-hover:ring-primary/50"
        )}>
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          ) : photoUrl ? (
            <img 
              src={photoUrl} 
              alt="Profile photo" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-semibold text-primary">
              {displayName[0]?.toUpperCase()}
            </span>
          )}
        </div>
        
        {/* Camera overlay */}
        <div className={cn(
          "absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center",
          "border-2 border-background shadow-md",
          "group-hover:scale-110 transition-transform"
        )}>
          <Camera className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
      </button>
      
      {!photoUrl && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Add photo
        </p>
      )}
    </div>
  );
}
