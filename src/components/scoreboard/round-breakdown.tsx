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
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">No hay resumen de rondas disponible todavía.</p>
      </Card>
    );
  }

  return (
    <Accordion defaultValue={`round-${rounds[0]?.round ?? 1}`}>
      {rounds.map((round) => (
        <AccordionItem key={round.round} value={`round-${round.round}`}>
          <AccordionTrigger value={`round-${round.round}`}>
            <div className="flex w-full items-center justify-between pr-4">
              <span className="font-heading text-xl">Ronda {round.round}</span>
              <Badge variant="secondary">{round.players.length} jugadores</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent value={`round-${round.round}`}>
            <ScrollArea className="max-h-72 pr-1">
              <div className="space-y-2">
                {round.players.map((player) => (
                  <Card className="border border-border/80 p-3" key={`${round.round}-${player.playerId}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{player.displayName}</p>
                      <Badge>{player.points} pts</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {Object.entries(player.byCategory).map(([category, value]) => (
                        <span className="rounded-md bg-muted/60 px-2 py-1" key={`${player.playerId}-${category}`}>
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
