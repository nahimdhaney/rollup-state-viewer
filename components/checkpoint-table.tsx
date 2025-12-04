'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatBlockHash, formatTimeAgo } from '@/lib/signal-service';
import { ExternalLink } from 'lucide-react';

interface Checkpoint {
  blockNumber: number;
  blockHash: string;
  stateRoot: string;
  transactionHash: string;
  checkpointedInBlock: number;
  checkpointedAt?: string;
}

interface CheckpointsResponse {
  direction: string;
  sourceChain: string;
  targetChain: string;
  checkpoints: Checkpoint[];
}

function CheckpointTableContent({
  direction,
  explorer,
}: {
  direction: 'l1-to-l2' | 'l2-to-l1';
  explorer?: string;
}) {
  const { data, isLoading, error } = useQuery<CheckpointsResponse>({
    queryKey: ['checkpoints', direction],
    queryFn: async () => {
      const res = await fetch(`/api/checkpoints?direction=${direction}&limit=10`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Error loading checkpoints
      </div>
    );
  }

  if (!data?.checkpoints?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No checkpoints found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Block</TableHead>
          <TableHead>Block Hash</TableHead>
          <TableHead>State Root</TableHead>
          <TableHead>Checkpointed At</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.checkpoints.map((cp) => (
          <TableRow key={`${cp.blockNumber}-${cp.transactionHash}`}>
            <TableCell className="font-medium tabular-nums">
              {cp.blockNumber.toLocaleString()}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {formatBlockHash(cp.blockHash, 10)}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {formatBlockHash(cp.stateRoot, 10)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {cp.checkpointedAt
                ? formatTimeAgo(new Date(cp.checkpointedAt))
                : `Block ${cp.checkpointedInBlock}`}
            </TableCell>
            <TableCell>
              {explorer && (
                <a
                  href={`${explorer}/tx/${cp.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface CheckpointTableProps {
  l1Explorer?: string;
  l2Explorer?: string;
}

export function CheckpointTable({ l1Explorer, l2Explorer }: CheckpointTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Checkpoints</CardTitle>
          <Badge variant="secondary">Auto-refreshes every 10s</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="l1-to-l2">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="l1-to-l2">L1 → L2</TabsTrigger>
            <TabsTrigger value="l2-to-l1">L2 → L1</TabsTrigger>
          </TabsList>
          <TabsContent value="l1-to-l2">
            <p className="text-sm text-muted-foreground mb-4">
              L1 blocks checkpointed on L2 SignalService
            </p>
            <CheckpointTableContent direction="l1-to-l2" explorer={l2Explorer} />
          </TabsContent>
          <TabsContent value="l2-to-l1">
            <p className="text-sm text-muted-foreground mb-4">
              L2 blocks checkpointed on L1 SignalService
            </p>
            <CheckpointTableContent direction="l2-to-l1" explorer={l1Explorer} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
