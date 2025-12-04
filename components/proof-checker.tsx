'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatBlockHash } from '@/lib/signal-service';
import { CheckCircle2, XCircle, Copy, Check, Loader2 } from 'lucide-react';

interface ProofCheckResult {
  ready: boolean;
  sourceBlock: number;
  proofBlock?: number;
  checkpoint?: {
    blockNumber: number;
    blockHash: string;
    stateRoot: string;
  };
  commands?: {
    proofGenerator: string;
    description: string;
  };
  currentBlock?: number;
  latestCheckpoint?: {
    blockNumber: number;
  } | null;
  message?: string;
  tip?: string;
}

export function ProofChecker() {
  const [blockNumber, setBlockNumber] = useState('');
  const [direction, setDirection] = useState<'l1-to-l2' | 'l2-to-l1'>('l1-to-l2');
  const [copied, setCopied] = useState(false);

  const mutation = useMutation<ProofCheckResult, Error, void>({
    mutationFn: async () => {
      const res = await fetch('/api/check-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockNumber: parseInt(blockNumber),
          direction,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to check proof readiness');
      }
      return res.json();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (blockNumber) {
      mutation.mutate();
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Proof Readiness Checker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Block Number
            </label>
            <Input
              type="number"
              placeholder="Enter block number (e.g., 74856)"
              value={blockNumber}
              onChange={(e) => setBlockNumber(e.target.value)}
              className="font-mono"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Direction
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={direction === 'l1-to-l2' ? 'default' : 'outline'}
                onClick={() => setDirection('l1-to-l2')}
                className="flex-1"
              >
                L1 → L2
              </Button>
              <Button
                type="button"
                variant={direction === 'l2-to-l1' ? 'default' : 'outline'}
                onClick={() => setDirection('l2-to-l1')}
                className="flex-1"
              >
                L2 → L1
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!blockNumber || mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              'Check Proof Readiness'
            )}
          </Button>
        </form>

        {mutation.error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{mutation.error.message}</p>
          </div>
        )}

        {mutation.data && (
          <div
            className={`p-4 rounded-lg border ${
              mutation.data.ready
                ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900'
                : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              {mutation.data.ready ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-700 dark:text-green-400">
                    Ready for Proof
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                    Not Yet Ready
                  </span>
                </>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source Block:</span>
                <span className="font-mono">
                  {mutation.data.sourceBlock.toLocaleString()}
                </span>
              </div>

              {mutation.data.ready && mutation.data.checkpoint && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Proof Block:</span>
                    <span className="font-mono font-semibold">
                      {mutation.data.proofBlock?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">State Root:</span>
                    <span className="font-mono">
                      {formatBlockHash(mutation.data.checkpoint.stateRoot, 12)}
                    </span>
                  </div>
                </>
              )}

              {!mutation.data.ready && (
                <>
                  {mutation.data.latestCheckpoint && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Latest Checkpoint:</span>
                      <span className="font-mono">
                        {mutation.data.latestCheckpoint.blockNumber.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <p className="text-muted-foreground mt-2">{mutation.data.message}</p>
                  {mutation.data.tip && (
                    <p className="text-xs text-muted-foreground italic mt-1">
                      {mutation.data.tip}
                    </p>
                  )}
                </>
              )}
            </div>

            {mutation.data.ready && mutation.data.commands && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Proof Generator Command</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(mutation.data.commands!.proofGenerator)}
                    className="h-8"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {mutation.data.commands.proofGenerator}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
