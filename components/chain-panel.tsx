'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { chainConfigs, getChainConfig } from '@/lib/chains/registry';
import { useNetwork } from '@/lib/chains/network-context';
import type { Checkpoint, ChainStatus, NetworkType } from '@/lib/chains/types';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { MultiChainProofChecker } from './multi-chain-proof-checker';

interface ChainPanelProps {
  chainId: string;
  isActive: boolean;
}

function formatHash(hash: string, length: number = 10): string {
  if (!hash) return '';
  return `${hash.slice(0, length)}...${hash.slice(-4)}`;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function StatusCard({
  chainId,
  direction,
  isActive,
  network,
}: {
  chainId: string;
  direction: 'l1ToL2' | 'l2ToL1';
  isActive: boolean;
  network: NetworkType;
}) {
  const config = getChainConfig(chainId, network);
  const { data, isLoading, isFetching } = useQuery<ChainStatus>({
    queryKey: ['chain-status', chainId, direction, network],
    queryFn: async () => {
      const res = await fetch(`/api/chains/${chainId}/status?direction=${direction}&network=${network}`);
      if (!res.ok) throw new Error('Failed to fetch status');
      return res.json();
    },
    enabled: isActive && !!config,
    refetchInterval: isActive ? 10000 : false,
    staleTime: 5000,
  });

  if (!config) return null;

  const directionLabel = direction === 'l1ToL2' ? 'L1 → L2' : 'L2 → L1';
  // Contract is on the TARGET chain where checkpoints are stored
  // L2→L1: checkpoints stored on L1 → use L1 explorer
  // L1→L2: checkpoints stored on L2 → use L2 explorer
  const contractExplorer = direction === 'l2ToL1'
    ? config.contracts.l1.explorerUrl
    : config.contracts.l2.explorerUrl;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {directionLabel}
            {isFetching && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
          </CardTitle>
          <Badge variant={data?.isConnected ? 'success' : 'destructive'}>
            {data?.isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {data?.latestCheckpoint ? (
          <>
            <div>
              <p className="text-sm text-muted-foreground">Latest Checkpointed Block</p>
              <p className="text-2xl font-bold tabular-nums">
                {data.latestCheckpoint.blockNumber.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Block Hash</p>
              <p className="font-mono text-xs">{formatHash(data.latestCheckpoint.blockHash, 16)}</p>
            </div>
            {data.latestCheckpoint.stateRoot && (
              <div>
                <p className="text-sm text-muted-foreground">State Root</p>
                <p className="font-mono text-xs">{formatHash(data.latestCheckpoint.stateRoot, 16)}</p>
              </div>
            )}
            {data.latestCheckpoint.sendRoot && (
              <div>
                <p className="text-sm text-muted-foreground">Send Root</p>
                <p className="font-mono text-xs">{formatHash(data.latestCheckpoint.sendRoot, 16)}</p>
              </div>
            )}
            {data.latestCheckpoint.timestamp && (
              <p className="text-xs text-muted-foreground">
                {formatTimeAgo(data.latestCheckpoint.timestamp)}
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No checkpoints found</p>
            {data?.error && (
              <p className="text-xs text-destructive mt-1">{data.error}</p>
            )}
          </div>
        )}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Contract: <a
              href={`${contractExplorer}/address/${data?.contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono hover:underline"
            >
              {formatHash(data?.contractAddress || '', 12)}
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CheckpointsTable({
  chainId,
  direction,
  isActive,
  network,
}: {
  chainId: string;
  direction: 'l1ToL2' | 'l2ToL1';
  isActive: boolean;
  network: NetworkType;
}) {
  const config = getChainConfig(chainId, network);
  const { data, isLoading, error } = useQuery<{ checkpoints: Checkpoint[] }>({
    queryKey: ['checkpoints', chainId, direction, network],
    queryFn: async () => {
      const res = await fetch(`/api/chains/${chainId}/checkpoints?direction=${direction}&limit=10&network=${network}`);
      if (!res.ok) throw new Error('Failed to fetch checkpoints');
      return res.json();
    },
    enabled: isActive && !!config,
    refetchInterval: isActive ? 15000 : false,
    staleTime: 10000,
  });

  if (!config) return null;

  // Tx is on the TARGET chain where checkpoints are stored
  // L2→L1: tx on L1 → use L1 explorer
  // L1→L2: tx on L2 → use L2 explorer
  const txExplorer = direction === 'l2ToL1'
    ? config.contracts.l1.explorerUrl
    : config.contracts.l2.explorerUrl;

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

  // Determine which root field to show based on chain
  const hasStateRoot = data.checkpoints.some(cp => cp.stateRoot);
  const hasSendRoot = data.checkpoints.some(cp => cp.sendRoot);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Block</TableHead>
          <TableHead>Block Hash</TableHead>
          {hasStateRoot && <TableHead>State Root</TableHead>}
          {hasSendRoot && <TableHead>Send Root</TableHead>}
          <TableHead>Time</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.checkpoints.map((cp, idx) => (
          <TableRow key={`${cp.blockNumber}-${idx}`}>
            <TableCell className="font-medium tabular-nums">
              {cp.blockNumber.toLocaleString()}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {formatHash(cp.blockHash, 10)}
            </TableCell>
            {hasStateRoot && (
              <TableCell className="font-mono text-xs">
                {cp.stateRoot ? formatHash(cp.stateRoot, 10) : '-'}
              </TableCell>
            )}
            {hasSendRoot && (
              <TableCell className="font-mono text-xs">
                {cp.sendRoot ? formatHash(cp.sendRoot, 10) : '-'}
              </TableCell>
            )}
            <TableCell className="text-muted-foreground text-sm">
              {cp.timestamp ? formatTimeAgo(cp.timestamp) : '-'}
            </TableCell>
            <TableCell>
              {cp.txHash && (
                <a
                  href={`${txExplorer}/tx/${cp.txHash}`}
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

export function ChainPanel({ chainId, isActive }: ChainPanelProps) {
  const [direction, setDirection] = useState<'l1ToL2' | 'l2ToL1'>('l2ToL1');
  const { network } = useNetwork();
  const config = getChainConfig(chainId, network);

  if (!config) {
    return <div>Unknown chain: {chainId}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Direction Tabs */}
      <Tabs value={direction} onValueChange={(v) => setDirection(v as 'l1ToL2' | 'l2ToL1')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="l1ToL2" disabled={!config.directions.l1ToL2}>
            L1 → L2
            <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">
              (L1 state on L2)
            </span>
          </TabsTrigger>
          <TabsTrigger value="l2ToL1" disabled={!config.directions.l2ToL1}>
            L2 → L1
            <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">
              (L2 state on L1)
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Status Cards */}
      <section>
        <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
          Status
          <Badge variant="outline" className="text-xs font-normal">
            {config.name}
          </Badge>
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <StatusCard chainId={chainId} direction={direction} isActive={isActive} network={network} />
          <Card className="bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Chain Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">L1 Chain ID</span>
                <span className="font-mono">{config.contracts.l1.chainId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">L2 Chain ID</span>
                <span className="font-mono">{config.contracts.l2.chainId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">L1 Explorer</span>
                <a
                  href={config.contracts.l1.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {new URL(config.contracts.l1.explorerUrl).hostname}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">L2 Explorer</span>
                <a
                  href={config.contracts.l2.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {new URL(config.contracts.l2.explorerUrl).hostname}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Proof Checker */}
      <section>
        <h3 className="text-md font-semibold mb-3">Proof Readiness Checker</h3>
        <div className="max-w-xl">
          <MultiChainProofChecker chainId={chainId} direction={direction} network={network} />
        </div>
      </section>

      {/* Checkpoints Table */}
      <section>
        <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
          Recent Checkpoints
          <Badge variant="secondary" className="text-xs font-normal">
            Auto-refreshes every 15s
          </Badge>
        </h3>
        <Card>
          <CardContent className="pt-4">
            <CheckpointsTable chainId={chainId} direction={direction} isActive={isActive} network={network} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
