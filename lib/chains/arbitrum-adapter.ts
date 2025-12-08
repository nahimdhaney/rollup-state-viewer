// Arbitrum chain adapter
import { createPublicClient, http, parseAbiItem, type PublicClient } from 'viem';
import { mainnet, arbitrum } from 'viem/chains';
import { ChainAdapter, ChainConfig, ChainStatus, Checkpoint, ProofResult } from './types';
import { chainConfigs } from './registry';

// SendRootUpdated event from Outbox contract on L1
// Emitted when L2 state is confirmed on L1
const SEND_ROOT_UPDATED_EVENT = parseAbiItem(
  'event SendRootUpdated(bytes32 indexed outputRoot, bytes32 indexed l2BlockHash)'
);

// ArbSys precompile address on Arbitrum L2
const ARBSYS_ADDRESS = '0x0000000000000000000000000000000000000064';

// ArbSys L1 block number function
const ARBSYS_ABI = [
  {
    name: 'arbBlockNumber',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export class ArbitrumAdapter implements ChainAdapter {
  config: ChainConfig;
  private l1Client: PublicClient | null = null;
  private l2Client: PublicClient | null = null;

  constructor() {
    this.config = chainConfigs.arbitrum;
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
        chain: arbitrum,
        transport: http(this.config.contracts.l2.rpc),
      });
    }
    return this.l2Client;
  }

  async getStatus(direction: 'l1ToL2' | 'l2ToL1'): Promise<ChainStatus> {
    try {
      const checkpoints = await this.getCheckpoints(direction, 1);

      return {
        chainName: this.config.name,
        direction,
        isConnected: true,
        latestCheckpoint: checkpoints[0] || null,
        totalCheckpoints: checkpoints.length,
        contractAddress: direction === 'l1ToL2'
          ? this.config.contracts.l2.address  // ArbSys on L2 for L1→L2
          : this.config.contracts.l1.address, // Outbox on L1 for L2→L1
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
      // L2→L1: Query SendRootUpdated events on L1 Outbox
      return this.getL2ToL1Checkpoints(limit);
    } else {
      // L1→L2: Arbitrum L2 has access to L1 block hashes via ArbSys
      // This is different from Taiko - Arbitrum doesn't checkpoint L1 state,
      // it has direct access to recent L1 block hashes via the ArbSys precompile
      return this.getL1ToL2Checkpoints(limit);
    }
  }

  private async getL2ToL1Checkpoints(limit: number): Promise<Checkpoint[]> {
    const l1Client = this.getL1Client();
    const l2Client = this.getL2Client();
    const outboxAddress = this.config.contracts.l1.address;

    const currentBlock = await l1Client.getBlockNumber();
    // Use very small block range to avoid public RPC limits (llamarpc limits to 1k blocks)
    // For better coverage, users should configure Alchemy/Infura RPC
    const fromBlock = currentBlock > 900n ? currentBlock - 900n : 0n;

    try {
      const logs = await l1Client.getLogs({
        address: outboxAddress as `0x${string}`,
        event: SEND_ROOT_UPDATED_EVENT,
        fromBlock,
        toBlock: currentBlock, // Use explicit block number instead of 'latest'
      });

      // Take last N events and resolve block numbers
      const recentLogs = logs.slice(-limit * 2);

      const checkpoints = await Promise.all(
        recentLogs.map(async (log) => {
          const l2BlockHash = log.args.l2BlockHash as string;
          const sendRoot = log.args.outputRoot as string;

          try {
            // Get L1 block timestamp
            const l1Block = await l1Client.getBlock({ blockNumber: log.blockNumber });

            // Derive L2 block number from block hash by querying L2 RPC
            let l2BlockNumber: number | undefined;
            try {
              const l2Block = await l2Client.getBlock({ blockHash: l2BlockHash as `0x${string}` });
              l2BlockNumber = Number(l2Block.number);
            } catch {
              // Block hash might not be found if L2 RPC doesn't have it
              console.warn(`Could not resolve L2 block number for hash ${l2BlockHash}`);
            }

            return {
              blockNumber: l2BlockNumber || 0,
              blockHash: l2BlockHash,
              sendRoot,
              txHash: log.transactionHash,
              timestamp: Number(l1Block.timestamp) * 1000,
            };
          } catch {
            return {
              blockNumber: 0,
              blockHash: l2BlockHash,
              sendRoot,
              txHash: log.transactionHash,
            };
          }
        })
      );

      // Filter out entries where we couldn't get block number and sort
      return checkpoints
        .filter(cp => cp.blockNumber > 0)
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching Arbitrum L2→L1 checkpoints:', error);
      return [];
    }
  }

  private async getL1ToL2Checkpoints(limit: number): Promise<Checkpoint[]> {
    // For L1→L2 on Arbitrum, we don't have explicit checkpoints like Taiko
    // Instead, Arbitrum L2 has access to L1 block hashes via ArbSys.arbBlockHash()
    // We can show recent L1 blocks that are accessible from L2

    const l1Client = this.getL1Client();
    const l2Client = this.getL2Client();

    try {
      // Get current L2 block to find what L1 blocks are accessible
      const l2BlockNumber = await l2Client.getBlockNumber();
      const l1BlockNumber = await l1Client.getBlockNumber();

      // Arbitrum L2 can access L1 block hashes for blocks within a certain range
      // Typically the last 256 blocks are accessible
      const checkpoints: Checkpoint[] = [];

      // Get recent L1 blocks (these are the ones provable on L2)
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
      console.error('Error fetching Arbitrum L1→L2 checkpoints:', error);
      return [];
    }
  }

  async checkProof(direction: 'l1ToL2' | 'l2ToL1', blockNumber: number): Promise<ProofResult> {
    try {
      if (direction === 'l2ToL1') {
        // Check if L2 block has been confirmed on L1 via Outbox
        const checkpoints = await this.getL2ToL1Checkpoints(50);
        const checkpoint = checkpoints.find(cp => cp.blockNumber === blockNumber);

        if (checkpoint) {
          return {
            exists: true,
            blockNumber,
            blockHash: checkpoint.blockHash,
            sendRoot: checkpoint.sendRoot,
          };
        }

        const nextCheckpoint = checkpoints
          .filter(cp => cp.blockNumber > blockNumber)
          .sort((a, b) => a.blockNumber - b.blockNumber)[0];

        return {
          exists: false,
          blockNumber,
          error: nextCheckpoint
            ? `Block not confirmed on L1. Next confirmed: ${nextCheckpoint.blockNumber}`
            : 'Block not confirmed on L1 yet.',
        };
      } else {
        // L1→L2: Check if L1 block is accessible via ArbSys
        const l1Client = this.getL1Client();
        const currentL1Block = await l1Client.getBlockNumber();

        // Arbitrum can access L1 blocks within ~256 block range
        const isAccessible = BigInt(blockNumber) > currentL1Block - 256n && BigInt(blockNumber) <= currentL1Block;

        if (isAccessible) {
          const block = await l1Client.getBlock({ blockNumber: BigInt(blockNumber) });
          return {
            exists: true,
            blockNumber,
            blockHash: block.hash!,
            stateRoot: block.stateRoot,
          };
        }

        return {
          exists: false,
          blockNumber,
          error: `L1 block ${blockNumber} is outside the accessible range. Current L1 block: ${currentL1Block}`,
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
