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
  const limit = parseInt(searchParams.get('limit') || '20', 10);
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

  // Validate limit
  if (isNaN(limit) || limit < 1 || limit > 100) {
    return NextResponse.json(
      { error: 'Invalid limit. Must be between 1 and 100' },
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
    const checkpoints = await adapter.getCheckpoints(direction, limit);
    return NextResponse.json({
      chain,
      direction,
      checkpoints,
      count: checkpoints.length,
    });
  } catch (error) {
    console.error(`Error getting checkpoints for ${chain}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
