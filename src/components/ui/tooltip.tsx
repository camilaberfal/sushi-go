import * as React from "react";

import { cn } from "@/lib/utils";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("group relative inline-flex", className)} {...props} />;
}

export function TooltipTrigger({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex", className)} {...props} />;
}

export function TooltipContent({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs text-background group-hover:block",
        className
      )}
      {...props}
    />
  );
}
