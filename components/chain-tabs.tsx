'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChainPanel } from '@/components/chain-panel';
import { supportedChains, getChainConfig } from '@/lib/chains/registry';
import { useNetwork } from '@/lib/chains/network-context';

export function ChainTabs() {
  const [activeChain, setActiveChain] = useState(supportedChains[0]);
  const { network } = useNetwork();

  return (
    <Tabs value={activeChain} onValueChange={setActiveChain} className="w-full">
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
          <ChainPanel chainId={chainId} isActive={activeChain === chainId} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
