import { Avatar, AvatarFallback, Card, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui";
import { CARD_BACK_ASSET, getCardAssetFromId } from "@/components/game/card-art";

type TablePlayer = {
  id: string;
  playedCards: string[];
  handCount: number;
};

type TableViewProps = {
  players: TablePlayer[];
  canDropCard?: boolean;
  draggingCardId?: string | null;
  onDropCard?: (cardId: string) => void;
};

export function TableView({ players, canDropCard, draggingCardId, onDropCard }: TableViewProps) {
  return (
    <TooltipProvider>
      <Card
        className={`border-2 border-border/70 bg-card/80 p-4 transition ${canDropCard && draggingCardId ? "ring-4 ring-primary/40 border-primary/50" : ""}`}
        onDragOver={(event) => {
          if (!canDropCard || !draggingCardId) return;
          event.preventDefault();
        }}
        onDrop={(event) => {
          if (!canDropCard || !onDropCard) return;
          event.preventDefault();
          const cardId = event.dataTransfer.getData("text/plain");
          if (!cardId) return;
          onDropCard(cardId);
        }}
      >
        <h3 className="font-heading text-3xl text-foreground">Mesa</h3>
        {canDropCard ? <p className="mt-1 text-sm text-muted-foreground">Arrastra una carta desde tu mano y suéltala aquí para jugarla.</p> : null}
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {players.map((player) => {
            const playedCards = player.playedCards;
            return (
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3" key={player.id}>
                <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border border-border/70">
                      <AvatarFallback className="text-xs font-semibold">{player.id.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>Jugador {player.id.slice(0, 6)}</span>
                  </div>
                  <span>Cartas en mano: {player.handCount}</span>
                </div>

                <div className="flex min-h-36 flex-wrap items-end gap-2.5">
                  {playedCards.length > 0 ? (
                    playedCards.map((cardId) => (
                      <Tooltip key={cardId}>
                        <TooltipTrigger>
                          <img alt={cardId} className="h-32 w-[5.5rem] rounded-md border border-border object-cover" src={getCardAssetFromId(cardId)} />
                        </TooltipTrigger>
                        <TooltipContent className="text-sm">{cardId}</TooltipContent>
                      </Tooltip>
                    ))
                  ) : (
                    <p className="text-base text-muted-foreground">Sin cartas jugadas aun.</p>
                  )}
                </div>

                <div className="mt-3 flex justify-end">
                  <img alt="cards back" className="h-14 w-10 rounded-sm border border-border object-cover" src={CARD_BACK_ASSET} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </TooltipProvider>
  );
}
