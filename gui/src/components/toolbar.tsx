import { PropsWithChildren } from "react";
import { Button } from "./ui/button";
import { LucideIcon } from "lucide-react";

export function Toolbar({ children }: PropsWithChildren) {
  return <div className="flex gap-1 p-2">{children}</div>;
}

export function ToolbarButton({
  text,
  icon: Icon,
  shortcut,
  onClick,
  primary,
}: {
  text: string;
  icon?: LucideIcon;
  shortcut?: string;
  onClick?: () => void;
  primary?: boolean;
}) {
  return (
    <Button variant={primary ? "default" : "ghost"} size="sm" onClick={onClick}>
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {text}
      {shortcut && (
        <span className="text-xs ml-2 px-2 bg-secondary py-1 rounded">
          {shortcut}
        </span>
      )}
    </Button>
  );
}
