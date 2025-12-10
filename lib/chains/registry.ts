// Chain registry - central place to register all supported chains

import { ChainConfig, NetworkType } from './types';

// Chain configs organized by network type
export const chainConfigs: Record<NetworkType, Record<string, ChainConfig>> = {
  testnet: {
    taiko: {
      id: 'taiko',
      name: 'Taiko (Testnet)',
      shortName: 'Taiko',
      directions: {
        l1ToL2: true,
        l2ToL1: true,
      },
      supportsProofGeneration: true,
      blockTime: {
        l1: 12000,  // 12 seconds
        l2: 3000,   // ~3 seconds on testnet
      },
      contracts: {
        l1: {
          address: process.env.NEXT_PUBLIC_TAIKO_TESTNET_L1_SIGNAL_SERVICE ||
            process.env.TAIKO_TESTNET_L1_SIGNAL_SERVICE ||
            process.env.TAIKO_L1_SIGNAL_SERVICE ||
            '0x53789e39E3310737E8C8cED483032AAc25B39ded',
          rpc: process.env.TAIKO_TESTNET_L1_RPC || process.env.TAIKO_L1_RPC || 'https://l1rpc.internal.taiko.xyz',
          chainId: 32382,
          explorerUrl: 'https://l1explorer.internal.taiko.xyz',
          broadcaster: process.env.TAIKO_TESTNET_L1_BROADCASTER || '0x6BdBb69660E6849b98e8C524d266a0005D3655F7',
          checkpointsSlot: 254,
        },
        l2: {
          address: process.env.NEXT_PUBLIC_TAIKO_TESTNET_L2_SIGNAL_SERVICE ||
            process.env.TAIKO_TESTNET_L2_SIGNAL_SERVICE ||
            process.env.TAIKO_L2_SIGNAL_SERVICE ||
            '0x1670010000000000000000000000000000000005',
          rpc: process.env.TAIKO_TESTNET_L2_RPC || process.env.TAIKO_L2_RPC || 'https://rpc.internal.taiko.xyz',
          chainId: 167001,
          explorerUrl: 'https://blockscout.internal.taiko.xyz',
          broadcaster: process.env.TAIKO_TESTNET_L2_BROADCASTER || '0x6BdBb69660E6849b98e8C524d266a0005D3655F7',
          checkpointsSlot: 254,
        },
      },
    },
    linea: {
      id: 'linea',
      name: 'Linea (Sepolia)',
      shortName: 'Linea',
      directions: {
        l1ToL2: true,
        l2ToL1: true,
      },
      supportsProofGeneration: true,
      blockTime: {
        l1: 12000,  // 12 seconds (Sepolia)
        l2: 2000,   // ~2 seconds
      },
      contracts: {
        l1: {
          // LineaRollup contract on Sepolia
          address: process.env.NEXT_PUBLIC_LINEA_SEPOLIA_L1_ROLLUP ||
            process.env.LINEA_SEPOLIA_L1_ROLLUP ||
            '0xB218f8A4Bc926cF1cA7b3423c154a0D627Bdb7E5',
          rpc: process.env.LINEA_SEPOLIA_L1_RPC || 'https://sepolia.drpc.org',
          chainId: 11155111,
          explorerUrl: 'https://sepolia.etherscan.io',
          broadcaster: process.env.LINEA_SEPOLIA_L1_BROADCASTER || '0x20728d202A12f8306d01D0E54aE99885AfA31d83',
          checkpointsSlot: 282, // stateRootHashes mapping slot
        },
        l2: {
          // L1MessageService on Linea Sepolia
          address: process.env.NEXT_PUBLIC_LINEA_SEPOLIA_L2_MESSAGE_SERVICE ||
            process.env.LINEA_SEPOLIA_L2_MESSAGE_SERVICE ||
            '0x508Ca82Df566dCD1B0DE8296634F3E2F3E66C6CD',
          rpc: process.env.LINEA_SEPOLIA_L2_RPC || 'https://rpc.sepolia.linea.build',
          chainId: 59141,
          explorerUrl: 'https://sepolia.lineascan.build',
          broadcaster: process.env.LINEA_SEPOLIA_L2_BROADCASTER,
          checkpointsSlot: 282,
        },
      },
    },
    arbitrum: {
      id: 'arbitrum',
      name: 'Arbitrum (Sepolia)',
      shortName: 'Arbitrum',
      directions: {
        l1ToL2: true,
        l2ToL1: true,
      },
      blockTime: {
        l1: 12000,  // 12 seconds (Sepolia)
        l2: 250,    // ~250ms
      },
      contracts: {
        l1: {
          // Outbox contract on Sepolia
          address: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_L1_OUTBOX ||
            process.env.ARBITRUM_SEPOLIA_L1_OUTBOX ||
            '0x65f07C7D521164a4d5DaC6eB8Fac8DA067A3B78F',
          rpc: process.env.ARBITRUM_SEPOLIA_L1_RPC || 'https://sepolia.drpc.org',
          chainId: 11155111,
          explorerUrl: 'https://sepolia.etherscan.io',
        },
        l2: {
          // ArbSys precompile on Arbitrum Sepolia
          address: '0x0000000000000000000000000000000000000064',
          rpc: process.env.ARBITRUM_SEPOLIA_L2_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
          chainId: 421614,
          explorerUrl: 'https://sepolia.arbiscan.io',
        },
      },
    },
  },
  mainnet: {
    taiko: {
      id: 'taiko',
      name: 'Taiko',
      shortName: 'Taiko',
      directions: {
        l1ToL2: true,
        l2ToL1: true,
      },
      supportsProofGeneration: true,
      blockTime: {
        l1: 12000,  // 12 seconds (Ethereum)
        l2: 12000,  // ~12 seconds (based rollup)
      },
      contracts: {
        l1: {
          address: process.env.NEXT_PUBLIC_TAIKO_MAINNET_L1_SIGNAL_SERVICE ||
            process.env.TAIKO_MAINNET_L1_SIGNAL_SERVICE ||
            '0x9e0a24964e5397B566c1ed39258e21aB5E35C77C', // Taiko mainnet SignalService on Ethereum
          rpc: process.env.TAIKO_MAINNET_L1_RPC || 'https://eth.llamarpc.com',
          chainId: 1,
          explorerUrl: 'https://etherscan.io',
          broadcaster: process.env.TAIKO_MAINNET_L1_BROADCASTER,
          checkpointsSlot: 254,
        },
        l2: {
          address: process.env.NEXT_PUBLIC_TAIKO_MAINNET_L2_SIGNAL_SERVICE ||
            process.env.TAIKO_MAINNET_L2_SIGNAL_SERVICE ||
            '0x1670000000000000000000000000000000000005', // Taiko mainnet SignalService
          rpc: process.env.TAIKO_MAINNET_L2_RPC || 'https://rpc.mainnet.taiko.xyz',
          chainId: 167000,
          explorerUrl: 'https://taikoscan.io',
          broadcaster: process.env.TAIKO_MAINNET_L2_BROADCASTER,
          checkpointsSlot: 254,
        },
      },
    },
    linea: {
      id: 'linea',
      name: 'Linea',
      shortName: 'Linea',
      directions: {
        l1ToL2: true,
        l2ToL1: true,
      },
      supportsProofGeneration: true,
      blockTime: {
        l1: 12000,  // 12 seconds (Ethereum)
        l2: 2000,   // ~2 seconds
      },
      contracts: {
        l1: {
          // LineaRollup contract on Ethereum mainnet
          address: process.env.NEXT_PUBLIC_LINEA_MAINNET_L1_ROLLUP ||
            process.env.LINEA_MAINNET_L1_ROLLUP ||
            '0xd19d4B5d358258f05D7B411E21A1460D11B0876F',
          rpc: process.env.LINEA_MAINNET_L1_RPC || 'https://eth.llamarpc.com',
          chainId: 1,
          explorerUrl: 'https://etherscan.io',
          broadcaster: process.env.LINEA_MAINNET_L1_BROADCASTER,
          checkpointsSlot: 282, // stateRootHashes mapping slot
        },
        l2: {
          // L1MessageService on Linea mainnet
          address: process.env.NEXT_PUBLIC_LINEA_MAINNET_L2_MESSAGE_SERVICE ||
            process.env.LINEA_MAINNET_L2_MESSAGE_SERVICE ||
            '0x508Ca82Df566dCD1B0DE8296634F3E2F3E66C6CD',
          rpc: process.env.LINEA_MAINNET_L2_RPC || 'https://rpc.linea.build',
          chainId: 59144,
          explorerUrl: 'https://lineascan.build',
          broadcaster: process.env.LINEA_MAINNET_L2_BROADCASTER,
          checkpointsSlot: 282,
        },
      },
    },
    arbitrum: {
      id: 'arbitrum',
      name: 'Arbitrum One',
      shortName: 'Arbitrum',
      directions: {
        l1ToL2: true,
        l2ToL1: true,
      },
      blockTime: {
        l1: 12000,  // 12 seconds (Ethereum)
        l2: 250,    // ~250ms
      },
      contracts: {
        l1: {
          // Outbox contract on Ethereum mainnet
          address: process.env.NEXT_PUBLIC_ARBITRUM_L1_OUTBOX ||
            process.env.ARBITRUM_L1_OUTBOX ||
            '0x0B9857ae2D4A3DBe74ffE1d7DF045bb7F96E4840',
          rpc: process.env.ARBITRUM_L1_RPC || 'https://eth.llamarpc.com',
          chainId: 1,
          explorerUrl: 'https://etherscan.io',
        },
        l2: {
          // ArbSys precompile on Arbitrum One
          address: '0x0000000000000000000000000000000000000064',
          rpc: process.env.ARBITRUM_L2_RPC || 'https://arb1.arbitrum.io/rpc',
          chainId: 42161,
          explorerUrl: 'https://arbiscan.io',
        },
      },
    },
  },
};

// Get supported chains for a network
export function getSupportedChains(network: NetworkType): string[] {
  return Object.keys(chainConfigs[network]);
}

// For backward compatibility - default to testnet
export const supportedChains = getSupportedChains('testnet');

export function getChainConfig(chainId: string, network: NetworkType = 'testnet'): ChainConfig | null {
  return chainConfigs[network]?.[chainId] || null;
}
