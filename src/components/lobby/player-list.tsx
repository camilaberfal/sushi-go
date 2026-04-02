import { Badge, Card } from "@/components/ui";

type LobbyPlayer = {
  user_id: string;
  display_name: string;
  is_host: boolean;
  seat_index: number;
  presence: "online" | "offline" | "bot";
};

type PlayerListProps = {
  players: LobbyPlayer[];
};

export function PlayerList({ players }: PlayerListProps) {
  return (
    <Card className="border-2 border-secondary/30 bg-card p-4">
      <h3 className="font-heading text-2xl text-secondary">Jugadores</h3>
      <div className="mt-3 space-y-2">
        {players
          .slice()
          .sort((a, b) => a.seat_index - b.seat_index)
          .map((player) => (
            <div key={player.user_id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div>
                <p className="font-semibold text-foreground">{player.display_name}</p>
                <p className="text-xs text-muted-foreground">Asiento {player.seat_index + 1}</p>
              </div>
              <div className="flex items-center gap-2">
                {player.is_host ? <Badge variant="default">Host</Badge> : null}
                <Badge variant={player.presence === "online" ? "secondary" : "outline"}>{player.presence}</Badge>
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
}
