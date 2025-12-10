// Chain adapter types for multi-chain state viewer

export type NetworkType = 'mainnet' | 'testnet';

export interface Checkpoint {
  blockNumber: number;
  blockHash: string;
  stateRoot?: string;  // Taiko has stateRoot, Arbitrum has sendRoot
  sendRoot?: string;
  timestamp?: number;
  txHash?: string;
}

export interface ChainStatus {
  chainName: string;
  direction: 'l1ToL2' | 'l2ToL1';
  isConnected: boolean;
  latestCheckpoint: Checkpoint | null;
  totalCheckpoints: number;
  contractAddress: string;
  currentBlock?: number;  // Current block on the source chain
  blocksBehind?: number;  // How many blocks behind the checkpoint is
  timeBehind?: string;    // Human-readable time behind (e.g., "6.6 days", "4h 16m")
  error?: string;
}

export interface ProofResult {
  exists: boolean;
  blockNumber: number;
  blockHash?: string;
  stateRoot?: string;
  sendRoot?: string;
  proofData?: {
    storageProof?: string[];
    accountProof?: string[];
  };
  error?: string;
}

export interface LayerConfig {
  address: string;
  rpc: string;
  chainId: number;
  explorerUrl: string;
  broadcaster?: string;  // Contract address for storage proofs
  checkpointsSlot?: number;  // Storage slot for checkpoints
}

export interface ChainConfig {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  directions: {
    l1ToL2: boolean;
    l2ToL1: boolean;
  };
  contracts: {
    l1: LayerConfig;
    l2: LayerConfig;
  };
  supportsProofGeneration?: boolean;  // Whether this chain supports proof generation
  blockTime?: {
    l1: number;  // L1 block time in milliseconds
    l2: number;  // L2 block time in milliseconds
  };
}

export interface ChainAdapter {
  config: ChainConfig;

  getStatus(direction: 'l1ToL2' | 'l2ToL1'): Promise<ChainStatus>;
  getCheckpoints(direction: 'l1ToL2' | 'l2ToL1', limit?: number): Promise<Checkpoint[]>;
  checkProof(direction: 'l1ToL2' | 'l2ToL1', blockNumber: number): Promise<ProofResult>;
}
