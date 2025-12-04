# Quick Start Guide

## Option 1: Automated Setup

```bash
cd /Users/nahimdhaney/openzeppelin/taiko-state-viewer
chmod +x setup.sh
./setup.sh
```

## Option 2: Manual Setup

### Step 1: Create Next.js Project

```bash
cd /Users/nahimdhaney/openzeppelin/taiko-state-viewer

# Create Next.js app (run from parent directory to use existing folder)
npx create-next-app@latest . --typescript --tailwind --eslint --app --use-npm
```

When prompted:
- Would you like to use `src/` directory? **No**
- Would you like to customize the default import alias? **No**

### Step 2: Install Dependencies

```bash
npm install viem @tanstack/react-query
```

### Step 3: Setup shadcn/ui

```bash
npx shadcn-ui@latest init
```

When prompted:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

Then add components:
```bash
npx shadcn-ui@latest add card button input table badge tabs separator skeleton
```

### Step 4: Configure Environment

```bash
cp .env.example .env.local
```

### Step 5: Start Development

```bash
npm run dev
```

Open http://localhost:3000

---

## File-by-File Implementation

After setup, create these files in order:

### 1. `lib/config.ts` - Chain Configuration

```typescript
export const config = {
  l1: {
    chainId: parseInt(process.env.NEXT_PUBLIC_L1_CHAIN_ID || '32382'),
    name: process.env.NEXT_PUBLIC_L1_CHAIN_NAME || 'Taiko L1',
    rpc: process.env.NEXT_PUBLIC_L1_RPC || 'https://l1rpc.internal.taiko.xyz',
    signalService: process.env.NEXT_PUBLIC_L1_SIGNAL_SERVICE as `0x${string}`,
    broadcaster: process.env.NEXT_PUBLIC_L1_BROADCASTER as `0x${string}`,
    explorer: process.env.NEXT_PUBLIC_L1_EXPLORER,
  },
  l2: {
    chainId: parseInt(process.env.NEXT_PUBLIC_L2_CHAIN_ID || '167001'),
    name: process.env.NEXT_PUBLIC_L2_CHAIN_NAME || 'Taiko L2',
    rpc: process.env.NEXT_PUBLIC_L2_RPC || 'https://rpc.internal.taiko.xyz',
    signalService: process.env.NEXT_PUBLIC_L2_SIGNAL_SERVICE as `0x${string}`,
    broadcaster: process.env.NEXT_PUBLIC_L2_BROADCASTER as `0x${string}`,
    explorer: process.env.NEXT_PUBLIC_L2_EXPLORER,
  },
  checkpointsSlot: parseInt(process.env.NEXT_PUBLIC_CHECKPOINTS_SLOT || '254'),
  refreshInterval: parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL || '5000'),
};
```

### 2. `lib/signal-service.ts` - Contract Interactions

```typescript
import { createPublicClient, http, parseAbiItem, type PublicClient } from 'viem';
import { config } from './config';

const CHECKPOINT_SAVED_EVENT = parseAbiItem(
  'event CheckpointSaved(uint48 indexed blockNumber, bytes32 blockHash, bytes32 stateRoot)'
);

export interface Checkpoint {
  blockNumber: number;
  blockHash: string;
  stateRoot: string;
  transactionHash: string;
  checkpointedInBlock: number;
  checkpointedAt?: Date;
}

export function createClient(layer: 'l1' | 'l2'): PublicClient {
  const layerConfig = layer === 'l1' ? config.l1 : config.l2;
  return createPublicClient({
    transport: http(layerConfig.rpc),
  });
}

export async function getLatestBlock(layer: 'l1' | 'l2'): Promise<bigint> {
  const client = createClient(layer);
  return client.getBlockNumber();
}

export async function getRecentCheckpoints(
  layer: 'l1' | 'l2',
  limit: number = 20
): Promise<Checkpoint[]> {
  const client = createClient(layer);
  const layerConfig = layer === 'l1' ? config.l1 : config.l2;
  const currentBlock = await client.getBlockNumber();

  const logs = await client.getLogs({
    address: layerConfig.signalService,
    event: CHECKPOINT_SAVED_EVENT,
    fromBlock: currentBlock - 500n,
    toBlock: 'latest',
  });

  const checkpoints = await Promise.all(
    logs.map(async (log) => {
      const block = await client.getBlock({ blockNumber: log.blockNumber });
      return {
        blockNumber: Number(log.args.blockNumber),
        blockHash: log.args.blockHash as string,
        stateRoot: log.args.stateRoot as string,
        transactionHash: log.transactionHash,
        checkpointedInBlock: Number(log.blockNumber),
        checkpointedAt: new Date(Number(block.timestamp) * 1000),
      };
    })
  );

  return checkpoints.reverse().slice(0, limit);
}

export async function findCheckpointForBlock(
  layer: 'l1' | 'l2',
  targetBlock: number
): Promise<Checkpoint | null> {
  const checkpoints = await getRecentCheckpoints(layer, 50);

  // Find smallest checkpoint >= targetBlock
  const validCheckpoints = checkpoints
    .filter(cp => cp.blockNumber >= targetBlock)
    .sort((a, b) => a.blockNumber - b.blockNumber);

  return validCheckpoints[0] || null;
}
```

### 3. `app/api/status/route.ts` - Status API

```typescript
import { NextResponse } from 'next/server';
import { getLatestBlock, getRecentCheckpoints } from '@/lib/signal-service';
import { config } from '@/lib/config';

export async function GET() {
  try {
    const [l1Block, l2Block, l1Checkpoints, l2Checkpoints] = await Promise.all([
      getLatestBlock('l1'),
      getLatestBlock('l2'),
      getRecentCheckpoints('l2', 1), // L1 blocks checkpointed ON L2
      getRecentCheckpoints('l1', 1), // L2 blocks checkpointed ON L1
    ]);

    const l1LatestCheckpoint = l1Checkpoints[0];
    const l2LatestCheckpoint = l2Checkpoints[0];

    return NextResponse.json({
      l1: {
        chainId: config.l1.chainId,
        name: config.l1.name,
        currentBlock: Number(l1Block),
        latestCheckpointOnL2: l1LatestCheckpoint || null,
        blocksBehind: l1LatestCheckpoint
          ? Number(l1Block) - l1LatestCheckpoint.blockNumber
          : null,
      },
      l2: {
        chainId: config.l2.chainId,
        name: config.l2.name,
        currentBlock: Number(l2Block),
        latestCheckpointOnL1: l2LatestCheckpoint || null,
        blocksBehind: l2LatestCheckpoint
          ? Number(l2Block) - l2LatestCheckpoint.blockNumber
          : null,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chain status' },
      { status: 500 }
    );
  }
}
```

### 4. `app/api/checkpoints/route.ts` - Checkpoints API

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getRecentCheckpoints } from '@/lib/signal-service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const direction = searchParams.get('direction') || 'l1-to-l2';
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    // For L1→L2: L1 blocks are checkpointed ON L2
    // For L2→L1: L2 blocks are checkpointed ON L1
    const layer = direction === 'l1-to-l2' ? 'l2' : 'l1';
    const checkpoints = await getRecentCheckpoints(layer, limit);

    return NextResponse.json({
      direction,
      checkpoints,
    });
  } catch (error) {
    console.error('Checkpoints API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checkpoints' },
      { status: 500 }
    );
  }
}
```

### 5. `app/api/check-proof/route.ts` - Proof Readiness API

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { findCheckpointForBlock, getLatestBlock } from '@/lib/signal-service';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { blockNumber, direction } = body;

    if (!blockNumber || !direction) {
      return NextResponse.json(
        { error: 'Missing blockNumber or direction' },
        { status: 400 }
      );
    }

    // For L1→L2: Check if L1 block is checkpointed on L2
    // For L2→L1: Check if L2 block is checkpointed on L1
    const checkpointLayer = direction === 'l1-to-l2' ? 'l2' : 'l1';
    const sourceLayer = direction === 'l1-to-l2' ? 'l1' : 'l2';

    const checkpoint = await findCheckpointForBlock(checkpointLayer, blockNumber);
    const currentBlock = await getLatestBlock(sourceLayer);

    if (checkpoint) {
      const sourceConfig = direction === 'l1-to-l2' ? config.l1 : config.l2;

      return NextResponse.json({
        ready: true,
        sourceBlock: blockNumber,
        proofBlock: checkpoint.blockNumber,
        checkpoint,
        commands: {
          proofGenerator: `cd scripts/storage-proof-generator && node dist/index.cjs --rpc "${sourceConfig.rpc}" --account "${sourceConfig.broadcaster}" --slot "<SLOT>" --block ${checkpoint.blockNumber} --output "../../proof.json"`,
        },
      });
    }

    return NextResponse.json({
      ready: false,
      sourceBlock: blockNumber,
      currentBlock: Number(currentBlock),
      message: `Block ${blockNumber} is not yet checkpointed. Try again in ~1 minute.`,
    });
  } catch (error) {
    console.error('Check proof API error:', error);
    return NextResponse.json(
      { error: 'Failed to check proof readiness' },
      { status: 500 }
    );
  }
}
```

### 6. `components/providers.tsx` - Query Provider

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 3000,
        refetchInterval: 5000,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### 7. `app/layout.tsx` - Root Layout

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Taiko State Viewer',
  description: 'Real-time cross-chain checkpoint monitor for Taiko',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### 8. `components/chain-status-card.tsx` - Status Display

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ChainStatusCardProps {
  name: string;
  chainId: number;
  currentBlock: number;
  latestCheckpoint: {
    blockNumber: number;
    blockHash: string;
  } | null;
  blocksBehind: number | null;
  direction: 'l1-to-l2' | 'l2-to-l1';
}

export function ChainStatusCard({
  name,
  chainId,
  currentBlock,
  latestCheckpoint,
  blocksBehind,
  direction,
}: ChainStatusCardProps) {
  const checkpointTarget = direction === 'l1-to-l2' ? 'on L2' : 'on L1';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant="outline">Chain {chainId}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Current Block</p>
          <p className="text-2xl font-bold">{currentBlock.toLocaleString()}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Latest Checkpoint {checkpointTarget}
          </p>
          {latestCheckpoint ? (
            <>
              <p className="text-xl font-semibold">
                {latestCheckpoint.blockNumber.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {latestCheckpoint.blockHash}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">Loading...</p>
          )}
        </div>

        {blocksBehind !== null && (
          <div>
            <p className="text-sm text-muted-foreground">Blocks Behind</p>
            <p className={`text-lg font-medium ${blocksBehind > 20 ? 'text-yellow-500' : 'text-green-500'}`}>
              {blocksBehind} blocks
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 9. `app/page.tsx` - Main Dashboard

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { ChainStatusCard } from '@/components/chain-status-card';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const { data: status, isLoading, error } = useQuery({
    queryKey: ['status'],
    queryFn: async () => {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    refetchInterval: 5000,
  });

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Taiko State Viewer</h1>
          <p className="text-muted-foreground">
            Real-time Cross-Chain Checkpoint Monitor
          </p>
          {status?.updatedAt && (
            <Badge variant="secondary">
              Last updated: {new Date(status.updatedAt).toLocaleTimeString()}
            </Badge>
          )}
        </div>

        {/* Chain Status Cards */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500">
            Error loading chain status
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <ChainStatusCard
              name={status.l1.name}
              chainId={status.l1.chainId}
              currentBlock={status.l1.currentBlock}
              latestCheckpoint={status.l1.latestCheckpointOnL2}
              blocksBehind={status.l1.blocksBehind}
              direction="l1-to-l2"
            />
            <ChainStatusCard
              name={status.l2.name}
              chainId={status.l2.chainId}
              currentBlock={status.l2.currentBlock}
              latestCheckpoint={status.l2.latestCheckpointOnL1}
              blocksBehind={status.l2.blocksBehind}
              direction="l2-to-l1"
            />
          </div>
        )}

        {/* Info Section */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Auto-refreshes every 5 seconds</p>
        </div>
      </div>
    </main>
  );
}
```

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_L1_RPC
vercel env add NEXT_PUBLIC_L2_RPC
# ... add all from .env.example

# Deploy to production
vercel --prod
```

Your site will be live at `https://your-project.vercel.app`
