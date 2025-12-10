'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChainPanel } from '@/components/chain-panel';
import { supportedChains, getChainConfig } from '@/lib/chains/registry';
import { useNetwork } from '@/lib/chains/network-context';

function parseHash(): { chain: string | null; direction: 'l1ToL2' | 'l2ToL1' | null } {
  if (typeof window === 'undefined') return { chain: null, direction: null };

  const hash = window.location.hash.slice(1); // Remove #
  if (!hash) return { chain: null, direction: null };

  const parts = hash.split('-');
  const chain = parts[0]?.toLowerCase() || null;
  const directionPart = parts[1]?.toLowerCase();

  let direction: 'l1ToL2' | 'l2ToL1' | null = null;
  if (directionPart === 'l1tol2') direction = 'l1ToL2';
  else if (directionPart === 'l2tol1') direction = 'l2ToL1';

  return { chain, direction };
}

export function ChainTabs() {
  const { network } = useNetwork();
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeChain, setActiveChain] = useState<string>(supportedChains[0]);
  const [activeDirection, setActiveDirection] = useState<'l1ToL2' | 'l2ToL1'>('l2ToL1');

  // Update URL hash when chain or direction changes
  const updateHash = useCallback((chain: string, direction: 'l1ToL2' | 'l2ToL1') => {
    if (typeof window === 'undefined') return;
    const newHash = `#${chain}-${direction.toLowerCase()}`;
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash);
    }
  }, []);

  // Initialize from URL hash on mount (client-side only)
  useEffect(() => {
    const { chain, direction } = parseHash();
    if (chain && supportedChains.includes(chain)) {
      setActiveChain(chain);
    }
    if (direction) {
      setActiveDirection(direction);
    }
    setIsInitialized(true);
  }, []);

  // Handle hash change from browser navigation
  useEffect(() => {
    const handleHashChange = () => {
      const { chain, direction } = parseHash();
      if (chain && supportedChains.includes(chain)) {
        setActiveChain(chain);
      }
      if (direction) {
        setActiveDirection(direction);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when chain changes
  const handleChainChange = (chain: string) => {
    setActiveChain(chain);
    updateHash(chain, activeDirection);
  };

  // Callback for direction changes from ChainPanel
  const handleDirectionChange = (direction: 'l1ToL2' | 'l2ToL1') => {
    setActiveDirection(direction);
    updateHash(activeChain, direction);
  };

  // Update hash after initialization
  useEffect(() => {
    if (isInitialized) {
      updateHash(activeChain, activeDirection);
    }
  }, [isInitialized, activeChain, activeDirection, updateHash]);

  return (
    <Tabs value={activeChain} onValueChange={handleChainChange} className="w-full">
      <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${supportedChains.length}, 1fr)` }}>
        {supportedChains.map((chainId) => {
          const config = getChainConfig(chainId, network);
          return (
            <TabsTrigger key={chainId} value={chainId} className="flex items-center gap-2">
              {config?.shortName || chainId}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {supportedChains.map((chainId) => (
        <TabsContent key={chainId} value={chainId} className="mt-6">
          <ChainPanel
            chainId={chainId}
            isActive={activeChain === chainId}
            initialDirection={activeDirection}
            onDirectionChange={handleDirectionChange}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
