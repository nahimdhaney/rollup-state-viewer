'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Search } from 'lucide-react';
import type { ProofResult, NetworkType } from '@/lib/chains/types';

interface MultiChainProofCheckerProps {
  chainId: string;
  direction: 'l1ToL2' | 'l2ToL1';
  network: NetworkType;
}

export function MultiChainProofChecker({ chainId, direction, network }: MultiChainProofCheckerProps) {
  const [blockNumber, setBlockNumber] = useState('');
  const [queryEnabled, setQueryEnabled] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<ProofResult>({
    queryKey: ['check-proof', chainId, direction, blockNumber, network],
    queryFn: async () => {
      const res = await fetch(
        `/api/chains/${chainId}/check-proof?direction=${direction}&blockNumber=${blockNumber}&network=${network}`
      );
      if (!res.ok) throw new Error('Failed to check proof');
      return res.json();
    },
    enabled: queryEnabled && !!blockNumber,
    retry: false,
  });

  const handleCheck = () => {
    if (blockNumber) {
      setQueryEnabled(true);
      refetch();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCheck();
    }
  };

  const sourceLabel = direction === 'l1ToL2' ? 'L1' : 'L2';
  const targetLabel = direction === 'l1ToL2' ? 'L2' : 'L1';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Check Block Availability</CardTitle>
        <p className="text-sm text-muted-foreground">
          Check if a {sourceLabel} block can be proven on {targetLabel}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={`Enter ${sourceLabel} block number`}
            value={blockNumber}
            onChange={(e) => {
              setBlockNumber(e.target.value);
              setQueryEnabled(false);
            }}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleCheck} disabled={!blockNumber || isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {queryEnabled && data && (
          <div className={`p-4 rounded-lg border ${
            data.exists
              ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900'
              : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900'
          }`}>
            <div className="flex items-start gap-3">
              {data.exists ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              )}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    Block {data.blockNumber.toLocaleString()}
                  </span>
                  <Badge variant={data.exists ? 'success' : 'warning'}>
                    {data.exists ? 'Provable' : 'Not Yet Provable'}
                  </Badge>
                </div>

                {data.exists ? (
                  <div className="space-y-1 text-sm">
                    {data.blockHash && (
                      <p className="font-mono text-xs text-muted-foreground">
                        Hash: {data.blockHash}
                      </p>
                    )}
                    {data.stateRoot && (
                      <p className="font-mono text-xs text-muted-foreground">
                        State Root: {data.stateRoot}
                      </p>
                    )}
                    {data.sendRoot && (
                      <p className="font-mono text-xs text-muted-foreground">
                        Send Root: {data.sendRoot}
                      </p>
                    )}
                    <p className="text-green-700 dark:text-green-400 mt-2">
                      This block can be used for cross-chain proofs.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    {data.error || 'This block has not been checkpointed yet.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {queryEnabled && error && (
          <div className="p-4 rounded-lg border bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900">
            <p className="text-sm text-red-700 dark:text-red-400">
              Error checking block: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
