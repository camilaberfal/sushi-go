import Link from "next/link";

import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";

type MatchListItem = {
  gameId: string;
  roomCode: string;
  createdAt: string;
  totalDurationMs: number;
  players: string[];
};

type MatchListProps = {
  matches: MatchListItem[];
};

function formatDuration(totalMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${min}m ${sec.toString().padStart(2, "0")}s`;
}

export function MatchList({ matches }: MatchListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Sala</TableHead>
          <TableHead>Jugadores</TableHead>
          <TableHead>Duracion</TableHead>
          <TableHead className="text-right">Accion</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matches.map((match) => (
          <TableRow key={match.gameId}>
            <TableCell>{new Date(match.createdAt).toLocaleString()}</TableCell>
            <TableCell>
              <Badge variant="outline">{match.roomCode || "N/A"}</Badge>
            </TableCell>
            <TableCell>{match.players.join(", ") || "Sin datos"}</TableCell>
            <TableCell>{formatDuration(match.totalDurationMs)}</TableCell>
            <TableCell className="text-right">
              <Link className="text-sm font-medium text-primary underline-offset-2 hover:underline" href={`/scoreboard/${match.roomCode}`}>
                Ver scoreboard
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
