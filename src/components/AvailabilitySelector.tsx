import { cn } from "@/lib/utils";

interface AvailabilitySelectorProps {
  value: 'now' | 'later' | 'this-week';
  onChange: (value: 'now' | 'later' | 'this-week') => void;
}

export function AvailabilitySelector({ value, onChange }: AvailabilitySelectorProps) {
  const options = [
    { id: 'now' as const, label: 'Now', sublabel: 'Available immediately' },
    { id: 'later' as const, label: 'Later', sublabel: 'Today or tomorrow' },
    { id: 'this-week' as const, label: 'This Week', sublabel: 'Flexible timing' },
  ];

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200",
            value === option.id
              ? "bg-primary border-primary"
              : "bg-background border-border hover:border-muted-foreground/50"
          )}
        >
          <div className="text-left">
            <div className={cn(
              "font-medium",
              value === option.id ? "text-primary-foreground" : "text-foreground"
            )}>
              {option.label}
            </div>
            <div className={cn(
              "text-sm",
              value === option.id ? "text-primary-foreground/80" : "text-muted-foreground"
            )}>
              {option.sublabel}
            </div>
          </div>
          <div
            className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
              value === option.id
                ? "border-primary-foreground bg-primary-foreground"
                : "border-muted-foreground/50"
            )}
          >
            {value === option.id && (
              <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
