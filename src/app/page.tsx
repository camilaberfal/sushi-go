"use client";

import Image from "next/image";
import { useState } from "react";

import { CreateRoomModal } from "@/components/landing/create-room-modal";
import { JoinRoomModal } from "@/components/landing/join-room-modal";
import { Button, Card } from "@/components/ui";

export default function Home() {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(255,107,95,0.25),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(72,199,195,0.25),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(255,210,103,0.3),transparent_40%)]" />

      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 text-center">
        <div className="rounded-3xl">
          <Image src="/sushigo-logo.png" alt="Sushi Go logo" width={360} height={120} priority />
        </div>

        <Card className="w-full max-w-2xl border-2 border-primary/20 bg-card/85 p-8 shadow-xl backdrop-blur">
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
            Partidas rápidas, simultáneas y caóticamente kawaii. Crea una sala o entra con código en segundos.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Button className="h-12 text-base" onClick={() => setCreateOpen(true)}>
              Crea una sala
            </Button>
            <Button className="h-12 text-base" onClick={() => setJoinOpen(true)} variant="secondary">
              Únete a una sala
            </Button>
          </div>
        </Card>
      </section>

      <CreateRoomModal open={createOpen} onOpenChange={setCreateOpen} />
      <JoinRoomModal open={joinOpen} onOpenChange={setJoinOpen} />
    </main>
  );
}
