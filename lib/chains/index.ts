// Chain adapters index - factory for creating chain adapters

export * from './types';
export * from './registry';
export * from './network-context';

import { ChainAdapter, NetworkType } from './types';
import { TaikoAdapter } from './taiko-adapter';
import { ArbitrumAdapter } from './arbitrum-adapter';
import { getSupportedChains, getChainConfig } from './registry';

// Cache adapters by network+chainId
const adapterInstances: Map<string, ChainAdapter> = new Map();

function getCacheKey(chainId: string, network: NetworkType): string {
  return `${network}:${chainId}`;
}

export function getChainAdapter(chainId: string, network: NetworkType = 'testnet'): ChainAdapter | null {
  const supportedChains = getSupportedChains(network);

  if (!supportedChains.includes(chainId)) {
    return null;
  }

  const cacheKey = getCacheKey(chainId, network);

  // Return cached instance if available
  if (adapterInstances.has(cacheKey)) {
    return adapterInstances.get(cacheKey)!;
  }

  // Get config for this network+chain
  const config = getChainConfig(chainId, network);
  if (!config) {
    return null;
  }

  // Create new adapter instance with config
  let adapter: ChainAdapter | null = null;

  switch (chainId) {
    case 'taiko':
      adapter = new TaikoAdapter(config);
      break;
    case 'arbitrum':
      adapter = new ArbitrumAdapter(config);
      break;
    default:
      return null;
  }

  if (adapter) {
    adapterInstances.set(cacheKey, adapter);
  }

  return adapter;
}

export function getAllChainAdapters(network: NetworkType = 'testnet'): ChainAdapter[] {
  const supportedChains = getSupportedChains(network);
  return supportedChains
    .map(chainId => getChainAdapter(chainId, network))
    .filter((adapter): adapter is ChainAdapter => adapter !== null);
}
