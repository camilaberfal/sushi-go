"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type AccordionContextValue = {
  value: string | null;
  setValue: (next: string | null) => void;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) {
    throw new Error("Accordion components must be used within Accordion.");
  }
  return ctx;
}

export function Accordion({
  defaultValue,
  className,
  children,
}: {
  defaultValue?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [value, setValue] = React.useState<string | null>(defaultValue ?? null);

  return (
    <AccordionContext.Provider value={{ value, setValue }}>
      <div className={cn("space-y-2", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card", className)} data-accordion-item-value={value}>
      {children}
    </div>
  );
}

export function AccordionTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const { value: activeValue, setValue } = useAccordionContext();
  const open = activeValue === value;

  return (
    <button
      type="button"
      className={cn("flex w-full items-center justify-between px-4 py-3 text-left font-medium", className)}
      onClick={() => setValue(open ? null : value)}
      aria-expanded={open}
    >
      {children}
      <span className="text-xs text-muted-foreground">{open ? "Ocultar" : "Ver"}</span>
    </button>
  );
}

export function AccordionContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const { value: activeValue } = useAccordionContext();
  if (activeValue !== value) return null;

  return <div className={cn("border-t border-border px-4 py-3", className)}>{children}</div>;
}
