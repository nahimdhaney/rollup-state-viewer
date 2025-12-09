'use client';

import { ChainTabs } from '@/components/chain-tabs';
import { ThemeToggle } from '@/components/theme-toggle';
import { NetworkToggle } from '@/components/network-toggle';
import { Badge } from '@/components/ui/badge';
import { supportedChains } from '@/lib/chains/registry';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Rollup State Viewer
              </h1>
              <p className="text-muted-foreground mt-1">
                Cross-Chain Checkpoint Monitor
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">
                {supportedChains.length} Chains Supported
              </Badge>
              <NetworkToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ChainTabs />

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pt-8 mt-8 border-t">
          <p>
            Rollup State Viewer — Multi-chain cross-chain checkpoint monitoring
          </p>
          <p className="mt-1">
            Supported: Taiko, Arbitrum
          </p>
        </footer>
      </div>
    </main>
  );
}
