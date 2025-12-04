import { NextResponse } from 'next/server';
import { getLatestBlock, getRecentCheckpoints } from '@/lib/signal-service';
import { config } from '@/lib/config';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Fetch data in parallel
    const [l1Block, l2Block, l1CheckpointsOnL2, l2CheckpointsOnL1] = await Promise.all([
      getLatestBlock('l1'),
      getLatestBlock('l2'),
      getRecentCheckpoints('l2', 1), // L1 blocks checkpointed ON L2
      getRecentCheckpoints('l1', 1), // L2 blocks checkpointed ON L1
    ]);

    const l1LatestCheckpoint = l1CheckpointsOnL2[0] || null;
    const l2LatestCheckpoint = l2CheckpointsOnL1[0] || null;

    return NextResponse.json({
      l1: {
        chainId: config.l1.chainId,
        name: config.l1.name,
        currentBlock: Number(l1Block),
        latestCheckpointOnL2: l1LatestCheckpoint,
        blocksBehind: l1LatestCheckpoint
          ? Number(l1Block) - l1LatestCheckpoint.blockNumber
          : null,
        explorer: config.l1.explorer,
      },
      l2: {
        chainId: config.l2.chainId,
        name: config.l2.name,
        currentBlock: Number(l2Block),
        latestCheckpointOnL1: l2LatestCheckpoint,
        blocksBehind: l2LatestCheckpoint
          ? Number(l2Block) - l2LatestCheckpoint.blockNumber
          : null,
        explorer: config.l2.explorer,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chain status', details: String(error) },
      { status: 500 }
    );
  }
}
