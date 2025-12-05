'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatBlockHash } from '@/lib/signal-service';
import {
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Loader2,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ProofCheckResult {
  ready: boolean;
  sourceBlock: number;
  proofBlock?: number;
  checkpoint?: {
    blockNumber: number;
    blockHash: string;
    stateRoot: string;
  };
  generateProofApi?: {
    endpoint: string;
    method: string;
    body: {
      blockNumber: number;
      direction: string;
      storageSlot: string;
    };
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

interface GeneratedProof {
  success: boolean;
  proof: {
    blockNumber: string;
    blockHash: string;
    stateRoot: string;
    account: string;
    slot: string;
    slotValue: string;
    rlpBlockHeader: string;
    rlpAccountProof: string;
    rlpStorageProof: string;
  };
  metadata: {
    direction: string;
    sourceChain: string;
    sourceChainId: number;
    generatedAt: string;
  };
}

export function ProofChecker() {
  const [blockNumber, setBlockNumber] = useState('');
  const [storageSlot, setStorageSlot] = useState('');
  const [direction, setDirection] = useState<'l1-to-l2' | 'l2-to-l1'>('l1-to-l2');
  const [copied, setCopied] = useState(false);
  const [proofCopied, setProofCopied] = useState(false);
  const [showRawProof, setShowRawProof] = useState(false);

  // Check proof readiness mutation
  const checkMutation = useMutation<ProofCheckResult, Error, void>({
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

  // Generate proof mutation
  const generateMutation = useMutation<GeneratedProof, Error, void>({
    mutationFn: async () => {
      if (!checkMutation.data?.proofBlock) {
        throw new Error('No proof block available');
      }
      if (!storageSlot) {
        throw new Error('Storage slot is required');
      }

      const res = await fetch('/api/generate-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockNumber: checkMutation.data.proofBlock,
          direction,
          storageSlot,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || error.details || 'Failed to generate proof');
      }
      return res.json();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (blockNumber) {
      generateMutation.reset();
      checkMutation.mutate();
    }
  };

  const handleGenerateProof = () => {
    generateMutation.mutate();
  };

  const handleCopy = async (text: string, setFn: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  const handleDownloadProof = () => {
    if (!generateMutation.data?.proof) return;
    const blob = new Blob([JSON.stringify(generateMutation.data.proof, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proof-${checkMutation.data?.proofBlock || 'unknown'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            disabled={!blockNumber || checkMutation.isPending}
          >
            {checkMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              'Check Proof Readiness'
            )}
          </Button>
        </form>

        {checkMutation.error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{checkMutation.error.message}</p>
          </div>
        )}

        {checkMutation.data && (
          <div
            className={`p-4 rounded-lg border ${
              checkMutation.data.ready
                ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900'
                : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              {checkMutation.data.ready ? (
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
                  {checkMutation.data.sourceBlock.toLocaleString()}
                </span>
              </div>

              {checkMutation.data.ready && checkMutation.data.checkpoint && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Proof Block:</span>
                    <span className="font-mono font-semibold">
                      {checkMutation.data.proofBlock?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">State Root:</span>
                    <span className="font-mono">
                      {formatBlockHash(checkMutation.data.checkpoint.stateRoot, 12)}
                    </span>
                  </div>
                </>
              )}

              {!checkMutation.data.ready && (
                <>
                  {checkMutation.data.latestCheckpoint && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Latest Checkpoint:</span>
                      <span className="font-mono">
                        {checkMutation.data.latestCheckpoint.blockNumber.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <p className="text-muted-foreground mt-2">{checkMutation.data.message}</p>
                  {checkMutation.data.tip && (
                    <p className="text-xs text-muted-foreground italic mt-1">
                      {checkMutation.data.tip}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Generate Proof Section */}
            {checkMutation.data.ready && (
              <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-900">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Storage Slot (hex or decimal)
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., 0x5cf0a02c... or 254"
                      value={storageSlot}
                      onChange={(e) => setStorageSlot(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>

                  <Button
                    onClick={handleGenerateProof}
                    disabled={!storageSlot || generateMutation.isPending}
                    className="w-full"
                    variant="secondary"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Proof...
                      </>
                    ) : (
                      'Generate Proof'
                    )}
                  </Button>
                </div>

                {generateMutation.error && (
                  <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-destructive text-sm">{generateMutation.error.message}</p>
                  </div>
                )}

                {generateMutation.data?.proof && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        Proof Generated Successfully
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopy(
                              JSON.stringify(generateMutation.data!.proof, null, 2),
                              setProofCopied
                            )
                          }
                          className="h-8"
                        >
                          {proofCopied ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDownloadProof}
                          className="h-8"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Block Hash:</span>
                        <span className="font-mono">
                          {formatBlockHash(generateMutation.data.proof.blockHash, 12)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Slot Value:</span>
                        <span className="font-mono">
                          {formatBlockHash(generateMutation.data.proof.slotValue, 12)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Generated:</span>
                        <span className="font-mono text-xs">
                          {new Date(generateMutation.data.metadata.generatedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRawProof(!showRawProof)}
                      className="w-full justify-between"
                    >
                      <span>Raw Proof JSON</span>
                      {showRawProof ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>

                    {showRawProof && (
                      <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                        {JSON.stringify(generateMutation.data.proof, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* CLI Command Section */}
            {checkMutation.data.ready && checkMutation.data.commands && (
              <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">CLI Command</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(checkMutation.data!.commands!.proofGenerator, setCopied)}
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
                  {checkMutation.data.commands.proofGenerator}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
