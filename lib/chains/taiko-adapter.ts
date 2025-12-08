// Taiko chain adapter
import { createPublicClient, http, parseAbiItem, type PublicClient } from 'viem';
import { mainnet } from 'viem/chains';
import { ChainAdapter, ChainConfig, ChainStatus, Checkpoint, ProofResult } from './types';
import { chainConfigs } from './registry';

const CHECKPOINT_SAVED_EVENT = parseAbiItem(
  'event CheckpointSaved(uint48 indexed blockNumber, bytes32 blockHash, bytes32 stateRoot)'
);

// Custom Taiko chain definition
const taikoMainnet = {
  id: 167000,
  name: 'Taiko',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [] } },
};

export class TaikoAdapter implements ChainAdapter {
  config: ChainConfig;
  private l1Client: PublicClient | null = null;
  private l2Client: PublicClient | null = null;

  constructor() {
    this.config = chainConfigs.taiko;
  }

  private getL1Client(): PublicClient {
    if (!this.l1Client) {
      this.l1Client = createPublicClient({
        chain: mainnet,
        transport: http(this.config.contracts.l1.rpc),
      });
    }
    return this.l1Client;
  }

  private getL2Client(): PublicClient {
    if (!this.l2Client) {
      this.l2Client = createPublicClient({
        chain: taikoMainnet,
        transport: http(this.config.contracts.l2.rpc),
      });
    }
    return this.l2Client;
  }

  async getStatus(direction: 'l1ToL2' | 'l2ToL1'): Promise<ChainStatus> {
    try {
      // For L1→L2: we read checkpoints on L2 (L1 state saved on L2)
      // For L2→L1: we read checkpoints on L1 (L2 state saved on L1)
      const client = direction === 'l1ToL2' ? this.getL2Client() : this.getL1Client();
      const contractAddress = direction === 'l1ToL2'
        ? this.config.contracts.l2.address
        : this.config.contracts.l1.address;

      const checkpoints = await this.getCheckpoints(direction, 1);

      return {
        chainName: this.config.name,
        direction,
        isConnected: true,
        latestCheckpoint: checkpoints[0] || null,
        totalCheckpoints: checkpoints.length,
        contractAddress,
      };
    } catch (error) {
      return {
        chainName: this.config.name,
        direction,
        isConnected: false,
        latestCheckpoint: null,
        totalCheckpoints: 0,
        contractAddress: direction === 'l1ToL2'
          ? this.config.contracts.l2.address
          : this.config.contracts.l1.address,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getCheckpoints(direction: 'l1ToL2' | 'l2ToL1', limit: number = 20): Promise<Checkpoint[]> {
    // For L1→L2: checkpoints are on L2 SignalService (L1 blocks saved there)
    // For L2→L1: checkpoints are on L1 SignalService (L2 blocks saved there)
    const client = direction === 'l1ToL2' ? this.getL2Client() : this.getL1Client();
    const contractAddress = direction === 'l1ToL2'
      ? this.config.contracts.l2.address
      : this.config.contracts.l1.address;

    const currentBlock = await client.getBlockNumber();
    const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;

    try {
      const logs = await client.getLogs({
        address: contractAddress as `0x${string}`,
        event: CHECKPOINT_SAVED_EVENT,
        fromBlock,
        toBlock: 'latest',
      });

      const checkpoints = await Promise.all(
        logs.slice(-limit * 2).map(async (log) => {
          try {
            const block = await client.getBlock({ blockNumber: log.blockNumber });
            return {
              blockNumber: Number(log.args.blockNumber),
              blockHash: log.args.blockHash as string,
              stateRoot: log.args.stateRoot as string,
              txHash: log.transactionHash,
              timestamp: Number(block.timestamp) * 1000,
            };
          } catch {
            return {
              blockNumber: Number(log.args.blockNumber),
              blockHash: log.args.blockHash as string,
              stateRoot: log.args.stateRoot as string,
              txHash: log.transactionHash,
            };
          }
        })
      );

      return checkpoints.reverse().slice(0, limit);
    } catch (error) {
      console.error(`Error fetching Taiko checkpoints (${direction}):`, error);
      return [];
    }
  }

  async checkProof(direction: 'l1ToL2' | 'l2ToL1', blockNumber: number): Promise<ProofResult> {
    try {
      const checkpoints = await this.getCheckpoints(direction, 50);

      // Find the checkpoint for this block
      const checkpoint = checkpoints.find(cp => cp.blockNumber === blockNumber);

      if (checkpoint) {
        return {
          exists: true,
          blockNumber,
          blockHash: checkpoint.blockHash,
          stateRoot: checkpoint.stateRoot,
        };
      }

      // Find next available checkpoint
      const nextCheckpoint = checkpoints
        .filter(cp => cp.blockNumber > blockNumber)
        .sort((a, b) => a.blockNumber - b.blockNumber)[0];

      return {
        exists: false,
        blockNumber,
        error: nextCheckpoint
          ? `Block not checkpointed. Next available: ${nextCheckpoint.blockNumber}`
          : 'Block not checkpointed. No future checkpoints found.',
      };
    } catch (error) {
      return {
        exists: false,
        blockNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
