import { ReactNode } from "react";
import swaamiIcon from "@/assets/swaami-icon.png";

interface AppHeaderProps {
  title?: string;
  actions?: ReactNode;
}

export function AppHeader({ title, actions }: AppHeaderProps) {
  return (
    <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
      <div className="px-4 py-4 max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={swaamiIcon} alt="Swaami" className="h-8 w-auto" />
          {title && (
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}
