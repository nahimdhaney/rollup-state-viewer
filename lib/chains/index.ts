// Chain adapters index - factory for creating chain adapters

export * from './types';
export * from './registry';

import { ChainAdapter } from './types';
import { TaikoAdapter } from './taiko-adapter';
import { ArbitrumAdapter } from './arbitrum-adapter';
import { supportedChains } from './registry';

// Singleton instances for adapters
const adapterInstances: Map<string, ChainAdapter> = new Map();

export function getChainAdapter(chainId: string): ChainAdapter | null {
  if (!supportedChains.includes(chainId)) {
    return null;
  }

  // Return cached instance if available
  if (adapterInstances.has(chainId)) {
    return adapterInstances.get(chainId)!;
  }

  // Create new adapter instance
  let adapter: ChainAdapter | null = null;

  switch (chainId) {
    case 'taiko':
      adapter = new TaikoAdapter();
      break;
    case 'arbitrum':
      adapter = new ArbitrumAdapter();
      break;
    default:
      return null;
  }

  if (adapter) {
    adapterInstances.set(chainId, adapter);
  }

  return adapter;
}

export function getAllChainAdapters(): ChainAdapter[] {
  return supportedChains
    .map(chainId => getChainAdapter(chainId))
    .filter((adapter): adapter is ChainAdapter => adapter !== null);
}
