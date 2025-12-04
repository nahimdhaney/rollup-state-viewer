'use client';

import { useQuery } from '@tanstack/react-query';
import { ChainStatusCard } from '@/components/chain-status-card';
import { CheckpointTable } from '@/components/checkpoint-table';
import { ProofChecker } from '@/components/proof-checker';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

interface ChainStatus {
  l1: {
    chainId: number;
    name: string;
    currentBlock: number;
    latestCheckpointOnL2: {
      blockNumber: number;
      blockHash: string;
      stateRoot: string;
      checkpointedAt?: string;
    } | null;
    blocksBehind: number | null;
    explorer: string;
  };
  l2: {
    chainId: number;
    name: string;
    currentBlock: number;
    latestCheckpointOnL1: {
      blockNumber: number;
      blockHash: string;
      stateRoot: string;
      checkpointedAt?: string;
    } | null;
    blocksBehind: number | null;
    explorer: string;
  };
  updatedAt: string;
}

export default function Home() {
  const {
    data: status,
    isLoading,
    error,
    isFetching,
  } = useQuery<ChainStatus>({
    queryKey: ['status'],
    queryFn: async () => {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error('Failed to fetch status');
      return res.json();
    },
    refetchInterval: 5000,
  });

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Taiko State Viewer
              </h1>
              <p className="text-muted-foreground mt-1">
                Real-time Cross-Chain Checkpoint Monitor
              </p>
            </div>
            <div className="flex items-center gap-3">
              {status?.updatedAt && (
                <Badge variant="secondary" className="flex items-center gap-2">
                  {isFetching && (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  )}
                  Last updated: {new Date(status.updatedAt).toLocaleTimeString()}
                </Badge>
              )}
              <Badge variant="outline">Auto-refresh: 5s</Badge>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error State */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
            <p className="text-destructive">
              Error loading chain status. Please check your RPC connections.
            </p>
          </div>
        )}

        {/* Chain Status Cards */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Chain Status</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ChainStatusCard
              name={status?.l1.name || 'Taiko L1'}
              chainId={status?.l1.chainId || 0}
              currentBlock={status?.l1.currentBlock || 0}
              latestCheckpoint={status?.l1.latestCheckpointOnL2 || null}
              blocksBehind={status?.l1.blocksBehind ?? null}
              direction="l1-to-l2"
              explorer={status?.l1.explorer}
              isLoading={isLoading}
            />
            <ChainStatusCard
              name={status?.l2.name || 'Taiko L2'}
              chainId={status?.l2.chainId || 0}
              currentBlock={status?.l2.currentBlock || 0}
              latestCheckpoint={status?.l2.latestCheckpointOnL1 || null}
              blocksBehind={status?.l2.blocksBehind ?? null}
              direction="l2-to-l1"
              explorer={status?.l2.explorer}
              isLoading={isLoading}
            />
          </div>
        </section>

        {/* Proof Checker */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Proof Readiness Checker</h2>
          <div className="max-w-xl">
            <ProofChecker />
          </div>
        </section>

        {/* Checkpoints Table */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Recent Checkpoints</h2>
          <CheckpointTable
            l1Explorer={status?.l1.explorer}
            l2Explorer={status?.l2.explorer}
          />
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pt-8 border-t">
          <p>
            Taiko State Viewer — Real-time cross-chain checkpoint monitoring
          </p>
          <p className="mt-1">
            Network: Taiko Internal Testnet
          </p>
        </footer>
      </div>
    </main>
  );
}
