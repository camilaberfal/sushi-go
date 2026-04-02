import { Avatar, AvatarFallback, Badge, Card } from "@/components/ui";

type HudPlayer = {
  id: string;
  handCount: number;
  puddings: number;
  score: number;
};

type PlayerHudProps = {
  round: number;
  turn: number;
  myHandCount: number;
  myPuddings: number;
  myScore: number;
  others: HudPlayer[];
};

export function PlayerHud({ round, turn, myHandCount, myPuddings, myScore, others }: PlayerHudProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <Card className="border-2 border-primary/30 bg-card/90 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-3xl text-primary">Ronda {round}/3</h2>
          <Badge variant="secondary">Turno {turn}</Badge>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-lg bg-muted/60 p-2">
            <p className="text-muted-foreground">Tus cartas</p>
            <p className="text-xl font-semibold">{myHandCount}</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-2">
            <p className="text-muted-foreground">Tus puntos</p>
            <p className="text-xl font-semibold">{myScore}</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-2">
            <p className="text-muted-foreground">Tus pudines</p>
            <p className="text-xl font-semibold">{myPuddings}</p>
          </div>
        </div>
      </Card>

      <Card className="border-2 border-secondary/30 bg-card/90 p-4">
        <h3 className="font-heading text-xl text-secondary">Mesa rival</h3>
        <div className="mt-2 space-y-2 text-sm">
          {others.length === 0 ? <p className="text-muted-foreground">Sin rivales visibles.</p> : null}
          {others.map((player) => (
            <div className="flex items-center justify-between rounded-lg bg-muted/60 p-2" key={player.id}>
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7 border border-border/70">
                  <AvatarFallback className="text-[10px] font-semibold">{player.id.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-semibold">{player.id.slice(0, 6)}</span>
              </div>
              <span>C:{player.handCount}</span>
              <span>P:{player.score}</span>
              <span>Pu:{player.puddings}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
