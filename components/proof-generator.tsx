'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Copy, Check, FileCode } from 'lucide-react';
import type { NetworkType } from '@/lib/chains/types';

interface ProofGeneratorProps {
  chainId: string;
  direction: 'l1ToL2' | 'l2ToL1';
  network: NetworkType;
  supportsProofGeneration: boolean;
}

interface ProofResponse {
  success: boolean;
  proof: {
    blockHash: string;
    accountProof: string[];
    storageProof: string[];
    storageValue: string;
  };
  metadata: {
    chain: string;
    network: string;
    direction: string;
    sourceChainId: number;
    generatedAt: string;
  };
  error?: string;
  details?: string;
}

export function ProofGenerator({ chainId, direction, network, supportsProofGeneration }: ProofGeneratorProps) {
  const [blockNumber, setBlockNumber] = useState('');
  const [storageSlot, setStorageSlot] = useState('');
  const [copied, setCopied] = useState(false);

  const generateMutation = useMutation<ProofResponse, Error, void>({
    mutationFn: async () => {
      const res = await fetch('/api/generate-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chain: chainId,
          network,
          blockNumber: parseInt(blockNumber),
          direction,
          ...(storageSlot && { storageSlot }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Failed to generate proof');
      }
      return data;
    },
  });

  const handleGenerate = () => {
    if (blockNumber) {
      generateMutation.mutate();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGenerate();
    }
  };

  const handleCopyProof = async () => {
    if (generateMutation.data?.proof) {
      await navigator.clipboard.writeText(JSON.stringify(generateMutation.data.proof, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadProof = () => {
    if (generateMutation.data?.proof) {
      const blob = new Blob([JSON.stringify(generateMutation.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proof-${chainId}-${direction}-${blockNumber}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const sourceLabel = direction === 'l1ToL2' ? 'L1' : 'L2';

  if (!supportsProofGeneration) {
    return (
      <Card className="bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Generate Storage Proof
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Storage proof generation is not available for this chain.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileCode className="h-4 w-4" />
          Generate Storage Proof
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate a Merkle proof for {sourceLabel} state at a specific block
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">
              {sourceLabel} Block Number
            </label>
            <Input
              type="number"
              placeholder={`Enter ${sourceLabel} block number`}
              value={blockNumber}
              onChange={(e) => setBlockNumber(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">
              Storage Slot (optional, defaults to checkpoints slot)
            </label>
            <Input
              type="text"
              placeholder="e.g., 254 or 0x..."
              value={storageSlot}
              onChange={(e) => setStorageSlot(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!blockNumber || generateMutation.isPending}
            className="w-full"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating Proof...
              </>
            ) : (
              'Generate Proof'
            )}
          </Button>
        </div>

        {generateMutation.isError && (
          <div className="p-4 rounded-lg border bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900">
            <p className="text-sm text-red-700 dark:text-red-400">
              {generateMutation.error.message}
            </p>
          </div>
        )}

        {generateMutation.isSuccess && generateMutation.data?.proof && (
          <div className="space-y-3">
            <div className="p-4 rounded-lg border bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="success">Proof Generated</Badge>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyProof}>
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadProof}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Block Hash:</span>
                  <p className="font-mono text-xs break-all">
                    {generateMutation.data.proof.blockHash}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Storage Value:</span>
                  <p className="font-mono text-xs break-all">
                    {generateMutation.data.proof.storageValue}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Account Proof Nodes:</span>
                  <p className="font-mono text-xs">
                    {generateMutation.data.proof.accountProof?.length || 0} nodes
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Storage Proof Nodes:</span>
                  <p className="font-mono text-xs">
                    {generateMutation.data.proof.storageProof?.length || 0} nodes
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Generated at {new Date(generateMutation.data.metadata.generatedAt).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
