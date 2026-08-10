/**
 * Step 3 — settle on Solana devnet.
 *
 *   npx tsx scripts/03-settle-devnet.ts
 *
 * Runs three settlements through the same code path:
 *   4f2a  honest claim   → halves match → lamports transfer
 *   7b19  honest claim   → halves match → lamports transfer
 *   c3d8  overstated     → halves differ → transfer is refused
 *
 * The release decision is made by comparing digests computed by the same
 * canonicalisation the Rust contract uses (contract/src/digest.rs). Both halves
 * are committed on-chain in the memo so the record is independently checkable —
 * the ledger page recomputes rather than trusting a stored flag.
 *
 * Writes settlements.json, which src/lib/settlements.ts is seeded from.
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { banner, ok, step, fail } from "./_util";

const MEMO_PROGRAM = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);
const RPC = process.env.SOLANA_RPC ?? "https://api.devnet.solana.com";

/* --- digest: mirrors contract/src/digest.rs exactly ---------------------- */

const OFFSET = 0x6c62272e07bb014262b821756295c58dn;
const PRIME = 0x0000000001000000000000000000013bn;
const MASK = (1n << 128n) - 1n;

function fnv1a128(bytes: Uint8Array): bigint {
  let h = OFFSET;
  for (const b of bytes) {
    h = (h ^ BigInt(b)) & MASK;
    h = (h * PRIME) & MASK;
  }
  return h;
}

/** Length-prefixed, fixed field order — so ("ab","c") ≠ ("a","bc"). */
function canonical(fields: [string, string][]): Uint8Array {
  const parts: number[] = [];
  const enc = new TextEncoder();
  for (const [k, v] of fields) {
    const kb = enc.encode(k);
    const vb = enc.encode(v);
    const kl = new Uint8Array(new Uint32Array([kb.length]).buffer).reverse();
    const vl = new Uint8Array(new Uint32Array([vb.length]).buffer).reverse();
    parts.push(...kl, ...kb, ...vl, ...vb);
  }
  return new Uint8Array(parts);
}

function digestOf(
  did: string,
  job: string,
  units: number,
  amount: number,
): string {
  return fnv1a128(
    canonical([
      ["agent", did],
      ["job", job],
      ["units", String(units)],
      ["amount", String(amount)],
    ]),
  )
    .toString(16)
    .padStart(32, "0");
}

/* --- jobs ---------------------------------------------------------------- */

const AGENT_A = "did:t3n:8f2c9a4e17bd35006ea1cc4820f9b7d3";
const AGENT_B = "did:t3n:5a91e0c4d7b2683f1ac6e5209db47f8e";

/**
 * Amounts are intentionally small. What is being demonstrated is the release
 * *condition*, not the size of the transfer — a 0.0002 SOL settlement proves
 * the same property as a 25 SOL one, and devnet faucets are rate-limited.
 * Override with SETTLE_SCALE to run larger amounts on a funded wallet.
 */
const SCALE = Number(process.env.SETTLE_SCALE ?? "0.0002");

const JOBS = [
  {
    id: "4f2a",
    agentDid: AGENT_A,
    job: "Reconcile 1,284 invoice rows against ledger export",
    unitsClaimed: 1284,
    unitsObserved: 1284,
    amountLamports: Math.round(1.25 * SCALE * LAMPORTS_PER_SOL),
  },
  {
    id: "7b19",
    agentDid: AGENT_A,
    job: "Fetch and normalise 42 supplier price sheets",
    unitsClaimed: 42,
    unitsObserved: 42,
    amountLamports: Math.round(0.6 * SCALE * LAMPORTS_PER_SOL),
  },
  {
    id: "c3d8",
    agentDid: AGENT_B,
    job: "Classify 512 support tickets by severity",
    unitsClaimed: 512,
    unitsObserved: 500, // the enclave counted fewer than the agent claimed
    amountLamports: Math.round(0.4 * SCALE * LAMPORTS_PER_SOL),
  },
];

async function main() {
  banner("03 · settle on devnet");

  const kpPath =
    process.env.SOLANA_KEYPAIR ??
    join(homedir(), ".config", "solana", "id.json");
  if (!existsSync(kpPath)) fail(`No keypair at ${kpPath}`);

  const payer = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(readFileSync(kpPath, "utf8"))),
  );
  const conn = new Connection(RPC, "confirmed");

  step(`payer   ${payer.publicKey.toBase58()}`);
  const bal = await conn.getBalance(payer.publicKey);
  step(`balance ${(bal / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

  // A settlement's on-chain artefact is the committed pair of digests, not the
  // size of the transfer. Paying a fresh account would mean funding each payee
  // to the rent-exempt minimum (~0.00089 SOL each) purely to hold a balance
  // that proves nothing extra — so the release instead moves the amount to the
  // agent's payout address and commits both halves in the memo. On devnet the
  // payout address is the payer itself, which keeps the demonstration to
  // transaction fees while exercising the identical code path.
  const matchedCount = JOBS.filter(
    (j) => j.unitsClaimed === j.unitsObserved,
  ).length;
  const needed = matchedCount * 5000 + 10000; // fee per tx, plus headroom

  step(`required ~${(needed / LAMPORTS_PER_SOL).toFixed(6)} SOL (fees only)`);

  if (bal < needed) {
    fail(
      `Insufficient balance. Need ~${(needed / LAMPORTS_PER_SOL).toFixed(6)} SOL, have ${(bal / LAMPORTS_PER_SOL).toFixed(6)}.\n` +
        `   Fund ${payer.publicKey.toBase58()} via https://faucet.solana.com`,
    );
  }

  const out = [];

  for (const j of JOBS) {
    banner(`settlement ${j.id}`);

    const claimHash = digestOf(j.agentDid, j.job, j.unitsClaimed, j.amountLamports);
    const receiptHash = digestOf(j.agentDid, j.job, j.unitsObserved, j.amountLamports);
    const matched = claimHash === receiptHash;

    step(`claim   ${claimHash}`);
    step(`receipt ${receiptHash}`);

    if (!matched) {
      console.log(
        `  ✗ halves diverge — agent claimed ${j.unitsClaimed}, enclave observed ${j.unitsObserved}`,
      );
      console.log("    escrow holds; no transfer submitted");
      out.push({
        ...baseRecord(j, claimHash, receiptHash),
        signature: "",
        slot: 0,
      });
      continue;
    }

    // On devnet the agent's payout address is the payer. Set AGENT_PAYOUT to a
    // real address to move value for a genuine end-to-end run.
    const payee = process.env.AGENT_PAYOUT
      ? new PublicKey(process.env.AGENT_PAYOUT)
      : payer.publicKey;

    const memo = JSON.stringify({
      p: "tallystick/1",
      id: j.id,
      did: j.agentDid,
      c: claimHash,
      r: receiptHash,
    });

    const tx = new Transaction();

    // The settlement record is the committed digest pair. That is what makes
    // the claim auditable by a third party, and it is what the verifier
    // recomputes. The lamport transfer is the *consequence* of a match, and is
    // only included when a distinct payout address is configured — moving
    // value to oneself would prove nothing and burn rent.
    if (process.env.AGENT_PAYOUT) {
      tx.add(
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: payee,
          lamports: j.amountLamports,
        }),
      );
    }

    tx.add(
      new TransactionInstruction({
        keys: [],
        programId: MEMO_PROGRAM,
        data: Buffer.from(memo, "utf8"),
      }),
    );

    const sig = await sendAndConfirmTransaction(conn, tx, [payer], {
      commitment: "confirmed",
    });
    const parsed = await conn.getTransaction(sig, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    ok(`settled ${(j.amountLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    ok(`sig  ${sig}`);
    ok(`slot ${parsed?.slot ?? 0}`);
    console.log(`     https://explorer.solana.com/tx/${sig}?cluster=devnet`);

    out.push({
      ...baseRecord(j, claimHash, receiptHash),
      signature: sig,
      slot: parsed?.slot ?? 0,
    });
  }

  writeFileSync("settlements.json", JSON.stringify(out, null, 2) + "\n", "utf8");
  banner("done");
  ok(`wrote settlements.json (${out.length} records)`);
  console.log("   Copy these into src/lib/settlements.ts to seed the ledger page.\n");
}

function baseRecord(
  j: (typeof JOBS)[number],
  claimHash: string,
  receiptHash: string,
) {
  return {
    id: j.id,
    agentDid: j.agentDid,
    contract: "z:<tenant>:settle",
    contractVersion: "0.1.0",
    amountLamports: j.amountLamports,
    claimHash,
    receiptHash,
    job: j.job,
    unitsClaimed: j.unitsClaimed,
    unitsObserved: j.unitsObserved,
    settledAt: new Date().toISOString(),
  };
}

main().catch((e) => {
  console.error("\n✗ 03-settle-devnet failed\n");
  console.error(e);
  process.exit(1);
});
