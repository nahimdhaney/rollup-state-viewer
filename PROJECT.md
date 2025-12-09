# Rollup State Viewer

A real-time dashboard for monitoring rollup cross-chain checkpoint state, helping developers understand when cross-chain proofs can be generated and verified.

## Supported Chains

| Chain | Networks | Checkpoint Events |
|-------|----------|-------------------|
| **Taiko** | Testnet, Mainnet | `CheckpointSaved` on SignalService |
| **Arbitrum** | Sepolia, One | `SendRootUpdated` on Outbox |

## Features

### 1. Real-Time Chain Status
- Current block number on L1 and L2
- Live updates via polling (5-10s intervals)
- Connection status indicators

### 2. Checkpoint Monitoring
- Latest checkpointed block for each direction
- Time since last checkpoint
- Visual timeline of recent checkpoints

### 3. Proof Readiness Checker
- Input: Block number
- Output: Whether proof can be generated now
- Shows block hash, state root, send root

### 4. Storage Proof Generator
- Generate Merkle proofs for cross-chain verification
- Download proof as JSON
- Copy to clipboard

### 5. Network Toggle
- Switch between testnet and mainnet environments
- Persisted configuration per chain

## Technical Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   Vercel    │────▶│  Chain RPCs │
│   (React)   │◀────│  (Next.js)  │◀────│  L1 & L2    │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                    │
      ▼                   ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  TanStack   │     │   API       │     │   Chain     │
│   Query     │     │  Routes     │     │  Adapters   │
│  (caching)  │     │  /api/*     │     │  (viem)     │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Tech Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| **Framework** | Next.js 14 (App Router) | Best Vercel integration, SSR, API routes |
| **Styling** | Tailwind CSS + shadcn/ui | Fast development, beautiful components |
| **State** | TanStack Query | Caching, refetching, real-time updates |
| **Blockchain** | viem | TypeScript-first, lightweight |
| **Proofs** | openintents-storage-proof-generator | Merkle proof generation |
| **Deployment** | Vercel | Zero-config, edge functions |

## Project Structure

```
rollup-state-viewer/
├── app/
│   ├── api/
│   │   ├── chains/[chain]/
│   │   │   ├── status/route.ts
│   │   │   ├── checkpoints/route.ts
│   │   │   └── check-proof/route.ts
│   │   └── generate-proof/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── chain-panel.tsx
│   ├── chain-tabs.tsx
│   ├── multi-chain-proof-checker.tsx
│   ├── proof-generator.tsx
│   ├── network-toggle.tsx
│   ├── theme-toggle.tsx
│   ├── providers.tsx
│   └── ui/
├── lib/
│   └── chains/
│       ├── index.ts           # Adapter factory
│       ├── registry.ts        # Chain configurations
│       ├── types.ts           # TypeScript types
│       ├── network-context.tsx
│       ├── taiko-adapter.ts   # Taiko implementation
│       └── arbitrum-adapter.ts # Arbitrum implementation
└── ...
```

## Adding New Chains

1. Create a new adapter in `lib/chains/` implementing `ChainAdapter`:

```typescript
export class NewChainAdapter implements ChainAdapter {
  config: ChainConfig;

  constructor(config: ChainConfig) {
    this.config = config;
  }

  async getStatus(direction: 'l1ToL2' | 'l2ToL1'): Promise<ChainStatus> { ... }
  async getCheckpoints(direction: 'l1ToL2' | 'l2ToL1', limit?: number): Promise<Checkpoint[]> { ... }
  async checkProof(direction: 'l1ToL2' | 'l2ToL1', blockNumber: number): Promise<ProofResult> { ... }
}
```

2. Add chain config to `lib/chains/registry.ts` for both testnet and mainnet
3. Register the adapter in `lib/chains/index.ts`

## API Endpoints

### GET /api/chains/[chain]/status
Returns current chain status.

Query params: `direction`, `network`

### GET /api/chains/[chain]/checkpoints
Returns recent checkpoints.

Query params: `direction`, `limit`, `network`

### GET /api/chains/[chain]/check-proof
Check if a block is ready for proof generation.

Query params: `direction`, `blockNumber`, `network`

### POST /api/generate-proof
Generate a storage proof.

Body: `{ chain, network, blockNumber, direction, storageSlot? }`

## License

MIT
