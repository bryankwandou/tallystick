/**
 * Cross-implementation parity.
 *
 * The Rust contract computes the receipt digest inside the enclave; the
 * settlement script computes the claim digest outside it. If those two
 * implementations disagree by even one byte, every honest settlement would be
 * rejected and the system would be silently broken. This test pins them
 * together.
 *
 *   node scripts/test-parity.mjs
 */

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const WASM = "contract/target/wasm32-wasip2/release/z_tenant_settle.wasm";
const OUT = ".jco";

if (!existsSync(WASM)) {
  console.error(`✗ No component at ${WASM} — run npm run contract:build`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
writeFileSync(
  `${OUT}/host-logging.js`,
  "export function info() { return { tag: 'ok', val: undefined }; }\n",
  "utf8",
);
if (!existsSync(`${OUT}/z_tenant_settle.js`)) {
  execSync(
    `npx jco transpile ${WASM} -o ${OUT} --map host:interfaces/logging=./host-logging.js`,
    { stdio: "pipe" },
  );
}

const mod = await import(pathToFileURL(resolve(OUT, "z_tenant_settle.js")).href);
const contracts = mod.contracts ?? mod;
const enc = new TextEncoder();
const dec = new TextDecoder();

/* --- the TypeScript side, copied from 03-settle-devnet.ts ---------------- */

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

function digestTs(did, job, units, amount) {
  return createHash("sha256")
    .update(
      canonical([
        ["agent", did],
        ["job", job],
        ["units", String(units)],
        ["amount", String(amount)],
      ]),
    )
    .digest("hex");
}

/* --- the Rust side, via the compiled component --------------------------- */

function digestRust(did, job, units, amount) {
  const out = contracts.issueReceipt({
    input: enc.encode(
      JSON.stringify({
        claim: {
          settlement_id: "parity",
          agent_did: did,
          job,
          units_claimed: units,
          amount_lamports: amount,
        },
        work: { settlement_id: "parity", units_observed: units },
      }),
    ),
    userProfile: undefined,
    context: undefined,
  });
  return JSON.parse(dec.decode(new Uint8Array(out))).claim_hash;
}

/* --- cases --------------------------------------------------------------- */

const CASES = [
  ["did:t3n:8f2c9a4e17bd35006ea1cc4820f9b7d3", "Reconcile 1,284 invoice rows against ledger export", 1284, 250000000],
  ["did:t3n:8f2c9a4e17bd35006ea1cc4820f9b7d3", "Fetch and normalise 42 supplier price sheets", 42, 120000000],
  ["did:t3n:5a91e0c4d7b2683f1ac6e5209db47f8e", "Classify 512 support tickets by severity", 512, 80000000],
  // edge cases: empty-ish job, unicode, large numbers, boundary units
  ["did:t3n:0", "x", 0, 1],
  ["did:t3n:abc", "réconcilier les factures — 1 284 lignes", 1284, 999999999],
  ["did:t3n:def", "a".repeat(200), 18446744073709551n > 0n ? 4294967295 : 0, 1000000000],
];

console.log("\n── rust / typescript digest parity ─────────────────────────\n");

let pass = 0;
let fail = 0;

for (const [did, job, units, amount] of CASES) {
  const ts = digestTs(did, job, units, amount);
  const rs = digestRust(did, job, units, amount);
  const label = job.length > 44 ? job.slice(0, 41) + "…" : job;
  if (ts === rs) {
    console.log(`  ✓ ${label}`);
    console.log(`      ${ts}`);
    pass++;
  } else {
    console.log(`  ✗ ${label}`);
    console.log(`      ts:   ${ts}`);
    console.log(`      rust: ${rs}`);
    fail++;
  }
}

console.log(`\n  ${pass} matched, ${fail} diverged\n`);
process.exit(fail === 0 ? 0 : 1);
