import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { Camera, User, Coffee, MapPin, Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  existingPhotos: { photo_type: string; photo_url: string }[];
  onComplete: () => void;
  onCancel?: () => void;
}

type PhotoType = 'profile' | 'casual' | 'context';

const PHOTO_CONFIG: Record<PhotoType, {
  label: string;
  description: string;
  icon: typeof Camera;
}> = {
  profile: {
    label: 'Profile photo',
    description: 'Clear photo of your face',
    icon: User,
  },
  casual: {
    label: 'Casual photo',
    description: 'You in a relaxed setting',
    icon: Coffee,
  },
  context: {
    label: 'Context photo',
    description: 'You in your neighbourhood',
    icon: MapPin,
  },
};

export function PhotoUpload({ existingPhotos, onComplete, onCancel }: PhotoUploadProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<Record<PhotoType, string | null>>({
    profile: existingPhotos.find(p => p.photo_type === 'profile')?.photo_url || null,
    casual: existingPhotos.find(p => p.photo_type === 'casual')?.photo_url || null,
    context: existingPhotos.find(p => p.photo_type === 'context')?.photo_url || null,
  });
  const [uploading, setUploading] = useState<PhotoType | null>(null);
  const fileInputRefs = {
    profile: useRef<HTMLInputElement>(null),
    casual: useRef<HTMLInputElement>(null),
    context: useRef<HTMLInputElement>(null),
  };

  const handleFileSelect = async (type: PhotoType, file: File) => {
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

    setUploading(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      const photoUrl = urlData.publicUrl;

      // Upsert to user_photos table with both user_id and profile_id
      const { error: dbError } = await supabase
        .from('user_photos')
        .upsert({
          user_id: user.id,
          profile_id: profile.id,
          photo_type: type,
          photo_url: photoUrl,
        }, { onConflict: 'user_id,photo_type' });

      if (dbError) throw dbError;

      setPhotos(prev => ({ ...prev, [type]: photoUrl }));
      
      toast({
        title: "Photo uploaded",
        description: `Your ${type} photo has been saved`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleRemove = async (type: PhotoType) => {
    if (!user) return;

    try {
      await supabase
        .from('user_photos')
        .delete()
        .eq('user_id', user.id)
        .eq('photo_type', type);

      setPhotos(prev => ({ ...prev, [type]: null }));
    } catch (error: any) {
      console.error('Delete error:', error);
    }
  };

  const allPhotosUploaded = Object.values(photos).every(Boolean);
  const uploadedCount = Object.values(photos).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Upload profile photos</h3>
        <p className="text-sm text-muted-foreground">
          Help your neighbours recognize you ({uploadedCount}/3)
        </p>
      </div>

      <div className="grid gap-4">
        {(Object.keys(PHOTO_CONFIG) as PhotoType[]).map((type) => {
          const config = PHOTO_CONFIG[type];
          const Icon = config.icon;
          const hasPhoto = Boolean(photos[type]);
          const isUploading = uploading === type;

          return (
            <div key={type} className="relative">
              <input
                ref={fileInputRefs[type]}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(type, file);
                }}
              />
              
              <button
                type="button"
                onClick={() => !hasPhoto && fileInputRefs[type].current?.click()}
                disabled={isUploading}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed transition-colors text-left",
                  hasPhoto 
                    ? "border-primary/30 bg-primary/5" 
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center",
                  hasPhoto ? "" : "bg-muted"
                )}>
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  ) : hasPhoto ? (
                    <img 
                      src={photos[type]!} 
                      alt={config.label} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-medium text-sm">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>

                {hasPhoto ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(type);
                      }}
                      className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                    >
                      <X className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                ) : (
                  <Camera className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          className="flex-1"
          onClick={onComplete}
          disabled={!allPhotosUploaded}
        >
          {allPhotosUploaded ? 'Continue' : `Upload ${3 - uploadedCount} more`}
        </Button>
      </div>
    </div>
  );
}
