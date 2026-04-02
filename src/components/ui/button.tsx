import * as React from "react";

import { cn } from "@/lib/utils";

const buttonBaseClass =
  "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

const buttonVariantClass = {
  default: "bg-primary text-primary-foreground hover:brightness-95",
  secondary: "bg-secondary text-secondary-foreground hover:brightness-95",
  ghost: "bg-transparent hover:bg-muted text-foreground",
  outline: "border border-border bg-card text-card-foreground hover:bg-muted",
  destructive: "bg-destructive text-destructive-foreground hover:brightness-95",
} as const;

const buttonSizeClass = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3",
  lg: "h-11 px-6",
  icon: "h-10 w-10",
} as const;

type ButtonVariant = keyof typeof buttonVariantClass;
type ButtonSize = keyof typeof buttonSizeClass;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ className, variant = "default", size = "default", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonBaseClass, buttonVariantClass[variant], buttonSizeClass[size], className)}
      {...props}
    />
  );
}
