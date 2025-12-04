import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { config } from '@/lib/config';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CHECKPOINT_SAVED_EVENT = parseAbiItem(
  'event CheckpointSaved(uint48 indexed blockNumber, bytes32 blockHash, bytes32 stateRoot)'
);

export async function GET() {
  try {
    const l1Client = createPublicClient({ transport: http(config.l1.rpc) });
    const l2Client = createPublicClient({ transport: http(config.l2.rpc) });

    const [l1Block, l2Block] = await Promise.all([
      l1Client.getBlockNumber(),
      l2Client.getBlockNumber(),
    ]);

    // Check L1 SignalService for events (L2 checkpoints on L1)
    let l1Events: unknown[] = [];
    let l1EventError: string | null = null;
    try {
      const fromBlock = l1Block > 500n ? l1Block - 500n : 0n;
      l1Events = await l1Client.getLogs({
        address: config.l1.signalService,
        event: CHECKPOINT_SAVED_EVENT,
        fromBlock,
        toBlock: 'latest',
      });
    } catch (e) {
      l1EventError = String(e);
    }

    // Check L2 SignalService for events (L1 checkpoints on L2)
    let l2Events: unknown[] = [];
    let l2EventError: string | null = null;
    try {
      const fromBlock = l2Block > 500n ? l2Block - 500n : 0n;
      l2Events = await l2Client.getLogs({
        address: config.l2.signalService,
        event: CHECKPOINT_SAVED_EVENT,
        fromBlock,
        toBlock: 'latest',
      });
    } catch (e) {
      l2EventError = String(e);
    }

    return NextResponse.json({
      config: {
        l1: {
          rpc: config.l1.rpc,
          signalService: config.l1.signalService,
          currentBlock: Number(l1Block),
        },
        l2: {
          rpc: config.l2.rpc,
          signalService: config.l2.signalService,
          currentBlock: Number(l2Block),
        },
      },
      l1SignalService: {
        description: 'L2 blocks checkpointed on L1',
        address: config.l1.signalService,
        eventsFound: l1Events.length,
        error: l1EventError,
        latestEvents: l1Events.slice(-3).map((e: any) => ({
          blockNumber: e.args?.blockNumber ? Number(e.args.blockNumber) : null,
          blockHash: e.args?.blockHash,
          txHash: e.transactionHash,
        })),
      },
      l2SignalService: {
        description: 'L1 blocks checkpointed on L2',
        address: config.l2.signalService,
        eventsFound: l2Events.length,
        error: l2EventError,
        latestEvents: l2Events.slice(-3).map((e: any) => ({
          blockNumber: e.args?.blockNumber ? Number(e.args.blockNumber) : null,
          blockHash: e.args?.blockHash,
          txHash: e.transactionHash,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Debug failed', details: String(error) },
      { status: 500 }
    );
  }
}
