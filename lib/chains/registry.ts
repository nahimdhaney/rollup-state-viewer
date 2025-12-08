// Chain registry - central place to register all supported chains

import { ChainConfig } from './types';

export const chainConfigs: Record<string, ChainConfig> = {
  taiko: {
    id: 'taiko',
    name: 'Taiko',
    shortName: 'Taiko',
    directions: {
      l1ToL2: true,
      l2ToL1: true,
    },
    contracts: {
      l1: {
        address: process.env.NEXT_PUBLIC_TAIKO_L1_SIGNAL_SERVICE || process.env.TAIKO_L1_SIGNAL_SERVICE || '',
        rpc: process.env.TAIKO_L1_RPC || '',
        chainId: 1,
        explorerUrl: 'https://etherscan.io',
      },
      l2: {
        address: process.env.NEXT_PUBLIC_TAIKO_L2_SIGNAL_SERVICE || process.env.TAIKO_L2_SIGNAL_SERVICE || '',
        rpc: process.env.TAIKO_L2_RPC || '',
        chainId: 167000,
        explorerUrl: 'https://taikoscan.io',
      },
    },
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    shortName: 'Arbitrum',
    directions: {
      l1ToL2: true,  // L1 state provable on L2 via Outbox.roots
      l2ToL1: true,  // L2 state provable on L1 via Block Hash Buffer
    },
    contracts: {
      l1: {
        // Outbox contract on L1 - stores sendRoots
        address: process.env.NEXT_PUBLIC_ARBITRUM_L1_OUTBOX || process.env.ARBITRUM_L1_OUTBOX || '0x0B9857ae2D4A3DBe74ffE1d7DF045bb7F96E4840',
        rpc: process.env.ARBITRUM_L1_RPC || '',
        chainId: 1,
        explorerUrl: 'https://etherscan.io',
      },
      l2: {
        // Block Hash Buffer precompile on L2
        address: process.env.NEXT_PUBLIC_ARBITRUM_L2_ARBSYS || process.env.ARBITRUM_L2_ARBSYS || '0x0000000000000000000000000000000000000064',
        rpc: process.env.ARBITRUM_L2_RPC || '',
        chainId: 42161,
        explorerUrl: 'https://arbiscan.io',
      },
    },
  },
};

export const supportedChains = Object.keys(chainConfigs);

export function getChainConfig(chainId: string): ChainConfig | null {
  return chainConfigs[chainId] || null;
}
