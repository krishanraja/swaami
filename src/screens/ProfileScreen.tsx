import { Button } from "@/components/ui/button";
import { SKILLS } from "@/types/swaami";
import { Settings, Star, MapPin, Clock } from "lucide-react";
import swaamiLogo from "@/assets/swaami-logo.png";

interface ProfileScreenProps {
  onLogout: () => void;
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  // Mock user data
  const user = {
    credits: 12,
    radius: 500,
    skills: ['groceries', 'tech', 'pets'],
    availability: 'now' as const,
    tasksHelped: 7,
    tasksPosted: 3,
  };

  const userSkills = SKILLS.filter(s => user.skills.includes(s.id));

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="px-4 py-4 max-w-lg mx-auto flex items-center justify-between">
          <img src={swaamiLogo} alt="Swaami" className="h-8 w-auto" />
          <button className="p-2 hover:bg-muted rounded-xl transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Credits */}
        <div className="bg-primary rounded-2xl p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-foreground/80 mb-1">Your credits</p>
              <p className="text-4xl font-semibold text-primary-foreground">{user.credits}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-foreground/10 flex items-center justify-center">
              <Star className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 animate-fade-in" style={{ animationDelay: '50ms' }}>
            <p className="text-2xl font-semibold text-foreground">{user.tasksHelped}</p>
            <p className="text-sm text-muted-foreground">People helped</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <p className="text-2xl font-semibold text-foreground">{user.tasksPosted}</p>
            <p className="text-sm text-muted-foreground">Tasks posted</p>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Your settings
          </h2>

          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Radius</p>
                  <p className="text-sm text-muted-foreground">{user.radius}m</p>
                </div>
              </div>
              <button className="text-sm text-foreground font-medium hover:underline">
                Edit
              </button>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Availability</p>
                  <p className="text-sm text-muted-foreground capitalize">{user.availability}</p>
                </div>
              </div>
              <button className="text-sm text-foreground font-medium hover:underline">
                Edit
              </button>
            </div>
          </div>

          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide pt-2">
            Your skills
          </h2>

          <div className="flex flex-wrap gap-2">
            {userSkills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl text-sm"
              >
                <span>{skill.icon}</span>
                <span className="text-foreground">{skill.label}</span>
              </div>
            ))}
            <button className="px-3 py-2 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-muted-foreground transition-colors">
              + Add more
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
    </div>
  );
}
