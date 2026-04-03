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
        <TableRow className="border-white/15">
          <TableHead className="text-white/70">Fecha</TableHead>
          <TableHead className="text-white/70">Sala</TableHead>
          <TableHead className="text-white/70">Jugadores</TableHead>
          <TableHead className="text-white/70">Duración</TableHead>
          <TableHead className="text-right">Accion</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matches.map((match) => (
          <TableRow className="border-white/10" key={match.gameId}>
            <TableCell className="text-white/90">{new Date(match.createdAt).toLocaleString()}</TableCell>
            <TableCell>
              <Badge className="border-white/20 bg-black/35 text-[#fbbf24]" variant="outline">{match.roomCode || "N/A"}</Badge>
            </TableCell>
            <TableCell className="text-white/85">{match.players.join(", ") || "Sin datos"}</TableCell>
            <TableCell className="text-cyan-200">{formatDuration(match.totalDurationMs)}</TableCell>
            <TableCell className="text-right">
              <Link className="text-sm font-bold text-emerald-300 underline-offset-2 hover:underline" href={`/scoreboard/${match.roomCode}`}>
                Ver scoreboard
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
