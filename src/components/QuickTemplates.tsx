import { Button } from "@/components/ui/button";

interface Template {
  id: string;
  emoji: string;
  label: string;
  text: string;
}

const TEMPLATES: Template[] = [
  {
    id: "groceries",
    emoji: "🛒",
    label: "Groceries",
    text: "Need help carrying groceries from my car to my apartment. About 4-5 bags, takes around 10 minutes.",
  },
  {
    id: "tech",
    emoji: "💻",
    label: "Tech help",
    text: "Need help setting up my phone/computer. Having trouble with [describe the issue].",
  },
  {
    id: "pets",
    emoji: "🐕",
    label: "Pet care",
    text: "Looking for someone to walk my dog for about 20-30 minutes. Friendly and well-behaved.",
  },
  {
    id: "pickup",
    emoji: "📦",
    label: "Pick up",
    text: "Need someone to pick up a package/item from a nearby location and bring it to me.",
  },
];

interface QuickTemplatesProps {
  onSelect: (text: string) => void;
}

export function QuickTemplates({ onSelect }: QuickTemplatesProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Quick start:</p>
      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((template) => (
          <Button
            key={template.id}
            variant="outline"
            size="sm"
            onClick={() => onSelect(template.text)}
            className="text-xs h-8 px-3 hover:bg-primary/10 hover:border-primary/30"
          >
            <span className="mr-1">{template.emoji}</span>
            {template.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
