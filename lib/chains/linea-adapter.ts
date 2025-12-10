// Linea chain adapter
import { createPublicClient, http, parseAbiItem, type PublicClient } from 'viem';
import { ChainAdapter, ChainConfig, ChainStatus, Checkpoint, ProofResult } from './types';

// DataFinalizedV3 event from LineaRollup contract on L1
// Emitted when L2 state is finalized on L1
const DATA_FINALIZED_V3_EVENT = parseAbiItem(
  'event DataFinalizedV3(uint256 indexed startBlockNumber, uint256 indexed endBlockNumber, bytes32 indexed shnarf, bytes32 parentStateRootHash, bytes32 finalStateRootHash)'
);

// DataFinalized event (older version, fallback)
const DATA_FINALIZED_EVENT = parseAbiItem(
  'event DataFinalized(bytes32 indexed parentStateRootHash, bytes32 indexed finalStateRootHash, uint256 indexed finalBlockNumber)'
);

// BlocksVerificationDone event - used when blocks are verified
const BLOCKS_VERIFICATION_DONE_EVENT = parseAbiItem(
  'event BlocksVerificationDone(uint256 indexed lastBlockFinalized, bytes32 startingRootHash, bytes32 finalRootHash)'
);

export class LineaAdapter implements ChainAdapter {
  config: ChainConfig;
  private l1Client: PublicClient | null = null;
  private l2Client: PublicClient | null = null;

  constructor(config: ChainConfig) {
    this.config = config;
  }

  private getL1Client(): PublicClient {
    if (!this.l1Client) {
      this.l1Client = createPublicClient({
        transport: http(this.config.contracts.l1.rpc),
      });
    }
    return this.l1Client;
  }

  private getL2Client(): PublicClient {
    if (!this.l2Client) {
      this.l2Client = createPublicClient({
        transport: http(this.config.contracts.l2.rpc),
      });
    }
    return this.l2Client;
  }

  async getStatus(direction: 'l1ToL2' | 'l2ToL1'): Promise<ChainStatus> {
    try {
      // For L2→L1: source is L2, checkpoints are on L1 (LineaRollup)
      // For L1→L2: source is L1, L2 has access to L1 block hashes via L1MessageService
      const sourceClient = direction === 'l1ToL2' ? this.getL1Client() : this.getL2Client();

      const [checkpoints, currentBlockBigInt] = await Promise.all([
        this.getCheckpoints(direction, 1),
        sourceClient.getBlockNumber(),
      ]);

      const currentBlock = Number(currentBlockBigInt);
      const latestCheckpoint = checkpoints[0] || null;
      const blocksBehind = latestCheckpoint
        ? currentBlock - latestCheckpoint.blockNumber
        : undefined;

      return {
        chainName: this.config.name,
        direction,
        isConnected: true,
        latestCheckpoint,
        totalCheckpoints: checkpoints.length,
        contractAddress: direction === 'l1ToL2'
          ? this.config.contracts.l2.address  // L1MessageService on L2 for L1→L2
          : this.config.contracts.l1.address, // LineaRollup on L1 for L2→L1
        currentBlock,
        blocksBehind,
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
    if (direction === 'l2ToL1') {
      // L2→L1: Query finalization events on L1 LineaRollup
      return this.getL2ToL1Checkpoints(limit);
    } else {
      // L1→L2: Linea L2 has access to L1 block hashes via L1MessageService
      // Similar to Arbitrum, we show recent L1 blocks accessible from L2
      return this.getL1ToL2Checkpoints(limit);
    }
  }

  private async getL2ToL1Checkpoints(limit: number): Promise<Checkpoint[]> {
    const l1Client = this.getL1Client();
    const lineaRollupAddress = this.config.contracts.l1.address;

    const currentBlock = await l1Client.getBlockNumber();
    // Use moderate block range for public RPC compatibility
    const fromBlock = currentBlock > 5000n ? currentBlock - 5000n : 0n;

    try {
      // Try DataFinalizedV3 first (newer format)
      const logsV3 = await l1Client.getLogs({
        address: lineaRollupAddress as `0x${string}`,
        event: DATA_FINALIZED_V3_EVENT,
        fromBlock,
        toBlock: currentBlock,
      });

      if (logsV3.length > 0) {
        return this.processDataFinalizedV3Logs(logsV3, l1Client, limit);
      }

      // Fallback to BlocksVerificationDone event
      const logsVerification = await l1Client.getLogs({
        address: lineaRollupAddress as `0x${string}`,
        event: BLOCKS_VERIFICATION_DONE_EVENT,
        fromBlock,
        toBlock: currentBlock,
      });

      if (logsVerification.length > 0) {
        return this.processBlocksVerificationDoneLogs(logsVerification, l1Client, limit);
      }

      // Try older DataFinalized event as last resort
      const logsLegacy = await l1Client.getLogs({
        address: lineaRollupAddress as `0x${string}`,
        event: DATA_FINALIZED_EVENT,
        fromBlock,
        toBlock: currentBlock,
      });

      if (logsLegacy.length > 0) {
        return this.processDataFinalizedLogs(logsLegacy, l1Client, limit);
      }

      return [];
    } catch (error) {
      console.error('Error fetching Linea L2→L1 checkpoints:', error);
      return [];
    }
  }

  private async processDataFinalizedV3Logs(
    logs: any[],
    l1Client: PublicClient,
    limit: number
  ): Promise<Checkpoint[]> {
    const recentLogs = logs.slice(-limit * 2);

    const checkpoints = await Promise.all(
      recentLogs.map(async (log) => {
        const endBlockNumber = Number(log.args.endBlockNumber);
        const finalStateRootHash = log.args.finalStateRootHash as string;

        try {
          const l1Block = await l1Client.getBlock({ blockNumber: log.blockNumber });
          return {
            blockNumber: endBlockNumber,
            blockHash: log.args.shnarf as string, // shnarf is a commitment hash
            stateRoot: finalStateRootHash,
            txHash: log.transactionHash,
            timestamp: Number(l1Block.timestamp) * 1000,
          };
        } catch {
          return {
            blockNumber: endBlockNumber,
            blockHash: log.args.shnarf as string,
            stateRoot: finalStateRootHash,
            txHash: log.transactionHash,
          };
        }
      })
    );

    return checkpoints
      .filter(cp => cp.blockNumber > 0)
      .sort((a, b) => b.blockNumber - a.blockNumber)
      .slice(0, limit);
  }

  private async processBlocksVerificationDoneLogs(
    logs: any[],
    l1Client: PublicClient,
    limit: number
  ): Promise<Checkpoint[]> {
    const recentLogs = logs.slice(-limit * 2);

    const checkpoints = await Promise.all(
      recentLogs.map(async (log) => {
        const lastBlockFinalized = Number(log.args.lastBlockFinalized);
        const finalRootHash = log.args.finalRootHash as string;

        try {
          const l1Block = await l1Client.getBlock({ blockNumber: log.blockNumber });
          return {
            blockNumber: lastBlockFinalized,
            blockHash: finalRootHash, // Using finalRootHash as identifier
            stateRoot: finalRootHash,
            txHash: log.transactionHash,
            timestamp: Number(l1Block.timestamp) * 1000,
          };
        } catch {
          return {
            blockNumber: lastBlockFinalized,
            blockHash: finalRootHash,
            stateRoot: finalRootHash,
            txHash: log.transactionHash,
          };
        }
      })
    );

    return checkpoints
      .filter(cp => cp.blockNumber > 0)
      .sort((a, b) => b.blockNumber - a.blockNumber)
      .slice(0, limit);
  }

  private async processDataFinalizedLogs(
    logs: any[],
    l1Client: PublicClient,
    limit: number
  ): Promise<Checkpoint[]> {
    const recentLogs = logs.slice(-limit * 2);

    const checkpoints = await Promise.all(
      recentLogs.map(async (log) => {
        const finalBlockNumber = Number(log.args.finalBlockNumber);
        const finalStateRootHash = log.args.finalStateRootHash as string;

        try {
          const l1Block = await l1Client.getBlock({ blockNumber: log.blockNumber });
          return {
            blockNumber: finalBlockNumber,
            blockHash: finalStateRootHash,
            stateRoot: finalStateRootHash,
            txHash: log.transactionHash,
            timestamp: Number(l1Block.timestamp) * 1000,
          };
        } catch {
          return {
            blockNumber: finalBlockNumber,
            blockHash: finalStateRootHash,
            stateRoot: finalStateRootHash,
            txHash: log.transactionHash,
          };
        }
      })
    );

    return checkpoints
      .filter(cp => cp.blockNumber > 0)
      .sort((a, b) => b.blockNumber - a.blockNumber)
      .slice(0, limit);
  }

  private async getL1ToL2Checkpoints(limit: number): Promise<Checkpoint[]> {
    // For L1→L2 on Linea, L2 can access L1 block hashes via L1MessageService
    // Similar to Arbitrum's approach, we show recent L1 blocks that are accessible from L2
    const l1Client = this.getL1Client();

    try {
      const l1BlockNumber = await l1Client.getBlockNumber();

      const checkpoints: Checkpoint[] = [];
      const blocksToFetch = Math.min(limit, 20);

      for (let i = 0; i < blocksToFetch; i++) {
        const blockNum = l1BlockNumber - BigInt(i);
        if (blockNum < 0n) break;

        try {
          const block = await l1Client.getBlock({ blockNumber: blockNum });
          checkpoints.push({
            blockNumber: Number(blockNum),
            blockHash: block.hash!,
            stateRoot: block.stateRoot,
            timestamp: Number(block.timestamp) * 1000,
          });
        } catch {
          break;
        }
      }

      return checkpoints;
    } catch (error) {
      console.error('Error fetching Linea L1→L2 checkpoints:', error);
      return [];
    }
  }

  async checkProof(direction: 'l1ToL2' | 'l2ToL1', blockNumber: number): Promise<ProofResult> {
    try {
      if (direction === 'l2ToL1') {
        // Check if L2 block has been finalized on L1 via LineaRollup
        const checkpoints = await this.getL2ToL1Checkpoints(100);

        // Find exact match or the checkpoint that covers this block
        // Linea finalizes ranges, so we need to find if blockNumber is <= any finalized block
        const checkpoint = checkpoints.find(cp => cp.blockNumber === blockNumber);

        if (checkpoint) {
          return {
            exists: true,
            blockNumber,
            blockHash: checkpoint.blockHash,
            stateRoot: checkpoint.stateRoot,
          };
        }

        // Check if any checkpoint covers this block (finalized block >= requested block)
        const coveringCheckpoint = checkpoints
          .filter(cp => cp.blockNumber >= blockNumber)
          .sort((a, b) => a.blockNumber - b.blockNumber)[0];

        if (coveringCheckpoint) {
          // Block is finalized as part of a batch
          return {
            exists: true,
            blockNumber,
            blockHash: coveringCheckpoint.blockHash,
            stateRoot: coveringCheckpoint.stateRoot,
          };
        }

        // Find next checkpoint for messaging
        const nextCheckpoint = checkpoints
          .filter(cp => cp.blockNumber > blockNumber)
          .sort((a, b) => a.blockNumber - b.blockNumber)[0];

        return {
          exists: false,
          blockNumber,
          error: nextCheckpoint
            ? `Block not finalized on L1. Next finalized: ${nextCheckpoint.blockNumber}`
            : 'Block not finalized on L1 yet.',
        };
      } else {
        // L1→L2: Check if L1 block is accessible via L1MessageService
        const l1Client = this.getL1Client();
        const currentL1Block = await l1Client.getBlockNumber();

        // Linea L2 can access recent L1 blocks (exact range depends on L1MessageService config)
        // Typically similar to other rollups - recent blocks are accessible
        const isAccessible = BigInt(blockNumber) <= currentL1Block;

        if (isAccessible) {
          try {
            const block = await l1Client.getBlock({ blockNumber: BigInt(blockNumber) });
            return {
              exists: true,
              blockNumber,
              blockHash: block.hash!,
              stateRoot: block.stateRoot,
            };
          } catch {
            return {
              exists: false,
              blockNumber,
              error: `Could not fetch L1 block ${blockNumber}`,
            };
          }
        }

        return {
          exists: false,
          blockNumber,
          error: `L1 block ${blockNumber} is not yet available. Current L1 block: ${currentL1Block}`,
        };
      }
    } catch (error) {
      return {
        exists: false,
        blockNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
