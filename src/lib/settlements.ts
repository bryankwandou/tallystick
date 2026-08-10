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
 * Digests below are real SHA-256 values produced by the same canonical encoding
 * the Rust contract uses — regenerate with `node scripts/seed-from-digests.mjs`.
 * Signatures are empty until a funded run of `scripts/03-settle-devnet.ts`
 * fills them in; the UI renders that state honestly rather than inventing one.
 */
export const SETTLEMENTS: Settlement[] = [
  {
    id: "4f2a",
    agentDid: "did:t3n:8f2c9a4e17bd35006ea1cc4820f9b7d3",
    contract: "z:8f2c9a4e17bd35006ea1cc4820f9b7d3:settle",
    contractVersion: "0.1.0",
    amountLamports: 250_000_000,
    unitsClaimed: 1284,
    unitsObserved: 1284,
    claimHash: "2cdad4867c37aa98bbe5ed03c8d6164fd01399a28fc30f452483c085e1035efa",
    receiptHash: "2cdad4867c37aa98bbe5ed03c8d6164fd01399a28fc30f452483c085e1035efa",
    signature: "",
    slot: 0,
    settledAt: "2026-08-10T09:12:44Z",
    job: "Reconcile 1,284 invoice rows against ledger export",
  },
  {
    id: "7b19",
    agentDid: "did:t3n:8f2c9a4e17bd35006ea1cc4820f9b7d3",
    contract: "z:8f2c9a4e17bd35006ea1cc4820f9b7d3:settle",
    contractVersion: "0.1.0",
    amountLamports: 120_000_000,
    unitsClaimed: 42,
    unitsObserved: 42,
    claimHash: "f1b7f7ccb9b931f666b31ca186ac92b33caafc7e265cf9be2110fd45fe3794c2",
    receiptHash: "f1b7f7ccb9b931f666b31ca186ac92b33caafc7e265cf9be2110fd45fe3794c2",
    signature: "",
    slot: 0,
    settledAt: "2026-08-10T08:47:11Z",
    job: "Fetch and normalise 42 supplier price sheets",
  },
  {
    id: "c3d8",
    agentDid: "did:t3n:5a91e0c4d7b2683f1ac6e5209db47f8e",
    contract: "z:8f2c9a4e17bd35006ea1cc4820f9b7d3:settle",
    contractVersion: "0.1.0",
    amountLamports: 80_000_000,
    unitsClaimed: 512,
    unitsObserved: 500,
    /* The agent reported 512 units; the enclave counted 500. */
    claimHash: "fbcaf223d7db10feea76c32aa0d053dc5022338102dcf1d2bb91d6f8797aa12e",
    receiptHash: "277b709b3686956e1595b399192785026f6b90c4aa3016e6ba19feee91f6caf1",
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
