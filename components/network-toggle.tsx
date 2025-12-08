'use client';

import { useNetwork } from '@/lib/chains/network-context';
import { Button } from '@/components/ui/button';
import { Globe, FlaskConical } from 'lucide-react';

export function NetworkToggle() {
  const { network, setNetwork } = useNetwork();

  const toggleNetwork = () => {
    setNetwork(network === 'mainnet' ? 'testnet' : 'mainnet');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleNetwork}
      className="flex items-center gap-2"
    >
      {network === 'mainnet' ? (
        <>
          <Globe className="h-4 w-4" />
          Mainnet
        </>
      ) : (
        <>
          <FlaskConical className="h-4 w-4" />
          Testnet
        </>
      )}
    </Button>
  );
}
