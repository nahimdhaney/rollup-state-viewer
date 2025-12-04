'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBlockHash, formatTimeAgo } from '@/lib/signal-service';
import { ArrowRight, ExternalLink } from 'lucide-react';

interface Checkpoint {
  blockNumber: number;
  blockHash: string;
  stateRoot: string;
  checkpointedAt?: string;
}

interface ChainStatusCardProps {
  name: string;
  chainId: number;
  currentBlock: number;
  latestCheckpoint: Checkpoint | null;
  blocksBehind: number | null;
  direction: 'l1-to-l2' | 'l2-to-l1';
  explorer?: string;
  isLoading?: boolean;
}

export function ChainStatusCard({
  name,
  chainId,
  currentBlock,
  latestCheckpoint,
  blocksBehind,
  direction,
  explorer,
  isLoading,
}: ChainStatusCardProps) {
  const checkpointTarget = direction === 'l1-to-l2' ? 'on L2' : 'on L1';

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-6 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {name}
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground text-sm font-normal">
              {checkpointTarget}
            </span>
          </CardTitle>
          <Badge variant="outline">Chain {chainId}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div>
          <p className="text-sm text-muted-foreground">Current Block</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold tabular-nums">
              {currentBlock.toLocaleString()}
            </p>
            {explorer && (
              <a
                href={`${explorer}/block/${currentBlock}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Latest Checkpoint {checkpointTarget}
          </p>
          {latestCheckpoint ? (
            <>
              <p className="text-xl font-semibold tabular-nums">
                {latestCheckpoint.blockNumber.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {formatBlockHash(latestCheckpoint.blockHash, 12)}
              </p>
              {latestCheckpoint.checkpointedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimeAgo(new Date(latestCheckpoint.checkpointedAt))}
                </p>
              )}
            </>
          ) : (
            <div className="space-y-1">
              <p className="text-muted-foreground">No checkpoints found</p>
              <p className="text-xs text-muted-foreground/70">
                Broadcaster may not be active for this direction
              </p>
            </div>
          )}
        </div>

        {blocksBehind !== null && (
          <div>
            <p className="text-sm text-muted-foreground">Blocks Behind</p>
            <div className="flex items-center gap-2">
              <p
                className={`text-lg font-medium tabular-nums ${
                  blocksBehind > 50
                    ? 'text-red-500'
                    : blocksBehind > 20
                    ? 'text-yellow-500'
                    : 'text-green-500'
                }`}
              >
                {blocksBehind} blocks
              </p>
              <Badge
                variant={
                  blocksBehind > 50
                    ? 'destructive'
                    : blocksBehind > 20
                    ? 'warning'
                    : 'success'
                }
                className="text-xs"
              >
                {blocksBehind > 50 ? 'Behind' : blocksBehind > 20 ? 'Catching up' : 'Synced'}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
