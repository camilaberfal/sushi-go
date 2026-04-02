"use client";

import { useState } from "react";

import { Button, Card } from "@/components/ui";

type RoomCodeProps = {
  roomCode: string;
};

export function RoomCode({ roomCode }: RoomCodeProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-r from-card to-accent/20 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Código de sala</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="font-heading text-4xl text-primary">{roomCode}</p>
        <Button onClick={copyCode} size="sm" variant="outline">
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
    </Card>
  );
}
