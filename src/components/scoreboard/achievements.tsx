import { Card } from "@/components/ui";

type AchievementEntry = {
  title: string;
  detail: string;
};

type AchievementsProps = {
  highlights: Record<string, unknown>;
};

function toEntries(highlights: Record<string, unknown>): AchievementEntry[] {
  const entries: AchievementEntry[] = [];

  const mostPlayedCard = typeof highlights.mostPlayedCard === "string" ? highlights.mostPlayedCard : null;
  if (mostPlayedCard) {
    entries.push({ title: "Carta mas jugada", detail: mostPlayedCard });
  }

  const fastestPlayer = typeof highlights.fastestPlayer === "string" ? highlights.fastestPlayer : null;
  if (fastestPlayer) {
    entries.push({ title: "Jugador mas veloz", detail: fastestPlayer });
  }

  const bestCard = typeof highlights.bestCardEfficiency === "string" ? highlights.bestCardEfficiency : null;
  if (bestCard) {
    entries.push({ title: "Carta mas rentable", detail: bestCard });
  }

  return entries;
}

export function Achievements({ highlights }: AchievementsProps) {
  const entries = toEntries(highlights);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {entries.length === 0 ? (
        <Card className="md:col-span-3 border border-white/15 bg-[#130915]/90 p-4 text-sm text-white/70">No hay logros narrativos disponibles aun.</Card>
      ) : (
        entries.map((entry) => (
          <Card className="border border-white/15 bg-[#130915]/90 p-4 text-white shadow-[0_20px_35px_rgba(0,0,0,0.45)]" key={entry.title}>
            <p className="font-heading text-xl text-cyan-200">{entry.title}</p>
            <p className="mt-2 text-sm text-white/75">{entry.detail}</p>
          </Card>
        ))
      )}
    </div>
  );
}
