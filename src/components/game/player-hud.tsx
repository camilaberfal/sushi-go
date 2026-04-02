import { AnimatePresence, motion } from "framer-motion";

import { Avatar, AvatarFallback, Badge, Card } from "@/components/ui";
import { CARD_BACK_ASSET } from "@/components/game/card-art";

type HudPlayer = {
  id: string;
  handCount: number;
  puddings: number;
  score: number;
};

type PlayerHudProps = {
  round: number;
  totalRounds: number;
  turn: number;
  myHandCount: number;
  myPuddings: number;
  myScore: number;
  others: HudPlayer[];
};

export function PlayerHud({ round, totalRounds, turn, myHandCount, myPuddings, myScore, others }: PlayerHudProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <Card className="border-2 border-primary/30 bg-card/90 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-4xl text-primary">Ronda {round}/{totalRounds}</h2>
          <Badge className="text-sm" variant="secondary">Turno {turn}</Badge>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-base">
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-sm text-muted-foreground">Tus cartas</p>
            <p className="text-2xl font-semibold">{myHandCount}</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-sm text-muted-foreground">Tus puntos</p>
            <p className="text-2xl font-semibold">{myScore}</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-sm text-muted-foreground">Tus pudines</p>
            <p className="text-2xl font-semibold">{myPuddings}</p>
          </div>
        </div>
      </Card>

      <Card className="border-2 border-secondary/30 bg-card/90 p-4">
        <h3 className="font-heading text-2xl text-secondary">Manos rivales</h3>
        <div className="mt-2 space-y-2 text-base">
          {others.length === 0 ? <p className="text-muted-foreground">Sin rivales visibles.</p> : null}
          {others.map((player) => (
            <div className="rounded-lg bg-muted/60 p-3" key={player.id}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border border-border/70">
                    <AvatarFallback className="text-xs font-semibold">{player.id.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold">{player.id.slice(0, 6)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span>C:{player.handCount}</span>
                  <span>P:{player.score}</span>
                  <span>Pu:{player.puddings}</span>
                </div>
              </div>

              <div className="flex min-h-16 flex-wrap items-end gap-1.5">
                <AnimatePresence initial={false}>
                  {Array.from({ length: player.handCount }, (_, index) => (
                    <motion.img
                      key={`${player.id}-card-back-${index}`}
                      alt="Carta oculta"
                      className="h-14 w-10 rounded border border-border/80 object-cover"
                      src={CARD_BACK_ASSET}
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
