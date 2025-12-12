import { useAccessibility } from "@/contexts/AccessibilityContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Type, Sun, Sparkles } from "lucide-react";

export function AccessibilitySettings() {
  const { settings, toggleLargeText, toggleHighContrast, toggleSimpleMode } = useAccessibility();

  return (
    <div className="space-y-6 p-4 bg-card border border-border rounded-xl">
      <h3 className="text-lg font-semibold text-foreground">Accessibility</h3>
      
      <div className="space-y-4">
        {/* Large Text Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Type className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <Label htmlFor="large-text" className="text-base font-medium cursor-pointer">
                Large Text
              </Label>
              <p className="text-sm text-muted-foreground">
                Makes all text bigger
              </p>
            </div>
          </div>
          <Switch
            id="large-text"
            checked={settings.largeText}
            onCheckedChange={toggleLargeText}
            className="scale-125"
          />
        </div>

        {/* High Contrast Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Sun className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <Label htmlFor="high-contrast" className="text-base font-medium cursor-pointer">
                High Contrast
              </Label>
              <p className="text-sm text-muted-foreground">
                Stronger colors, easier to see
              </p>
            </div>
          </div>
          <Switch
            id="high-contrast"
            checked={settings.highContrast}
            onCheckedChange={toggleHighContrast}
            className="scale-125"
          />
        </div>

        {/* Simple Mode Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <Label htmlFor="simple-mode" className="text-base font-medium cursor-pointer">
                Simple Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Less clutter, just the basics
              </p>
            </div>
          </div>
          <Switch
            id="simple-mode"
            checked={settings.simpleMode}
            onCheckedChange={toggleSimpleMode}
            className="scale-125"
          />
        </div>
      </div>
    </div>
  );
}
