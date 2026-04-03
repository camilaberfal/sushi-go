import * as React from "react";
import { playSfx } from "@/lib/audio";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = "text", onFocus, ...props }: InputProps) {
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    playSfx("hover");
    onFocus?.(e);
  };

  return (
    <input
      type={type}
      onFocus={handleFocus}
      className={cn(
        "h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none ring-offset-background transition-all focus-visible:bg-black/50 focus-visible:border-white/30 focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
