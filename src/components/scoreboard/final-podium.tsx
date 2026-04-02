import { Badge, Card } from "@/components/ui";

type PodiumPlayer = {
  playerId: string;
  displayName: string;
  finalScore: number;
  puddings: number;
};

type FinalPodiumProps = {
  players: PodiumPlayer[];
};

function medalForIndex(index: number): string {
  if (index === 0) return "oro";
  if (index === 1) return "plata";
  if (index === 2) return "bronce";
  return "finalista";
}

export function FinalPodium({ players }: FinalPodiumProps) {
  if (players.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Todavia no hay puntuaciones finales.</p>
      </Card>
    );
  }

  const ranked = [...players].sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    return b.puddings - a.puddings;
  });

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {ranked.slice(0, 3).map((player, index) => (
        <Card className="border-2 border-border/80 p-4" key={player.playerId}>
          <p className="font-heading text-2xl">#{index + 1}</p>
          <p className="mt-1 text-lg font-semibold">{player.displayName}</p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <Badge variant="secondary">{medalForIndex(index)}</Badge>
            <Badge>{player.finalScore} pts</Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Pudines: {player.puddings}</p>
        </Card>
      ))}
    </div>
  );
}
