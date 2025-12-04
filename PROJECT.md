# Taiko State Viewer

A real-time dashboard for monitoring Taiko L1/L2 checkpoint state, helping developers understand when cross-chain proofs can be generated and verified.

## Problem Statement

When verifying cross-chain messages on Taiko, developers need to know:
- What is the latest block on each chain?
- Which blocks have been checkpointed?
- Can I generate a proof for my transaction right now?
- How long until my block is checkpointed?

Currently, this requires manually querying contracts and parsing events. This tool provides instant visibility.

## Live Demo Concept

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         TAIKO STATE VIEWER                                          │
│                    Real-time Cross-Chain Checkpoint Monitor                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│   ┌─────────────────────────────┐    ┌─────────────────────────────┐              │
│   │      L1 (Parent Chain)      │    │      L2 (Child Chain)       │              │
│   │        Chain ID: 32382      │    │       Chain ID: 167001      │              │
│   ├─────────────────────────────┤    ├─────────────────────────────┤              │
│   │                             │    │                             │              │
│   │  Current Block: 74,892      │    │  Current Block: 12,456      │              │
│   │  ████████████████████░░ 98% │    │  ████████████████████░░ 98% │              │
│   │                             │    │                             │              │
│   │  Latest Checkpoint: 74,880  │    │  Latest Checkpoint: 12,450  │              │
│   │  Checkpointed ON L2 ───────────────────────→                   │              │
│   │                             │    │                             │              │
│   │  Blocks Behind: 12          │    │  Blocks Behind: 6           │              │
│   │  Est. Next Checkpoint: ~2m  │    │  Est. Next Checkpoint: ~1m  │              │
│   │                             │    │                             │              │
│   └─────────────────────────────┘    └─────────────────────────────┘              │
│                                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────┐  │
│   │                        PROOF READINESS CHECKER                               │  │
│   ├─────────────────────────────────────────────────────────────────────────────┤  │
│   │  Enter TX Hash or Block Number:  [0x1234...                           ] [→] │  │
│   │                                                                             │  │
│   │  Direction: (●) L1 → L2    ( ) L2 → L1                                     │  │
│   │                                                                             │  │
│   │  ┌─────────────────────────────────────────────────────────────────────┐   │  │
│   │  │  ✓ READY FOR PROOF                                                  │   │  │
│   │  │                                                                     │   │  │
│   │  │  Your TX Block: 74,856                                              │   │  │
│   │  │  Nearest Checkpoint: 74,860 (checkpointed on L2)                    │   │  │
│   │  │  Proof Block to Use: 74,860                                         │   │  │
│   │  │                                                                     │   │  │
│   │  │  [Generate Proof Command]  [Copy Storage Slot]                      │   │  │
│   │  └─────────────────────────────────────────────────────────────────────┘   │  │
│   └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────┐  │
│   │                      RECENT CHECKPOINTS                                      │  │
│   ├─────────────────────────────────────────────────────────────────────────────┤  │
│   │  L1 → L2 (L1 blocks checkpointed on L2)                                     │  │
│   │  ───────────────────────────────────────                                    │  │
│   │  Block     │ Block Hash        │ State Root        │ Checkpointed At       │  │
│   │  74,880    │ 0x7f29e552...     │ 0x920d9f5f...     │ 2 minutes ago         │  │
│   │  74,874    │ 0x6a7a5572...     │ 0x8b3d4e2a...     │ 8 minutes ago         │  │
│   │  74,868    │ 0x5c8b6483...     │ 0x7a2c3f1b...     │ 14 minutes ago        │  │
│   │  74,862    │ 0x4b7a5371...     │ 0x6b1d2e0a...     │ 20 minutes ago        │  │
│   │                                                                             │  │
│   │  L2 → L1 (L2 blocks checkpointed on L1)                                     │  │
│   │  ───────────────────────────────────────                                    │  │
│   │  Block     │ Block Hash        │ State Root        │ Checkpointed At       │  │
│   │  12,450    │ 0x3e2d1c0b...     │ 0x5f4e3d2c...     │ 1 minute ago          │  │
│   │  12,444    │ 0x2d1c0b9a...     │ 0x4e3d2c1b...     │ 7 minutes ago         │  │
│   │  ...                                                                        │  │
│   └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────┐  │
│   │                      CHECKPOINT TIMELINE                                     │  │
│   ├─────────────────────────────────────────────────────────────────────────────┤  │
│   │                                                                             │  │
│   │  L1 Blocks:  ──●────────●────────●────────●────────●────────○──────────→   │  │
│   │              74860    74866    74872    74878    74884    74890  (current)  │  │
│   │                │        │        │        │        │                        │  │
│   │                ▼        ▼        ▼        ▼        ▼                        │  │
│   │  On L2:       ✓        ✓        ✓        ✓        ✓        ○ (pending)     │  │
│   │                                                                             │  │
│   └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│   Auto-refresh: 5s │ Last updated: 14:32:15 UTC │ Network: Taiko Internal Testnet  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Features

### 1. Real-Time Chain Status
- Current block number on L1 and L2
- Live updates via WebSocket or polling
- Block time and gas metrics

### 2. Checkpoint Monitoring
- Latest checkpointed block for each direction
- Time since last checkpoint
- Estimated time until next checkpoint
- Visual timeline of recent checkpoints

### 3. Proof Readiness Checker
- Input: TX hash or block number
- Output: Whether proof can be generated now
- If not ready: estimated wait time
- If ready: exact proof block to use

### 4. Command Generator
- Generate `storage-proof-generator` command
- Generate `forge script` verification command
- Copy storage slot calculation
- One-click copy to clipboard

### 5. Historical Data
- Recent checkpoints table
- Checkpoint frequency statistics
- Average checkpoint interval

### 6. Alerts (Optional)
- Notify when specific block is checkpointed
- WebSocket subscription for real-time updates

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              ARCHITECTURE                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                          │
│   │   Browser   │────▶│   Vercel    │────▶│  Taiko RPCs │                          │
│   │   (React)   │◀────│  (Next.js)  │◀────│  L1 & L2    │                          │
│   └─────────────┘     └─────────────┘     └─────────────┘                          │
│         │                   │                    │                                  │
│         │                   │                    │                                  │
│         ▼                   ▼                    ▼                                  │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                          │
│   │  TanStack   │     │   API       │     │  Signal     │                          │
│   │   Query     │     │  Routes     │     │  Service    │                          │
│   │  (caching)  │     │  /api/*     │     │  Contracts  │                          │
│   └─────────────┘     └─────────────┘     └─────────────┘                          │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| **Framework** | Next.js 14 (App Router) | Best Vercel integration, SSR, API routes |
| **Styling** | Tailwind CSS + shadcn/ui | Fast development, beautiful components |
| **State** | TanStack Query | Caching, refetching, real-time updates |
| **Blockchain** | viem | TypeScript-first, lightweight |
| **Charts** | Recharts or Tremor | Timeline visualization |
| **Deployment** | Vercel | Zero-config, edge functions |

## Project Structure

```
taiko-state-viewer/
├── app/
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Main dashboard
│   ├── api/
│   │   ├── status/route.ts        # GET /api/status - chain status
│   │   ├── checkpoints/route.ts   # GET /api/checkpoints - recent checkpoints
│   │   └── check-proof/route.ts   # POST /api/check-proof - proof readiness
│   └── globals.css
│
├── components/
│   ├── chain-status-card.tsx      # L1/L2 status display
│   ├── checkpoint-table.tsx       # Recent checkpoints table
│   ├── checkpoint-timeline.tsx    # Visual timeline
│   ├── proof-checker.tsx          # TX/block input form
│   ├── command-generator.tsx      # CLI command display
│   └── ui/                        # shadcn components
│
├── lib/
│   ├── chains/
│   │   └── taiko.ts               # Taiko chain configuration
│   ├── contracts/
│   │   └── signal-service.ts      # SignalService ABI & helpers
│   ├── hooks/
│   │   ├── use-chain-status.ts    # Real-time chain data
│   │   ├── use-checkpoints.ts     # Checkpoint data
│   │   └── use-proof-check.ts     # Proof readiness
│   └── utils/
│       ├── format.ts              # Formatting helpers
│       └── time.ts                # Time calculations
│
├── public/
│   └── taiko-logo.svg
│
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## API Endpoints

### GET /api/status
Returns current chain status.

```typescript
// Response
{
  "l1": {
    "chainId": 32382,
    "currentBlock": 74892,
    "latestCheckpoint": {
      "blockNumber": 74880,
      "blockHash": "0x...",
      "stateRoot": "0x...",
      "checkpointedAt": "2024-01-15T14:30:00Z"
    },
    "blocksBehind": 12,
    "estimatedNextCheckpoint": 120 // seconds
  },
  "l2": {
    "chainId": 167001,
    "currentBlock": 12456,
    "latestCheckpoint": { ... },
    "blocksBehind": 6,
    "estimatedNextCheckpoint": 60
  },
  "updatedAt": "2024-01-15T14:32:15Z"
}
```

### GET /api/checkpoints?direction=l1-to-l2&limit=10
Returns recent checkpoints.

```typescript
// Response
{
  "direction": "l1-to-l2",
  "checkpoints": [
    {
      "blockNumber": 74880,
      "blockHash": "0x7f29e552...",
      "stateRoot": "0x920d9f5f...",
      "transactionHash": "0x...",
      "checkpointedAt": "2024-01-15T14:30:00Z",
      "checkpointedInBlock": 12455
    },
    // ...
  ]
}
```

### POST /api/check-proof
Check if proof can be generated for a transaction.

```typescript
// Request
{
  "txHashOrBlock": "0x184d3f36..." | 74856,
  "direction": "l1-to-l2"
}

// Response
{
  "ready": true,
  "sourceBlock": 74856,
  "proofBlock": 74860,
  "checkpoint": {
    "blockNumber": 74860,
    "blockHash": "0x...",
    "stateRoot": "0x..."
  },
  "commands": {
    "proofGenerator": "node dist/index.cjs --rpc https://... --account 0x... --slot 0x... --block 74860",
    "forgeVerify": "forge script scripts/taiko/verify-on-chain.s.sol --sig 'verifyL1MessageOnL2()' ..."
  }
}

// If not ready:
{
  "ready": false,
  "sourceBlock": 74890,
  "estimatedWaitSeconds": 120,
  "message": "Block 74890 is not yet checkpointed. Latest checkpoint: 74880"
}
```

## Key Implementation Details

### 1. Fetching Checkpoints (SignalService Events)

```typescript
// lib/contracts/signal-service.ts
import { createPublicClient, http, parseAbiItem } from 'viem';

const CHECKPOINT_SAVED_EVENT = parseAbiItem(
  'event CheckpointSaved(uint48 indexed blockNumber, bytes32 blockHash, bytes32 stateRoot)'
);

export async function getRecentCheckpoints(
  rpc: string,
  signalService: `0x${string}`,
  limit: number = 20
) {
  const client = createPublicClient({ transport: http(rpc) });
  const currentBlock = await client.getBlockNumber();

  // Search last 200 blocks (~20 checkpoints)
  const logs = await client.getLogs({
    address: signalService,
    event: CHECKPOINT_SAVED_EVENT,
    fromBlock: currentBlock - 200n,
    toBlock: 'latest'
  });

  return logs
    .map(log => ({
      blockNumber: Number(log.args.blockNumber),
      blockHash: log.args.blockHash,
      stateRoot: log.args.stateRoot,
      transactionHash: log.transactionHash,
      checkpointedInBlock: Number(log.blockNumber)
    }))
    .reverse()
    .slice(0, limit);
}
```

### 2. Real-Time Updates with TanStack Query

```typescript
// lib/hooks/use-chain-status.ts
import { useQuery } from '@tanstack/react-query';

export function useChainStatus() {
  return useQuery({
    queryKey: ['chain-status'],
    queryFn: async () => {
      const res = await fetch('/api/status');
      return res.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 3000,
  });
}
```

### 3. Checkpoint Timeline Component

```tsx
// components/checkpoint-timeline.tsx
export function CheckpointTimeline({ checkpoints, currentBlock }) {
  return (
    <div className="relative h-16">
      {/* Timeline line */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300" />

      {/* Checkpoint markers */}
      {checkpoints.map((cp, i) => (
        <div
          key={cp.blockNumber}
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: `${calculatePosition(cp.blockNumber, checkpoints)}%` }}
        >
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="absolute -bottom-6 text-xs">
            {cp.blockNumber.toLocaleString()}
          </span>
        </div>
      ))}

      {/* Current block marker */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{ left: '95%' }}
      >
        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
        <span className="absolute -bottom-6 text-xs font-bold">
          {currentBlock.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
```

## Environment Variables

```bash
# .env.example

# Taiko Internal Testnet
NEXT_PUBLIC_L1_RPC=https://l1rpc.internal.taiko.xyz
NEXT_PUBLIC_L2_RPC=https://rpc.internal.taiko.xyz
NEXT_PUBLIC_L1_CHAIN_ID=32382
NEXT_PUBLIC_L2_CHAIN_ID=167001

# SignalService addresses
NEXT_PUBLIC_L1_SIGNAL_SERVICE=0xbB128Fd4942e8143B8dc10f38CCfeADb32544264
NEXT_PUBLIC_L2_SIGNAL_SERVICE=0x1670010000000000000000000000000000000005

# Deployed Broadcaster contracts (for proof checker)
NEXT_PUBLIC_L1_BROADCASTER=0x6BdBb69660E6849b98e8C524d266a0005D3655F7
NEXT_PUBLIC_L2_BROADCASTER=0x6BdBb69660E6849b98e8C524d266a0005D3655F7

# Optional: Explorer URLs
NEXT_PUBLIC_L1_EXPLORER=https://l1explorer.internal.taiko.xyz
NEXT_PUBLIC_L2_EXPLORER=https://blockscout.internal.taiko.xyz
```

## Deployment to Vercel

```bash
# 1. Create repository
cd taiko-state-viewer
git init
git add .
git commit -m "Initial commit"

# 2. Push to GitHub
gh repo create taiko-state-viewer --public --source=. --push

# 3. Deploy to Vercel
vercel

# 4. Set environment variables
vercel env add NEXT_PUBLIC_L1_RPC
vercel env add NEXT_PUBLIC_L2_RPC
# ... etc

# 5. Production deploy
vercel --prod
```

## Implementation Plan

### Phase 1: Core Dashboard (Day 1)
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Tailwind CSS and shadcn/ui
- [ ] Create chain status API endpoint
- [ ] Build ChainStatusCard component
- [ ] Basic layout and styling

### Phase 2: Checkpoint Data (Day 1-2)
- [ ] Implement SignalService event fetching
- [ ] Create checkpoints API endpoint
- [ ] Build CheckpointTable component
- [ ] Add auto-refresh with TanStack Query

### Phase 3: Proof Checker (Day 2)
- [ ] Create proof readiness API endpoint
- [ ] Build ProofChecker form component
- [ ] Implement command generator
- [ ] Add clipboard copy functionality

### Phase 4: Visualization (Day 2-3)
- [ ] Build CheckpointTimeline component
- [ ] Add time-based statistics
- [ ] Responsive design polish

### Phase 5: Deployment (Day 3)
- [ ] Configure Vercel project
- [ ] Set up environment variables
- [ ] Deploy to production
- [ ] Test with real transactions

## Future Enhancements

1. **Multi-Network Support**: Dropdown to switch between Taiko testnets/mainnet
2. **WebSocket Updates**: Real-time updates without polling
3. **Proof Generation**: Generate proofs directly in browser (WASM)
4. **Transaction Tracker**: Track specific TX across chains
5. **API Rate Limiting**: Protect against abuse
6. **Historical Charts**: Checkpoint frequency over time
7. **Mobile App**: React Native version

## Quick Start Commands

```bash
# Create project
npx create-next-app@latest taiko-state-viewer --typescript --tailwind --eslint --app --src-dir=false

# Install dependencies
cd taiko-state-viewer
npm install viem @tanstack/react-query
npx shadcn-ui@latest init
npx shadcn-ui@latest add card button input table badge

# Start development
npm run dev

# Build for production
npm run build

# Deploy
vercel
```

---

## Summary

This Taiko State Viewer will provide:

| Feature | Benefit |
|---------|---------|
| **Real-time chain status** | Know current block instantly |
| **Checkpoint monitoring** | See what's provable right now |
| **Proof readiness checker** | Don't guess, know immediately |
| **Command generator** | One-click proof commands |
| **Visual timeline** | Understand checkpoint patterns |

The tool transforms a manual, error-prone process into a visual, instant experience for developers working with Taiko cross-chain messaging.
