/**
 * Regenerate src/lib/settlements.ts seed data using the real digest function,
 * so the demo records are internally consistent with the contract. Signatures
 * stay empty until a funded run of 03-settle-devnet.ts fills them in.
 *
 *   node scripts/seed-from-digests.mjs
 */

import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

function canonical(fields) {
  const e = new TextEncoder();
  const parts = [];
  const be32 = (n) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
  for (const [k, v] of fields) {
    const kb = e.encode(k);
    const vb = e.encode(v);
    parts.push(...be32(kb.length), ...kb, ...be32(vb.length), ...vb);
  }
  return new Uint8Array(parts);
}

const digest = (did, job, units, amount) =>
  createHash("sha256")
    .update(
      canonical([
        ["agent", did],
        ["job", job],
        ["units", String(units)],
        ["amount", String(amount)],
      ]),
    )
    .digest("hex");

const A = "did:t3n:8f2c9a4e17bd35006ea1cc4820f9b7d3";
const B = "did:t3n:5a91e0c4d7b2683f1ac6e5209db47f8e";

const rows = [
  { id: "4f2a", did: A, job: "Reconcile 1,284 invoice rows against ledger export", claimed: 1284, observed: 1284, amt: 250_000_000, at: "2026-08-10T09:12:44Z" },
  { id: "7b19", did: A, job: "Fetch and normalise 42 supplier price sheets", claimed: 42, observed: 42, amt: 120_000_000, at: "2026-08-10T08:47:11Z" },
  { id: "c3d8", did: B, job: "Classify 512 support tickets by severity", claimed: 512, observed: 500, amt: 80_000_000, at: "2026-08-10T08:19:03Z" },
];

const body = rows
  .map((r) => {
    const c = digest(r.did, r.job, r.claimed, r.amt);
    const rc = digest(r.did, r.job, r.observed, r.amt);
    const matched = c === rc;
    return `  {
    id: "${r.id}",
    agentDid: "${r.did}",
    contract: "z:8f2c9a4e17bd35006ea1cc4820f9b7d3:settle",
    contractVersion: "0.1.0",
    amountLamports: ${r.amt.toLocaleString("en-US").replace(/,/g, "_")},
    unitsClaimed: ${r.claimed},
    unitsObserved: ${r.observed},${
      matched
        ? ""
        : `
    /* The agent reported ${r.claimed} units; the enclave counted ${r.observed}. */`
    }
    claimHash: "${c}",
    receiptHash: "${rc}",
    signature: "",
    slot: 0,
    settledAt: "${r.at}",
    job: ${JSON.stringify(r.job)},
  },`;
  })
  .join("\n");

console.log(body);
writeFileSync(
  "settlements.seed.txt",
  body + "\n",
  "utf8",
);
console.log("\nwrote settlements.seed.txt");
