import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { SKILLS } from "@/types/swaami";
import { Settings, Star, MapPin, Clock, History, ChevronRight, Sparkles, CreditCard, Flame, FileText, Globe, AlertTriangle, HelpCircle, BookOpen } from "lucide-react";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useGamification } from "@/hooks/useGamification";
import { useTasks } from "@/hooks/useTasks";
import { RadiusSlider } from "@/components/RadiusSlider";
import { AvailabilitySelector } from "@/components/AvailabilitySelector";
import { SkillChip } from "@/components/SkillChip";
import { SwaamiPlusBadge } from "@/components/SwaamiPlusBadge";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { TierProgress } from "@/components/TierProgress";
import { NeedCard } from "@/components/NeedCard";
import { CitySelector } from "@/components/onboarding/CitySelector";
import { NeighbourhoodSelector } from "@/components/onboarding/NeighbourhoodSelector";
import { CITY_CONFIG, type City } from "@/hooks/useNeighbourhoods";
import { toast } from "sonner";

interface ProfileScreenProps {
  onLogout: () => void;
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const { myTasks, cancelTask } = useTasks();
  const { plan, subscribed, subscriptionEnd, startCheckout, openCustomerPortal, loading: subLoading } = useSubscription();
  const { streakDays, credits, tier, tasksCompleted } = useGamification();
  
  const settingsRef = useRef<HTMLDivElement>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [editingRadius, setEditingRadius] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [tempRadius, setTempRadius] = useState(profile?.radius || 500);
  const [tempAvailability, setTempAvailability] = useState<'now' | 'later' | 'this-week'>(
    (profile?.availability as 'now' | 'later' | 'this-week') || 'now'
  );
  const [tempSkills, setTempSkills] = useState<string[]>(profile?.skills || []);
  const [tempCity, setTempCity] = useState<City | null>((profile?.city as City) || null);
  const [tempNeighbourhood, setTempNeighbourhood] = useState(profile?.neighbourhood || "");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // Check for incomplete profile fields
  const incompleteFields = useMemo(() => {
    if (!profile) return [];
    const missing: string[] = [];
    if (!profile.city) missing.push("city");
    if (!profile.neighbourhood) missing.push("neighbourhood");
    if (!profile.phone) missing.push("phone");
    if (!profile.skills || profile.skills.length === 0) missing.push("skills");
    return missing;
  }, [profile]);

  const hasIncompleteProfile = incompleteFields.length > 0;

  // Fetch profile photo
  useEffect(() => {
    const fetchPhoto = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('user_photos')
        .select('photo_url')
        .eq('user_id', user.id)
        .eq('photo_type', 'profile')
        .maybeSingle();
      
      if (data?.photo_url) {
        setProfilePhotoUrl(data.photo_url);
      }
    };
    fetchPhoto();
  }, [user]);

  const scrollToSettings = () => {
    settingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Sync temp values when profile loads
  useEffect(() => {
    if (profile) {
      setTempCity((profile.city as City) || null);
      setTempNeighbourhood(profile.neighbourhood || "");
    }
  }, [profile]);

  const userSkills = SKILLS.filter((s) => profile?.skills?.includes(s.id));
  const isPremium = plan === "swaami_plus";

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

  const handleSaveLocation = async () => {
    if (!tempCity || !tempNeighbourhood) {
      toast.error("Please select both city and suburb");
      return;
    }
    const { error } = await updateProfile({ city: tempCity, neighbourhood: tempNeighbourhood });
    if (error) {
      toast.error("Couldn't update location");
    } else {
      toast.success("Location updated!");
      setEditingLocation(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      await startCheckout();
    } catch (err) {
      toast.error("Couldn't start checkout");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (err) {
      toast.error("Couldn't open subscription management");
    }
  };

  const formatIncompleteFields = (fields: string[]) => {
    const labels: Record<string, string> = {
      city: "city",
      neighbourhood: "neighbourhood", 
      phone: "phone number",
      skills: "skills"
    };
    const formatted = fields.map(f => labels[f] || f);
    if (formatted.length === 1) return formatted[0];
    if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`;
    return `${formatted.slice(0, -1).join(", ")}, and ${formatted[formatted.length - 1]}`;
  };

  const [timeoutError, setTimeoutError] = useState(false);

  // Add timeout for loading state
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        if (loading) {
          setTimeoutError(true);
        }
      }, 10000); // 10 second timeout

      return () => {
        clearTimeout(timeout);
        setTimeoutError(false);
      };
    }
  }, [loading]);

  if (loading && !timeoutError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  if (timeoutError || (!loading && !profile)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">
            Failed to load profile
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            {timeoutError ? 'Request timed out. Please try again.' : 'Something went wrong.'}
          </p>
          <Button onClick={() => window.location.reload()} variant="swaami">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-background flex flex-col">
      <AppHeader
        actions={
          <button 
            onClick={scrollToSettings}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 max-w-lg mx-auto w-full">
        {/* Incomplete Profile Alert */}
        {hasIncompleteProfile && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">
                  Complete your profile
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300/80 mt-1">
                  Add your {formatIncompleteFields(incompleteFields)} to help neighbours find you.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-amber-700 dark:text-amber-300 hover:text-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 p-0 h-auto"
                  onClick={scrollToSettings}
                >
                  Go to settings
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* User Info with Photo Upload */}
        <div className="flex items-center gap-4 mb-6">
          <ProfilePhotoUpload 
            existingPhotoUrl={profilePhotoUrl} 
            onPhotoChange={setProfilePhotoUrl} 
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">
                {profile.display_name || "Neighbour"}
              </h2>
              {isPremium && <SwaamiPlusBadge />}
            </div>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Swaami+ Card */}
        {isPremium ? (
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 mb-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">Swaami+</span>
              </div>
              <span className="text-sm opacity-80">Active</span>
            </div>
            <p className="text-sm opacity-90 mb-3">
              Unlimited posts • 2km radius • Priority matching
            </p>
            {subscriptionEnd && (
              <p className="text-xs opacity-70">
                Renews {new Date(subscriptionEnd).toLocaleDateString()}
              </p>
            )}
            <Button 
              variant="secondary" 
              size="sm" 
              className="mt-3 bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={handleManageSubscription}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Manage subscription
            </Button>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-foreground">Upgrade to Swaami+</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Unlimited posts, 2km radius, and priority matching
            </p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-foreground">$2<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
              <Button 
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={handleUpgrade}
                disabled={upgradeLoading}
              >
                {upgradeLoading ? "Loading..." : "Upgrade"}
              </Button>
            </div>
          </div>
        )}

        {/* Tier Progress */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6 animate-fade-in">
          <TierProgress showBadge={true} />
        </div>

        {/* Credits & Streak */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-primary rounded-2xl p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-6 h-6 text-primary-foreground/80" />
            </div>
            <p className="text-3xl font-bold text-primary-foreground">
              {credits}
            </p>
            <p className="text-xs text-primary-foreground/70">Credits</p>
          </div>
          <div 
            className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 animate-fade-in"
            style={{ animationDelay: "50ms" }}
          >
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-6 h-6 text-white/80 fill-white/80" />
            </div>
            <p className="text-3xl font-bold text-white">
              {streakDays}
            </p>
            <p className="text-xs text-white/70">Day streak</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div
            className="bg-card border border-border rounded-xl p-4 animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            <p className="text-2xl font-semibold text-foreground">
              {tasksCompleted}
            </p>
            <p className="text-sm text-muted-foreground">People helped</p>
          </div>
          <div
            className="bg-card border border-border rounded-xl p-4 animate-fade-in"
            style={{ animationDelay: "150ms" }}
          >
            <p className="text-2xl font-semibold text-foreground flex items-center gap-1">
              {profile.reliability_score?.toFixed(1) || "5.0"}
              <Star className="w-4 h-4 text-primary fill-primary" />
            </p>
            <p className="text-sm text-muted-foreground">Reliability</p>
          </div>
        </div>

        {/* Settings */}
        <div ref={settingsRef} className="space-y-4 scroll-mt-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Your settings
          </h2>

          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {/* Location */}
            <div className={`p-4 ${incompleteFields.includes('city') || incompleteFields.includes('neighbourhood') ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
              {editingLocation ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">City</label>
                    <CitySelector
                      value={tempCity}
                      onChange={(city) => {
                        setTempCity(city);
                        setTempNeighbourhood(""); // Reset neighbourhood when city changes
                      }}
                    />
                  </div>
                  {tempCity && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground">Suburb</label>
                      <NeighbourhoodSelector
                        city={tempCity}
                        value={tempNeighbourhood}
                        onChange={setTempNeighbourhood}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingLocation(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="swaami" size="sm" onClick={handleSaveLocation}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setTempCity((profile.city as City) || null);
                    setTempNeighbourhood(profile.neighbourhood || "");
                    setEditingLocation(true);
                  }}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      incompleteFields.includes('city') || incompleteFields.includes('neighbourhood') 
                        ? 'bg-amber-100 dark:bg-amber-900/50' 
                        : 'bg-muted'
                    }`}>
                      <Globe className={`w-5 h-5 ${
                        incompleteFields.includes('city') || incompleteFields.includes('neighbourhood')
                          ? 'text-amber-600 dark:text-amber-500'
                          : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">Location</p>
                      <p className={`text-sm ${
                        incompleteFields.includes('city') || incompleteFields.includes('neighbourhood')
                          ? 'text-amber-600 dark:text-amber-500'
                          : 'text-muted-foreground'
                      }`}>
                        {profile.neighbourhood && profile.city
                          ? `${profile.neighbourhood}, ${CITY_CONFIG[profile.city as City]?.label || profile.city}`
                          : "Required"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Radius */}
            <div className="p-4">
              {editingRadius ? (
                <div className="space-y-4">
                  <RadiusSlider 
                    value={tempRadius} 
                    onChange={setTempRadius}
                    isPremium={isPremium}
                    onUpgradeClick={() => setShowUpgrade(true)}
                  />
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
            <div className={`flex flex-wrap gap-2 ${incompleteFields.includes('skills') ? 'p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800' : ''}`}>
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
                <p className={`text-sm ${incompleteFields.includes('skills') ? 'text-amber-600 dark:text-amber-500' : 'text-muted-foreground'}`}>
                  {incompleteFields.includes('skills') ? 'Required: Add at least one skill' : 'No skills added yet'}
                </p>
              )}
              <button
                onClick={() => {
                  setTempSkills(profile.skills || []);
                  setEditingSkills(true);
                }}
                className={`px-3 py-2 border border-dashed rounded-xl text-sm transition-colors ${
                  incompleteFields.includes('skills')
                    ? 'border-amber-400 dark:border-amber-600 text-amber-600 dark:text-amber-500 hover:border-amber-500'
                    : 'border-border text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                + Edit skills
              </button>
            </div>
          )}

          {/* My Requests Section */}
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide pt-2">
            My Requests
          </h2>
          {myTasks.length > 0 ? (
            <div className="space-y-3">
              {myTasks.map((task) => (
                <NeedCard
                  key={task.id}
                  task={{
                    ...task,
                    timeEstimate: task.time_estimate || "~15 mins",
                  }}
                  isOwner={true}
                  onCancel={async (taskId) => {
                    const { error } = await cancelTask(taskId);
                    if (error) {
                      toast.error("Couldn't cancel request");
                    } else {
                      toast.success("Request cancelled");
                    }
                  }}
                  onView={(taskId) => {
                    // Navigate to chat if matched, otherwise just show info
                    toast.info("Viewing task details coming soon");
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">No active requests</p>
                  <p className="text-sm text-muted-foreground">
                    Your help requests will appear here
                  </p>
                </div>
              </div>
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

        {/* Help & Support */}
        <div className="space-y-2 pt-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Help & Support
          </h2>
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            <button 
              onClick={() => navigate('/faq')}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="font-medium text-foreground">Help Center & FAQ</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button 
              onClick={() => navigate('/blog')}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="font-medium text-foreground">Community Blog</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
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

      <UpgradePrompt
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        trigger="radius"
      />
    </div>
  );
}
