import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerFooter 
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { TrustBadge } from "@/components/trust/TrustBadge";
import { 
  Shield, 
  ShieldCheck, 
  Star, 
  Calendar, 
  CheckCircle2, 
  MapPin,
  Sparkles,
  HandHeart,
  Clock,
  Users
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { TrustTier } from "@/hooks/useTrustTier";

interface PersonOwner {
  display_name: string | null;
  tasks_completed?: number;
  reliability_score?: number;
  trust_tier?: string;
  is_demo?: boolean;
  photo_url?: string | null;
  skills?: string[];
  member_since?: string;
  neighbourhood?: string | null;
}

interface PersonDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: PersonOwner | null;
  taskTitle?: string;
  taskCategory?: string;
  onHelp?: () => void;
  isDemo?: boolean;
}

const TRUST_TIER_INFO: Record<string, { 
  title: string; 
  description: string; 
  color: string;
  bgColor: string;
  points: string[];
}> = {
  tier_0: {
    title: "New Neighbour",
    description: "Just joined the community",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    points: [
      "Recently signed up",
      "Building their reputation",
      "Getting started"
    ]
  },
  tier_1: {
    title: "Verified Neighbour",
    description: "Identity confirmed",
    color: "text-primary",
    bgColor: "bg-primary/10",
    points: [
      "Phone number verified",
      "Social account connected",
      "Email confirmed"
    ]
  },
  tier_2: {
    title: "Trusted Neighbour",
    description: "Fully verified community member",
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    points: [
      "All identity checks complete",
      "Endorsed by other members",
      "2-factor authentication enabled",
      "Photos verified"
    ]
  }
};

export function PersonDetailsDrawer({ 
  open, 
  onOpenChange, 
  owner, 
  taskTitle,
  taskCategory,
  onHelp,
  isDemo = false
}: PersonDetailsDrawerProps) {
  if (!owner) return null;

  const trustTier = (owner.trust_tier || "tier_0") as TrustTier;
  const tierInfo = TRUST_TIER_INFO[trustTier] || TRUST_TIER_INFO.tier_0;
  const tasksCompleted = owner.tasks_completed ?? 0;
  const reliabilityScore = owner.reliability_score ?? 5.0;
  const displayName = owner.display_name || "Neighbour";
  const firstName = displayName.split(" ")[0];
  
  // Calculate member duration
  const memberSince = owner.member_since 
    ? formatDistanceToNow(new Date(owner.member_since), { addSuffix: false })
    : null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90dvh]">
        <div className="mx-auto w-full max-w-lg overflow-y-auto">
          <DrawerHeader className="text-left pb-2">
            <div className="flex items-start gap-4">
              {/* Profile Photo */}
              <div className="relative flex-shrink-0">
                {owner.photo_url ? (
                  <img 
                    src={owner.photo_url} 
                    alt={displayName} 
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-background shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-2xl font-bold text-primary border-2 border-background shadow-lg">
                    {displayName[0]?.toUpperCase() || "?"}
                  </div>
                )}
                {/* Trust badge overlay */}
                <div className="absolute -bottom-1 -right-1">
                  <TrustBadge tier={trustTier} size="md" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <DrawerTitle className="text-xl font-bold text-foreground">
                  {displayName}
                </DrawerTitle>
                <DrawerDescription className="mt-1">
                  <span className={`inline-flex items-center gap-1.5 font-medium ${tierInfo.color}`}>
                    {trustTier === "tier_2" ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : trustTier === "tier_1" ? (
                      <Shield className="w-4 h-4" />
                    ) : null}
                    {tierInfo.title}
                  </span>
                </DrawerDescription>
                
                {/* Quick stats row */}
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  {tasksCompleted > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                      {reliabilityScore.toFixed(1)}
                    </span>
                  )}
                  {memberSince && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {memberSince}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-4">
            {/* Trust explanation card */}
            <div className={`rounded-xl p-4 ${tierInfo.bgColor}`}>
              <h4 className={`font-semibold text-sm mb-2 ${tierInfo.color}`}>
                Why you can trust {firstName}
              </h4>
              <ul className="space-y-1.5">
                {tierInfo.points.map((point, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${tierInfo.color}`} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {tasksCompleted}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <HandHeart className="w-3 h-3" />
                  Tasks helped
                </div>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
                  <Star className="w-5 h-5 fill-primary text-primary" />
                  {reliabilityScore.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Reliability score
                </div>
              </div>
            </div>

            {/* Skills section */}
            {owner.skills && owner.skills.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {firstName}'s skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {owner.skills.map((skill) => (
                    <span 
                      key={skill}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        taskCategory?.toLowerCase() === skill.toLowerCase()
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Neighbourhood */}
            {owner.neighbourhood && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>From {owner.neighbourhood}</span>
              </div>
            )}

            {/* Community message */}
            <div className="bg-accent/10 rounded-xl p-4 text-center">
              <p className="text-sm text-foreground/80">
                {tasksCompleted > 5 ? (
                  <>
                    <span className="font-medium">{firstName}</span> is an active member who has helped many neighbours. 
                    You're in good hands! 🌟
                  </>
                ) : tasksCompleted > 0 ? (
                  <>
                    <span className="font-medium">{firstName}</span> is building their reputation 
                    in the community. Every helper starts somewhere! 👋
                  </>
                ) : (
                  <>
                    <span className="font-medium">{firstName}</span> is new to the neighbourhood. 
                    Welcome them with a helping hand! 🏠
                  </>
                )}
              </p>
            </div>
          </div>

          <DrawerFooter className="pt-2">
            {taskTitle && (
              <p className="text-center text-sm text-muted-foreground mb-2">
                Help {firstName} with "<span className="font-medium">{taskTitle}</span>"
              </p>
            )}
            <Button 
              variant={isDemo ? "outline" : "swaami"} 
              size="xl"
              onClick={() => {
                onHelp?.();
                onOpenChange(false);
              }}
              className="w-full"
            >
              <HandHeart className="w-5 h-5 mr-2" />
              {isDemo ? "This is a Sample" : `Help ${firstName}`}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Maybe later
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
