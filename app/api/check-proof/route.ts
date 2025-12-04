import { NextRequest, NextResponse } from 'next/server';
import { findCheckpointForBlock, getLatestBlock, getRecentCheckpoints } from '@/lib/signal-service';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { blockNumber, direction } = body;

    if (blockNumber === undefined || !direction) {
      return NextResponse.json(
        { error: 'Missing blockNumber or direction' },
        { status: 400 }
      );
    }

    const targetBlock = typeof blockNumber === 'string' ? parseInt(blockNumber) : blockNumber;

    if (isNaN(targetBlock)) {
      return NextResponse.json(
        { error: 'Invalid block number' },
        { status: 400 }
      );
    }

    // For L1→L2: Check if L1 block is checkpointed on L2
    // For L2→L1: Check if L2 block is checkpointed on L1
    const checkpointLayer = direction === 'l1-to-l2' ? 'l2' : 'l1';
    const sourceLayer = direction === 'l1-to-l2' ? 'l1' : 'l2';

    const [checkpoint, currentBlock, recentCheckpoints] = await Promise.all([
      findCheckpointForBlock(checkpointLayer, targetBlock),
      getLatestBlock(sourceLayer),
      getRecentCheckpoints(checkpointLayer, 5),
    ]);

    if (checkpoint) {
      const sourceConfig = direction === 'l1-to-l2' ? config.l1 : config.l2;

      return NextResponse.json({
        ready: true,
        sourceBlock: targetBlock,
        proofBlock: checkpoint.blockNumber,
        checkpoint,
        commands: {
          proofGenerator: `cd scripts/storage-proof-generator && node dist/index.cjs \\
  --rpc "${sourceConfig.rpc}" \\
  --account "${sourceConfig.broadcaster}" \\
  --slot "<STORAGE_SLOT>" \\
  --block ${checkpoint.blockNumber} \\
  --output "../../proof.json"`,
          description: `Generate storage proof for block ${checkpoint.blockNumber}`,
        },
      });
    }

    // Not ready - calculate estimate
    const latestCheckpoint = recentCheckpoints[0];

    return NextResponse.json({
      ready: false,
      sourceBlock: targetBlock,
      currentBlock: Number(currentBlock),
      latestCheckpoint: latestCheckpoint || null,
      message: latestCheckpoint
        ? `Block ${targetBlock} is not yet checkpointed. Latest checkpoint: ${latestCheckpoint.blockNumber}. Your block is ${targetBlock - latestCheckpoint.blockNumber} blocks ahead of the latest checkpoint.`
        : `Block ${targetBlock} is not yet checkpointed. No recent checkpoints found.`,
      tip: 'Checkpoints are created periodically. Please wait and try again.',
    });
  } catch (error) {
    console.error('Check proof API error:', error);
    return NextResponse.json(
      { error: 'Failed to check proof readiness', details: String(error) },
      { status: 500 }
    );
  }
}
