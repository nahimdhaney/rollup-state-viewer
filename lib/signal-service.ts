import { createPublicClient, http, parseAbiItem, type PublicClient } from 'viem';
import { config, type Layer } from './config';

const CHECKPOINT_SAVED_EVENT = parseAbiItem(
  'event CheckpointSaved(uint48 indexed blockNumber, bytes32 blockHash, bytes32 stateRoot)'
);

export interface Checkpoint {
  blockNumber: number;
  blockHash: string;
  stateRoot: string;
  transactionHash: string;
  checkpointedInBlock: number;
  checkpointedAt?: Date;
}

const clientCache: Map<Layer, PublicClient> = new Map();

export function createClient(layer: Layer): PublicClient {
  const cached = clientCache.get(layer);
  if (cached) return cached;

  const layerConfig = layer === 'l1' ? config.l1 : config.l2;
  const client = createPublicClient({
    transport: http(layerConfig.rpc),
  });

  clientCache.set(layer, client);
  return client;
}

export async function getLatestBlock(layer: Layer): Promise<bigint> {
  const client = createClient(layer);
  return client.getBlockNumber();
}

export async function getBlockTimestamp(layer: Layer, blockNumber: bigint): Promise<Date> {
  const client = createClient(layer);
  const block = await client.getBlock({ blockNumber });
  return new Date(Number(block.timestamp) * 1000);
}

export async function getRecentCheckpoints(
  layer: Layer,
  limit: number = 20
): Promise<Checkpoint[]> {
  const client = createClient(layer);
  const layerConfig = layer === 'l1' ? config.l1 : config.l2;
  const currentBlock = await client.getBlockNumber();

  // Search last 1000 blocks for checkpoints
  const fromBlock = currentBlock > 1000n ? currentBlock - 1000n : 0n;

  try {
    const logs = await client.getLogs({
      address: layerConfig.signalService,
      event: CHECKPOINT_SAVED_EVENT,
      fromBlock,
      toBlock: 'latest',
    });

    // Get block timestamps for the checkpoint events
    const checkpoints = await Promise.all(
      logs.slice(-limit * 2).map(async (log) => {
        try {
          const block = await client.getBlock({ blockNumber: log.blockNumber });
          return {
            blockNumber: Number(log.args.blockNumber),
            blockHash: log.args.blockHash as string,
            stateRoot: log.args.stateRoot as string,
            transactionHash: log.transactionHash,
            checkpointedInBlock: Number(log.blockNumber),
            checkpointedAt: new Date(Number(block.timestamp) * 1000),
          };
        } catch {
          return {
            blockNumber: Number(log.args.blockNumber),
            blockHash: log.args.blockHash as string,
            stateRoot: log.args.stateRoot as string,
            transactionHash: log.transactionHash,
            checkpointedInBlock: Number(log.blockNumber),
          };
        }
      })
    );

    return checkpoints.reverse().slice(0, limit);
  } catch (error) {
    console.error(`Error fetching checkpoints from ${layer}:`, error);
    return [];
  }
}

export async function findCheckpointForBlock(
  layer: Layer,
  targetBlock: number
): Promise<Checkpoint | null> {
  const checkpoints = await getRecentCheckpoints(layer, 50);

  // Find smallest checkpoint >= targetBlock
  const validCheckpoints = checkpoints
    .filter((cp) => cp.blockNumber >= targetBlock)
    .sort((a, b) => a.blockNumber - b.blockNumber);

  return validCheckpoints[0] || null;
}

export async function getChainStatus(layer: Layer) {
  const currentBlock = await getLatestBlock(layer);
  const layerConfig = layer === 'l1' ? config.l1 : config.l2;

  return {
    chainId: layerConfig.chainId,
    name: layerConfig.name,
    currentBlock: Number(currentBlock),
    explorer: layerConfig.explorer,
  };
}

export function formatBlockHash(hash: string, length: number = 10): string {
  if (!hash) return '';
  return `${hash.slice(0, length)}...${hash.slice(-4)}`;
}

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}
