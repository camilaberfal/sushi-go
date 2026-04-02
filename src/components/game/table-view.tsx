import { Avatar, AvatarFallback, Card, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui";
import { CARD_BACK_ASSET, getCardAssetFromId } from "@/components/game/card-art";

type TablePlayer = {
  id: string;
  playedCards: string[];
  handCount: number;
};

type TableViewProps = {
  players: TablePlayer[];
};

export function TableView({ players }: TableViewProps) {
  return (
    <TooltipProvider>
      <Card className="border-2 border-border/70 bg-card/80 p-4">
        <h3 className="font-heading text-2xl text-foreground">Mesa</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {players.map((player) => {
            const playedCards = player.playedCards;
            return (
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3" key={player.id}>
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7 border border-border/70">
                      <AvatarFallback className="text-[10px] font-semibold">{player.id.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>Jugador {player.id.slice(0, 6)}</span>
                  </div>
                  <span>Cartas en mano: {player.handCount}</span>
                </div>

                <div className="flex min-h-28 flex-wrap items-end gap-2">
                  {playedCards.length > 0 ? (
                    playedCards.map((cardId) => (
                      <Tooltip key={cardId}>
                        <TooltipTrigger>
                          <img alt={cardId} className="h-24 w-16 rounded-md border border-border object-cover" src={getCardAssetFromId(cardId)} />
                        </TooltipTrigger>
                        <TooltipContent>{cardId}</TooltipContent>
                      </Tooltip>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin cartas jugadas aun.</p>
                  )}
                </div>

                <div className="mt-3 flex justify-end">
                  <img alt="cards back" className="h-10 w-7 rounded-sm border border-border object-cover" src={CARD_BACK_ASSET} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </TooltipProvider>
  );
}
