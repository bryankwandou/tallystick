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
  /** Units the agent asserted it completed. */
  unitsClaimed: number;
  /** Units the enclave could actually account for. */
  unitsObserved: number;
  /** SHA-256 over the canonical encoding of the agent's claim. */
  claimHash: string;
  /** SHA-256 over the same encoding, using the observed unit count. */
  receiptHash: string;
  signature: string;
  slot: number;
  settledAt: string;
  job: string;
};

export const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * Real records from a devnet run on 2026-08-10 (`scripts/03-settle-devnet.ts`).
 * Digests are SHA-256 over the canonical encoding the Rust contract uses, and
 * the signatures resolve on Solana Explorer against devnet.
 *
 * Settlement c3d8 has no signature because it was never submitted: the agent's
 * claim and the enclave's receipt disagreed, so the release condition did not
 * hold. That row is the point of the system, not a gap in the data.
 */
export const SETTLEMENTS: Settlement[] = [
  {
    id: "4f2a",
    agentDid: "did:t3n:8f2c9a4e17bd35006ea1cc4820f9b7d3",
    contract: "z:8f2c9a4e17bd35006ea1cc4820f9b7d3:settle",
    contractVersion: "0.1.0",
    amountLamports: 12_500_000,
    unitsClaimed: 1284,
    unitsObserved: 1284,
    claimHash: "e3eb2c63541178ed3048eab3a7f72aeb061918eae90198267da057e5349b0dc5",
    receiptHash: "e3eb2c63541178ed3048eab3a7f72aeb061918eae90198267da057e5349b0dc5",
    signature:
      "NkQ8razSuKBNXSfcS7U5t7esj9BQ7EMGfxC1Zr2eMLYwLA6dd221WUAAfdXuQ9NhCN23Ygz7BKUF7y785g6Zqcb",
    slot: 482_637_177,
    settledAt: "2026-08-10T12:15:38Z",
    job: "Reconcile 1,284 invoice rows against ledger export",
  },
  {
    id: "7b19",
    agentDid: "did:t3n:8f2c9a4e17bd35006ea1cc4820f9b7d3",
    contract: "z:8f2c9a4e17bd35006ea1cc4820f9b7d3:settle",
    contractVersion: "0.1.0",
    amountLamports: 6_000_000,
    unitsClaimed: 42,
    unitsObserved: 42,
    claimHash: "7c9ddedd859773f9e879ff369d8690a0853cde201bfcf9738ac9ae5847e8c18d",
    receiptHash: "7c9ddedd859773f9e879ff369d8690a0853cde201bfcf9738ac9ae5847e8c18d",
    signature:
      "29WUtjRnmM3zsZ2gH4Up3hsp14Wf28fkrwQUdHJDcsgFn5HCbEpLEccz892gwvR4qMHkUbG2C1epotZHLLPtH6xh",
    slot: 482_637_179,
    settledAt: "2026-08-10T12:15:39Z",
    job: "Fetch and normalise 42 supplier price sheets",
  },
  {
    id: "c3d8",
    agentDid: "did:t3n:5a91e0c4d7b2683f1ac6e5209db47f8e",
    contract: "z:8f2c9a4e17bd35006ea1cc4820f9b7d3:settle",
    contractVersion: "0.1.0",
    amountLamports: 4_000_000,
    unitsClaimed: 512,
    unitsObserved: 500,
    /* The agent reported 512 units; the enclave accounted for 500. */
    claimHash: "c30054a56c65f699092db0ce7ee7d3f1da6bb71ba0d5f6e85aefc2ce375f3766",
    receiptHash: "e72c0672940213fdb5a40faf5c251cb87fec9dca7955a1f337fd4cf6eaba9f8f",
    signature: "",
    slot: 0,
    settledAt: "2026-08-10T12:15:39Z",
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
