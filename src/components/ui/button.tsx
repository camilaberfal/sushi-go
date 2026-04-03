import * as React from "react";

import { playSfx } from "@/lib/audio";
import { cn } from "@/lib/utils";

const buttonBaseClass =
  "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

const buttonVariantClass = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(225,29,72,0.3)]",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]",
  ghost: "bg-transparent hover:bg-white/10 text-foreground",
  outline: "border border-white/20 bg-black/20 text-foreground hover:bg-white/10",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]",
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
  asChild?: boolean;
};

export function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  asChild = false,
  children,
  onClick,
  onMouseEnter,
  ...props
}: ButtonProps) {
  const mergedClassName = cn(buttonBaseClass, buttonVariantClass[variant], buttonSizeClass[size], className);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!props.disabled) playSfx("select");
    onClick?.(e);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!props.disabled) playSfx("hover");
    onMouseEnter?.(e);
  };

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, {
      className: cn(mergedClassName, child.props.className),
      onClick: (e: any) => {
        handleClick(e);
        child.props.onClick?.(e);
      },
      onMouseEnter: (e: any) => {
        handleMouseEnter(e);
        child.props.onMouseEnter?.(e);
      }
    });
  }

  return (
    <button
      type={type}
      className={mergedClassName}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </button>
  );
}
