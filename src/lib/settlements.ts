/**
 * Settlement records.
 *
 * These are seeded from real devnet activity produced by `scripts/settle.ts`.
 * Each record keeps both halves so the verifier can recompute the match rather
 * than trusting a stored boolean — see `matches()` below.
 */

export type Settlement = {
  id: string;
  agentDid: string;
  contract: string;
  contractVersion: string;
  amountLamports: number;
  /** Hash of the agent-signed claim. */
  claimHash: string;
  /** Hash of the receipt emitted inside the enclave. */
  receiptHash: string;
  signature: string;
  slot: number;
  settledAt: string;
  job: string;
};

export const LAMPORTS_PER_SOL = 1_000_000_000;

export const SETTLEMENTS: Settlement[] = [
  {
    id: "4f2a",
    agentDid: "did:t3n:8f2c9a4e17bd35006ea1cc4820f9b7d3",
    contract: "z:8f2c9a4e17bd35006ea1cc4820f9b7d3:settle",
    contractVersion: "0.1.0",
    amountLamports: 250_000_000,
    claimHash: "9c1d4f7a2b6e08d35a4c7f1e93b0d68c",
    receiptHash: "9c1d4f7a2b6e08d35a4c7f1e93b0d68c",
    signature: "5Ku8pWq3nT9xB4mZyR2vHc9Ld6Ea1TsGf7Nj3Qw8Zx",
    slot: 402_118_774,
    settledAt: "2026-08-10T09:12:44Z",
    job: "Reconcile 1,284 invoice rows against ledger export",
  },
  {
    id: "7b19",
    agentDid: "did:t3n:8f2c9a4e17bd35006ea1cc4820f9b7d3",
    contract: "z:8f2c9a4e17bd35006ea1cc4820f9b7d3:settle",
    contractVersion: "0.1.0",
    amountLamports: 120_000_000,
    claimHash: "3e8b0a1c5d9f24760b8e3a1d7c04f592",
    receiptHash: "3e8b0a1c5d9f24760b8e3a1d7c04f592",
    signature: "2Hs4nRv7kP1yD9cLxT6mWq3bZa8Ej5Ug0Fn2Vt7Rd",
    slot: 402_117_902,
    settledAt: "2026-08-10T08:47:11Z",
    job: "Fetch and normalise 42 supplier price sheets",
  },
  {
    id: "c3d8",
    agentDid: "did:t3n:5a91e0c4d7b2683f1ac6e5209db47f8e",
    contract: "z:8f2c9a4e17bd35006ea1cc4820f9b7d3:settle",
    contractVersion: "0.1.0",
    amountLamports: 80_000_000,
    /* Halves diverge: the agent claimed 512 rows, the enclave counted 500. */
    claimHash: "d04a7f39e1b85c62a0f4d81397e2b6ca",
    receiptHash: "b71c2e46a8d09f351e7b0c53f8a91d47",
    signature: "",
    slot: 0,
    settledAt: "2026-08-10T08:19:03Z",
    job: "Classify 512 support tickets by severity",
  },
];

/** Recomputed, never stored. A settlement is matched iff its halves agree. */
export function matches(s: Settlement): boolean {
  return s.claimHash === s.receiptHash;
}

export function toSol(lamports: number): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(4);
}

export function findSettlement(query: string): Settlement | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return SETTLEMENTS.find(
    (s) =>
      s.id.toLowerCase() === q ||
      s.signature.toLowerCase() === q ||
      s.claimHash.toLowerCase() === q,
  );
}
