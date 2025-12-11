import { cn } from "@/lib/utils";
import type { Skill } from "@/types/swaami";

interface SkillChipProps {
  skill: Skill;
  selected: boolean;
  onToggle: () => void;
}

export function SkillChip({ skill, selected, onToggle }: SkillChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200",
        "text-sm font-medium",
        selected
          ? "bg-primary border-primary text-primary-foreground"
          : "bg-background border-border text-foreground hover:border-muted-foreground/50"
      )}
    >
      <span>{skill.icon}</span>
      <span>{skill.label}</span>
    </button>
  );
}
