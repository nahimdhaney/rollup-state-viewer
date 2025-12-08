'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { NetworkType } from './types';

interface NetworkContextType {
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
}

const NetworkContext = createContext<NetworkContextType>({
  network: 'testnet',
  setNetwork: () => {},
});

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetwork] = useState<NetworkType>('testnet');

  return (
    <NetworkContext.Provider value={{ network, setNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
