import { NextResponse } from 'next/server';
import { getChainAdapter, supportedChains } from '@/lib/chains';
import type { NetworkType } from '@/lib/chains/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteParams = {
  params: Promise<{ chain: string }>;
};

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  const { chain } = await params;
  const { searchParams } = new URL(request.url);
  const direction = (searchParams.get('direction') || 'l2ToL1') as 'l1ToL2' | 'l2ToL1';
  const blockNumberStr = searchParams.get('blockNumber');
  const network = (searchParams.get('network') || 'testnet') as NetworkType;

  // Validate chain
  if (!supportedChains.includes(chain)) {
    return NextResponse.json(
      { error: `Unknown chain: ${chain}. Supported: ${supportedChains.join(', ')}` },
      { status: 404 }
    );
  }

  // Validate direction
  if (!['l1ToL2', 'l2ToL1'].includes(direction)) {
    return NextResponse.json(
      { error: 'Invalid direction. Use l1ToL2 or l2ToL1' },
      { status: 400 }
    );
  }

  // Validate network
  if (!['mainnet', 'testnet'].includes(network)) {
    return NextResponse.json(
      { error: 'Invalid network. Use mainnet or testnet' },
      { status: 400 }
    );
  }

  // Validate block number
  if (!blockNumberStr) {
    return NextResponse.json(
      { error: 'blockNumber parameter is required' },
      { status: 400 }
    );
  }

  const blockNumber = parseInt(blockNumberStr, 10);
  if (isNaN(blockNumber) || blockNumber < 0) {
    return NextResponse.json(
      { error: 'Invalid blockNumber. Must be a positive integer' },
      { status: 400 }
    );
  }

  const adapter = getChainAdapter(chain, network);
  if (!adapter) {
    return NextResponse.json(
      { error: `Failed to initialize adapter for ${chain} on ${network}` },
      { status: 500 }
    );
  }

  try {
    const result = await adapter.checkProof(direction, blockNumber);
    return NextResponse.json({
      chain,
      direction,
      ...result,
    });
  } catch (error) {
    console.error(`Error checking proof for ${chain}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
