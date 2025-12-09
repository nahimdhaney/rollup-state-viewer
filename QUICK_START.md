# Quick Start Guide

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open http://localhost:3000

## Environment Variables

Configure RPC endpoints in `.env.local`:

```bash
# Taiko Testnet
TAIKO_TESTNET_L1_RPC=https://l1rpc.internal.taiko.xyz
TAIKO_TESTNET_L2_RPC=https://rpc.internal.taiko.xyz
TAIKO_TESTNET_L1_BROADCASTER=0x6BdBb69660E6849b98e8C524d266a0005D3655F7
TAIKO_TESTNET_L2_BROADCASTER=0x6BdBb69660E6849b98e8C524d266a0005D3655F7

# Taiko Mainnet (optional)
TAIKO_MAINNET_L1_RPC=https://eth.llamarpc.com
TAIKO_MAINNET_L2_RPC=https://rpc.mainnet.taiko.xyz

# Arbitrum Sepolia (optional)
ARBITRUM_SEPOLIA_L1_RPC=https://sepolia.drpc.org
ARBITRUM_SEPOLIA_L2_RPC=https://sepolia-rollup.arbitrum.io/rpc

# Arbitrum Mainnet (optional)
ARBITRUM_L1_RPC=https://eth.llamarpc.com
ARBITRUM_L2_RPC=https://arb1.arbitrum.io/rpc
```

## Features

- **Network Toggle** - Switch between testnet and mainnet
- **Multi-Chain Tabs** - Monitor Taiko and Arbitrum
- **Checkpoint Monitoring** - View L1→L2 and L2→L1 checkpoints
- **Proof Readiness Checker** - Check if a block is provable
- **Storage Proof Generator** - Generate Merkle proofs for cross-chain verification

## Deploy to Vercel

```bash
npm i -g vercel
vercel
vercel --prod
```

Your site will be live at `https://your-project.vercel.app`
