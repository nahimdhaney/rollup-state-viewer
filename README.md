# Rollup State Viewer

A real-time dashboard for monitoring rollup cross-chain checkpoint state, helping developers understand when cross-chain proofs can be generated and verified.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## Supported Chains

- **Taiko** - Testnet & Mainnet
- **Arbitrum** - Sepolia & One

## Features

- **Multi-Chain Support** - Monitor multiple L2 networks from a single dashboard
- **Network Toggle** - Switch between testnet and mainnet environments
- **Real-time Chain Status** - Monitor current block numbers on L1 and L2 with auto-refresh
- **Checkpoint Monitoring** - View latest checkpointed blocks in each direction (L1→L2 and L2→L1)
- **Proof Readiness Checker** - Check if a specific block is ready for proof generation
- **Storage Proof Generator** - Generate Merkle proofs for cross-chain verification
- **Recent Checkpoints Table** - Browse historical checkpoint data with timestamps

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query
- **Blockchain**: viem
- **Proofs**: openintents-storage-proof-generator

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/rollup-state-viewer.git
cd rollup-state-viewer

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Environment Variables

Configure these in `.env.local`:

```bash
# Taiko Testnet
TAIKO_TESTNET_L1_RPC=https://l1rpc.internal.taiko.xyz
TAIKO_TESTNET_L2_RPC=https://rpc.internal.taiko.xyz
TAIKO_TESTNET_L1_BROADCASTER=0x6BdBb69660E6849b98e8C524d266a0005D3655F7
TAIKO_TESTNET_L2_BROADCASTER=0x6BdBb69660E6849b98e8C524d266a0005D3655F7

# Taiko Mainnet
TAIKO_MAINNET_L1_RPC=https://eth.llamarpc.com
TAIKO_MAINNET_L2_RPC=https://rpc.mainnet.taiko.xyz

# Arbitrum Sepolia
ARBITRUM_SEPOLIA_L1_RPC=https://sepolia.drpc.org
ARBITRUM_SEPOLIA_L2_RPC=https://sepolia-rollup.arbitrum.io/rpc

# Arbitrum Mainnet
ARBITRUM_L1_RPC=https://eth.llamarpc.com
ARBITRUM_L2_RPC=https://arb1.arbitrum.io/rpc
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chains/[chain]/status` | GET | Returns current chain status (query: `direction`, `network`) |
| `/api/chains/[chain]/checkpoints` | GET | Returns recent checkpoints (query: `direction`, `limit`, `network`) |
| `/api/chains/[chain]/check-proof` | GET | Check if a block is ready for proof generation |
| `/api/generate-proof` | POST | Generate a storage proof for cross-chain verification |

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
│   ├── providers.tsx
│   └── ui/
├── lib/
│   └── chains/
│       ├── index.ts
│       ├── registry.ts
│       ├── types.ts
│       ├── network-context.tsx
│       ├── taiko-adapter.ts
│       └── arbitrum-adapter.ts
└── ...
```

## Adding New Chains

1. Create a new adapter in `lib/chains/` implementing `ChainAdapter`
2. Add chain config to `lib/chains/registry.ts` for both testnet and mainnet
3. Register the adapter in `lib/chains/index.ts`

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Then deploy to production
vercel --prod
```

## How It Works

The dashboard monitors checkpoint events from L2 bridge contracts:

- **Taiko**: Monitors `CheckpointSaved` events from SignalService contracts
- **Arbitrum**: Monitors `SendRootUpdated` events from Outbox contract

These checkpoints indicate which blocks can be used for generating cross-chain storage proofs.

## License

MIT
