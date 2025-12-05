import { NextRequest, NextResponse } from 'next/server';
import { generateStorageProof } from 'openintents-storage-proof-generator';
import { config } from '@/lib/config';
import type { ProofDirection } from 'openintents-storage-proof-generator';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';

interface GenerateProofRequest {
  blockNumber: number | string;
  direction: ProofDirection;
  storageSlot: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateProofRequest = await request.json();
    const { blockNumber, direction, storageSlot } = body;

    // Validate required fields
    if (blockNumber === undefined) {
      return NextResponse.json({ error: 'Missing blockNumber' }, { status: 400 });
    }
    if (!direction) {
      return NextResponse.json({ error: 'Missing direction' }, { status: 400 });
    }
    if (!storageSlot) {
      return NextResponse.json({ error: 'Missing storageSlot' }, { status: 400 });
    }

    // Parse block number
    const targetBlock =
      typeof blockNumber === 'string' ? parseInt(blockNumber) : blockNumber;

    if (isNaN(targetBlock)) {
      return NextResponse.json({ error: 'Invalid block number' }, { status: 400 });
    }

    // Parse storage slot
    let slot: bigint;
    try {
      slot = BigInt(storageSlot);
    } catch {
      return NextResponse.json({ error: 'Invalid storage slot' }, { status: 400 });
    }

    // Determine source chain config based on direction
    const sourceConfig = direction === 'l1-to-l2' ? config.l1 : config.l2;

    console.log(`[generate-proof] Generating proof for block ${targetBlock} on ${sourceConfig.name}`);
    console.log(`[generate-proof] Account: ${sourceConfig.broadcaster}`);
    console.log(`[generate-proof] Slot: ${storageSlot}`);

    // Generate the proof
    const proof = await generateStorageProof({
      rpc: sourceConfig.rpc,
      account: sourceConfig.broadcaster,
      slot,
      blockNumber: BigInt(targetBlock),
    });

    console.log(`[generate-proof] Proof generated successfully`);
    console.log(`[generate-proof] Block hash: ${proof.blockHash}`);

    return NextResponse.json({
      success: true,
      proof,
      metadata: {
        direction,
        sourceChain: sourceConfig.name,
        sourceChainId: sourceConfig.chainId,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[generate-proof] Error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'BlockHashMismatchError') {
        return NextResponse.json(
          {
            error: 'Block hash verification failed',
            details: error.message,
          },
          { status: 500 }
        );
      }
      if (error.name === 'StateRootMismatchError') {
        return NextResponse.json(
          {
            error: 'State root verification failed',
            details: error.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to generate proof',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
