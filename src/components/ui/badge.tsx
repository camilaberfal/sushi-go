import * as React from "react";

import { cn } from "@/lib/utils";

const badgeBaseClass =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors";

const badgeVariantClass = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "border-border text-foreground",
} as const;

type BadgeVariant = keyof typeof badgeVariantClass;

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <div className={cn(badgeBaseClass, badgeVariantClass[variant], className)} {...props} />;
}
