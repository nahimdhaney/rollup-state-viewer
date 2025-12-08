'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChainPanel } from '@/components/chain-panel';
import { chainConfigs, supportedChains } from '@/lib/chains/registry';

export function ChainTabs() {
  const [activeChain, setActiveChain] = useState(supportedChains[0]);

  return (
    <Tabs value={activeChain} onValueChange={setActiveChain} className="w-full">
      <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${supportedChains.length}, 1fr)` }}>
        {supportedChains.map((chainId) => {
          const config = chainConfigs[chainId];
          return (
            <TabsTrigger key={chainId} value={chainId} className="flex items-center gap-2">
              {config.shortName}
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
