import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SKILLS } from "@/types/swaami";
import { Settings, Star, MapPin, Clock, History, ChevronRight } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { RadiusSlider } from "@/components/RadiusSlider";
import { AvailabilitySelector } from "@/components/AvailabilitySelector";
import { SkillChip } from "@/components/SkillChip";
import { toast } from "sonner";
import swaamiLogo from "@/assets/swaami-logo.png";

interface ProfileScreenProps {
  onLogout: () => void;
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const [editingRadius, setEditingRadius] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);
  const [tempRadius, setTempRadius] = useState(profile?.radius || 500);
  const [tempAvailability, setTempAvailability] = useState<'now' | 'later' | 'this-week'>(
    (profile?.availability as 'now' | 'later' | 'this-week') || 'now'
  );
  const [tempSkills, setTempSkills] = useState<string[]>(profile?.skills || []);

  const userSkills = SKILLS.filter((s) => profile?.skills?.includes(s.id));

  const handleSaveRadius = async () => {
    const { error } = await updateProfile({ radius: tempRadius });
    if (error) {
      toast.error("Couldn't update radius");
    } else {
      toast.success("Radius updated!");
      setEditingRadius(false);
    }
  };

  const handleSaveAvailability = async () => {
    const { error } = await updateProfile({ availability: tempAvailability });
    if (error) {
      toast.error("Couldn't update availability");
    } else {
      toast.success("Availability updated!");
      setEditingAvailability(false);
    }
  };

  const handleToggleSkill = (skillId: string) => {
    setTempSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((s) => s !== skillId)
        : [...prev, skillId]
    );
  };

  const handleSaveSkills = async () => {
    const { error } = await updateProfile({ skills: tempSkills });
    if (error) {
      toast.error("Couldn't update skills");
    } else {
      toast.success("Skills updated!");
      setEditingSkills(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="px-4 py-4 max-w-lg mx-auto flex items-center justify-between">
          <img src={swaamiLogo} alt="Swaami" className="h-16 w-auto" />
          <button className="p-2 hover:bg-muted rounded-xl transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Content - scrollable */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 max-w-lg mx-auto w-full">
        {/* User Info */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-semibold text-primary-foreground">
            {profile.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {profile.display_name || "Neighbor"}
            </h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Credits */}
        <div className="bg-primary rounded-2xl p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-foreground/80 mb-1">Your credits</p>
              <p className="text-4xl font-semibold text-primary-foreground">
                {profile.credits}
              </p>
              <p className="text-xs text-primary-foreground/60 mt-1">
                Earn credits by helping others
              </p>
            </div>
            <div className="w-14 h-14 rounded-full bg-foreground/10 flex items-center justify-center">
              <Star className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div
            className="bg-card border border-border rounded-xl p-4 animate-fade-in"
            style={{ animationDelay: "50ms" }}
          >
            <p className="text-2xl font-semibold text-foreground">
              {profile.tasks_completed}
            </p>
            <p className="text-sm text-muted-foreground">People helped</p>
          </div>
          <div
            className="bg-card border border-border rounded-xl p-4 animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            <p className="text-2xl font-semibold text-foreground flex items-center gap-1">
              {profile.reliability_score?.toFixed(1) || "5.0"}
              <Star className="w-4 h-4 text-primary fill-primary" />
            </p>
            <p className="text-sm text-muted-foreground">Reliability</p>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Your settings
          </h2>

          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {/* Radius */}
            <div className="p-4">
              {editingRadius ? (
                <div className="space-y-4">
                  <RadiusSlider value={tempRadius} onChange={setTempRadius} />
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingRadius(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="swaami" size="sm" onClick={handleSaveRadius}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setTempRadius(profile.radius);
                    setEditingRadius(true);
                  }}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">Radius</p>
                      <p className="text-sm text-muted-foreground">{profile.radius}m</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Availability */}
            <div className="p-4">
              {editingAvailability ? (
                <div className="space-y-4">
                  <AvailabilitySelector
                    value={tempAvailability}
                    onChange={setTempAvailability}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingAvailability(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="swaami"
                      size="sm"
                      onClick={handleSaveAvailability}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setTempAvailability(
                      (profile.availability as 'now' | 'later' | 'this-week') || 'now'
                    );
                    setEditingAvailability(true);
                  }}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">Availability</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {profile.availability?.replace("-", " ")}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide pt-2">
            Your skills
          </h2>

          {editingSkills ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => (
                  <SkillChip
                    key={skill.id}
                    skill={skill}
                    selected={tempSkills.includes(skill.id)}
                    onToggle={() => handleToggleSkill(skill.id)}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingSkills(false)}
                >
                  Cancel
                </Button>
                <Button variant="swaami" size="sm" onClick={handleSaveSkills}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {userSkills.length > 0 ? (
                userSkills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl text-sm"
                  >
                    <span>{skill.icon}</span>
                    <span className="text-foreground">{skill.label}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No skills added yet</p>
              )}
              <button
                onClick={() => {
                  setTempSkills(profile.skills || []);
                  setEditingSkills(true);
                }}
                className="px-3 py-2 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-muted-foreground transition-colors"
              >
                + Edit skills
              </button>
            </div>
          )}

          {/* Task History */}
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide pt-2">
            Activity
          </h2>
          <button className="w-full bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <History className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Task History</p>
                <p className="text-sm text-muted-foreground">
                  View your past tasks and help given
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Logout */}
        <div className="pt-8">
          <Button
            variant="ghost"
            size="lg"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={onLogout}
          >
            Log out
          </Button>
        </div>
      </main>
    </div>
  );
}
