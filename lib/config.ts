export const config = {
  l1: {
    chainId: parseInt(process.env.NEXT_PUBLIC_L1_CHAIN_ID || '32382'),
    name: process.env.NEXT_PUBLIC_L1_CHAIN_NAME || 'Taiko L1',
    rpc: process.env.NEXT_PUBLIC_L1_RPC || 'https://l1rpc.internal.taiko.xyz',
    signalService: (process.env.NEXT_PUBLIC_L1_SIGNAL_SERVICE || '0xbB128Fd4942e8143B8dc10f38CCfeADb32544264') as `0x${string}`,
    broadcaster: (process.env.NEXT_PUBLIC_L1_BROADCASTER || '0x6BdBb69660E6849b98e8C524d266a0005D3655F7') as `0x${string}`,
    explorer: process.env.NEXT_PUBLIC_L1_EXPLORER || 'https://l1explorer.internal.taiko.xyz',
  },
  l2: {
    chainId: parseInt(process.env.NEXT_PUBLIC_L2_CHAIN_ID || '167001'),
    name: process.env.NEXT_PUBLIC_L2_CHAIN_NAME || 'Taiko L2',
    rpc: process.env.NEXT_PUBLIC_L2_RPC || 'https://rpc.internal.taiko.xyz',
    signalService: (process.env.NEXT_PUBLIC_L2_SIGNAL_SERVICE || '0x1670010000000000000000000000000000000005') as `0x${string}`,
    broadcaster: (process.env.NEXT_PUBLIC_L2_BROADCASTER || '0x6BdBb69660E6849b98e8C524d266a0005D3655F7') as `0x${string}`,
    explorer: process.env.NEXT_PUBLIC_L2_EXPLORER || 'https://blockscout.internal.taiko.xyz',
  },
  checkpointsSlot: parseInt(process.env.NEXT_PUBLIC_CHECKPOINTS_SLOT || '254'),
  refreshInterval: parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL || '5000'),
};

export type ChainConfig = typeof config.l1;
export type Layer = 'l1' | 'l2';
