import { NextRequest, NextResponse } from 'next/server';
import { generateStorageProof } from 'openintents-storage-proof-generator';
import { getChainConfig, supportedChains } from '@/lib/chains/registry';
import type { NetworkType } from '@/lib/chains/types';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';

interface GenerateProofRequest {
  chain: string;
  network: NetworkType;
  blockNumber: number | string;
  direction: 'l1ToL2' | 'l2ToL1';
  storageSlot?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateProofRequest = await request.json();
    const { chain, network = 'testnet', blockNumber, direction, storageSlot } = body;

    // Validate chain
    if (!chain) {
      return NextResponse.json({ error: 'Missing chain parameter' }, { status: 400 });
    }
    if (!supportedChains.includes(chain)) {
      return NextResponse.json(
        { error: `Unknown chain: ${chain}. Supported: ${supportedChains.join(', ')}` },
        { status: 404 }
      );
    }

    // Validate network
    if (!['mainnet', 'testnet'].includes(network)) {
      return NextResponse.json(
        { error: 'Invalid network. Use mainnet or testnet' },
        { status: 400 }
      );
    }

    // Get chain config
    const config = getChainConfig(chain, network);
    if (!config) {
      return NextResponse.json(
        { error: `Failed to get config for ${chain} on ${network}` },
        { status: 500 }
      );
    }

    // Check if chain supports proof generation
    if (!config.supportsProofGeneration) {
      return NextResponse.json(
        { error: `Chain ${chain} does not support proof generation` },
        { status: 400 }
      );
    }

    // Validate required fields
    if (blockNumber === undefined) {
      return NextResponse.json({ error: 'Missing blockNumber' }, { status: 400 });
    }
    if (!direction) {
      return NextResponse.json({ error: 'Missing direction' }, { status: 400 });
    }

    // Parse block number
    const targetBlock =
      typeof blockNumber === 'string' ? parseInt(blockNumber) : blockNumber;

    if (isNaN(targetBlock)) {
      return NextResponse.json({ error: 'Invalid block number' }, { status: 400 });
    }

    // Determine source chain config based on direction
    // l1ToL2: proving L1 state on L2 → source is L1
    // l2ToL1: proving L2 state on L1 → source is L2
    const sourceConfig = direction === 'l1ToL2' ? config.contracts.l1 : config.contracts.l2;

    // Check if broadcaster is configured
    if (!sourceConfig.broadcaster) {
      return NextResponse.json(
        { error: `Broadcaster address not configured for ${chain} ${network} ${direction === 'l1ToL2' ? 'L1' : 'L2'}` },
        { status: 400 }
      );
    }

    // Use configured checkpoints slot or passed storage slot
    const slot = storageSlot
      ? BigInt(storageSlot)
      : BigInt(sourceConfig.checkpointsSlot || 254);

    console.log(`[generate-proof] Generating proof for ${chain} (${network})`);
    console.log(`[generate-proof] Direction: ${direction}`);
    console.log(`[generate-proof] Block: ${targetBlock}`);
    console.log(`[generate-proof] Account: ${sourceConfig.broadcaster}`);
    console.log(`[generate-proof] Slot: ${slot}`);

    // Generate the proof
    const proof = await generateStorageProof({
      rpc: sourceConfig.rpc,
      account: sourceConfig.broadcaster as `0x${string}`,
      slot,
      blockNumber: BigInt(targetBlock),
    });

    console.log(`[generate-proof] Proof generated successfully`);
    console.log(`[generate-proof] Block hash: ${proof.blockHash}`);

    return NextResponse.json({
      success: true,
      proof,
      metadata: {
        chain,
        network,
        direction,
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
