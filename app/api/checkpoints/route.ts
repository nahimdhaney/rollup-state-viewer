import { NextRequest, NextResponse } from 'next/server';
import { getRecentCheckpoints } from '@/lib/signal-service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const direction = searchParams.get('direction') || 'l1-to-l2';
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    // For L1→L2: L1 blocks are checkpointed ON L2 (so query L2's SignalService)
    // For L2→L1: L2 blocks are checkpointed ON L1 (so query L1's SignalService)
    const layer = direction === 'l1-to-l2' ? 'l2' : 'l1';
    const checkpoints = await getRecentCheckpoints(layer, limit);

    return NextResponse.json({
      direction,
      sourceChain: direction === 'l1-to-l2' ? 'L1' : 'L2',
      targetChain: direction === 'l1-to-l2' ? 'L2' : 'L1',
      checkpoints,
    });
  } catch (error) {
    console.error('Checkpoints API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checkpoints', details: String(error) },
      { status: 500 }
    );
  }
}
