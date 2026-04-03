import * as React from "react";

import { cn } from "@/lib/utils";

const badgeBaseClass =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors";

const badgeVariantClass = {
  default: "border-transparent bg-rose-500/20 text-rose-300",
  secondary: "border-transparent bg-cyan-500/20 text-cyan-300",
  outline: "border-white/20 text-white/70",
} as const;

type BadgeVariant = keyof typeof badgeVariantClass;

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <div className={cn(badgeBaseClass, badgeVariantClass[variant], className)} {...props} />;
}
