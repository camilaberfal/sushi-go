import * as React from "react";

import { cn } from "@/lib/utils";

export function ToastViewport({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2", className)} {...props} />;
}

export function Toast({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-border bg-card p-4 text-card-foreground shadow-md", className)}
      role="status"
      {...props}
    />
  );
}

export function ToastTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h4 className={cn("text-sm font-semibold", className)} {...props} />;
}

export function ToastDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function ToastAction({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn("mt-2 inline-flex h-8 items-center rounded-md border border-border px-3 text-xs", className)}
      type={props.type ?? "button"}
      {...props}
    />
  );
}

export function ToastClose({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-label="Cerrar"
      className={cn("absolute right-2 top-2 rounded p-1 text-muted-foreground", className)}
      type={props.type ?? "button"}
      {...props}
    />
  );
}

export function Toaster() {
  return <ToastViewport aria-live="polite" aria-relevant="additions text" />;
}
