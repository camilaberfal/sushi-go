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
      <Card className="border border-white/15 bg-[#130915]/90 p-4 text-white">
        <p className="text-base text-white/70">Todavia no hay puntuaciones finales.</p>
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
        <Card className="border border-white/15 bg-[#130915]/90 p-4 text-white shadow-[0_20px_40px_rgba(0,0,0,0.55)]" key={player.playerId}>
          <p className="font-heading text-3xl text-[#fbbf24]">#{index + 1}</p>
          <p className="mt-1 text-xl font-semibold text-white">{player.displayName}</p>
          <div className="mt-3 flex items-center justify-between text-base">
            <Badge className="border-white/20 bg-black/35 text-cyan-200" variant="secondary">{medalForIndex(index)}</Badge>
            <Badge className="bg-gradient-to-b from-[#22c55e] to-[#14532d] text-white">{player.finalScore} pts</Badge>
          </div>
          <p className="mt-2 text-sm text-white/70">Pudines: {player.puddings}</p>
        </Card>
      ))}
    </div>
  );
}
