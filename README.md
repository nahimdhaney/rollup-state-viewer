# Taiko State Viewer

A real-time dashboard for monitoring Taiko L1/L2 checkpoint state, helping developers understand when cross-chain proofs can be generated and verified.

![Taiko State Viewer](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## Features

- **Real-time Chain Status** - Monitor current block numbers on L1 and L2 with auto-refresh
- **Checkpoint Monitoring** - View latest checkpointed blocks in each direction (L1→L2 and L2→L1)
- **Proof Readiness Checker** - Check if a specific block is ready for proof generation
- **Command Generator** - Generate storage proof commands with one-click copy
- **Recent Checkpoints Table** - Browse historical checkpoint data with timestamps

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query
- **Blockchain**: viem

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/nahimdhaney/taiko-state-viewer.git
cd taiko-state-viewer

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
# L1 Configuration
NEXT_PUBLIC_L1_RPC=https://l1rpc.internal.taiko.xyz
NEXT_PUBLIC_L1_CHAIN_ID=32382
NEXT_PUBLIC_L1_CHAIN_NAME=Taiko L1 (Internal)
NEXT_PUBLIC_L1_SIGNAL_SERVICE=0xbB128Fd4942e8143B8dc10f38CCfeADb32544264
NEXT_PUBLIC_L1_BROADCASTER=0x6BdBb69660E6849b98e8C524d266a0005D3655F7
NEXT_PUBLIC_L1_EXPLORER=https://l1explorer.internal.taiko.xyz

# L2 Configuration
NEXT_PUBLIC_L2_RPC=https://rpc.internal.taiko.xyz
NEXT_PUBLIC_L2_CHAIN_ID=167001
NEXT_PUBLIC_L2_CHAIN_NAME=Taiko L2 (Internal)
NEXT_PUBLIC_L2_SIGNAL_SERVICE=0x1670010000000000000000000000000000000005
NEXT_PUBLIC_L2_BROADCASTER=0x6BdBb69660E6849b98e8C524d266a0005D3655F7
NEXT_PUBLIC_L2_EXPLORER=https://blockscout.internal.taiko.xyz

# Settings
NEXT_PUBLIC_REFRESH_INTERVAL=5000
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Returns current chain status for L1 and L2 |
| `/api/checkpoints` | GET | Returns recent checkpoints (query: `direction`, `limit`) |
| `/api/check-proof` | POST | Check if a block is ready for proof generation |
| `/api/debug` | GET | Debug endpoint showing raw event data |

## Project Structure

```
taiko-state-viewer/
├── app/
│   ├── api/
│   │   ├── status/route.ts
│   │   ├── checkpoints/route.ts
│   │   ├── check-proof/route.ts
│   │   └── debug/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── chain-status-card.tsx
│   ├── checkpoint-table.tsx
│   ├── proof-checker.tsx
│   ├── providers.tsx
│   └── ui/
├── lib/
│   ├── config.ts
│   ├── signal-service.ts
│   └── utils.ts
└── ...
```

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

The dashboard monitors `CheckpointSaved` events from Taiko's SignalService contracts:

- **L1→L2**: Queries L2's SignalService for L1 block checkpoints
- **L2→L1**: Queries L1's SignalService for L2 block checkpoints

These checkpoints indicate which blocks can be used for generating cross-chain storage proofs.

## License

MIT
