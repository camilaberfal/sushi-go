import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Card, ScrollArea } from "@/components/ui";

type RoundPlayer = {
  playerId: string;
  displayName: string;
  points: number;
  byCategory: Record<string, number>;
};

type RoundBreakdownEntry = {
  round: number;
  players: RoundPlayer[];
};

type RoundBreakdownProps = {
  rounds: RoundBreakdownEntry[];
};

export function RoundBreakdown({ rounds }: RoundBreakdownProps) {
  if (rounds.length === 0) {
    return (
      <Card className="border border-white/15 bg-[#130915]/90 p-4 text-white">
        <p className="text-base text-white/70">No hay resumen de rondas disponible todavía.</p>
      </Card>
    );
  }

  return (
    <Accordion defaultValue={`round-${rounds[0]?.round ?? 1}`}>
      {rounds.map((round) => (
        <AccordionItem key={round.round} value={`round-${round.round}`}>
          <AccordionTrigger value={`round-${round.round}`}>
            <div className="flex w-full items-center justify-between pr-4">
              <span className="font-heading text-2xl">Ronda {round.round}</span>
              <Badge variant="secondary">{round.players.length} jugadores</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent value={`round-${round.round}`}>
            <ScrollArea className="max-h-72 pr-1">
              <div className="space-y-2">
                {round.players.map((player) => (
                  <Card className="border border-white/15 bg-[#130915]/90 p-3 text-white" key={`${round.round}-${player.playerId}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">{player.displayName}</p>
                      <Badge className="bg-gradient-to-b from-[#22c55e] to-[#14532d] text-white">{player.points} pts</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-white/70">
                      {Object.entries(player.byCategory).map(([category, value]) => (
                        <span className="rounded-md border border-white/15 bg-black/35 px-2 py-1" key={`${player.playerId}-${category}`}>
                          {category}: {value}
                        </span>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
