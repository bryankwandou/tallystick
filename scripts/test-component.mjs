/**
 * Integration test against the *compiled WASM component*, not the host-target
 * build. The unit tests in contract/src prove the logic; this proves the
 * artifact that actually gets registered with T3N behaves the same way.
 *
 *   cd contract && cargo build --target wasm32-wasip2 --release
 *   npx jco transpile contract/target/wasm32-wasip2/release/z_tenant_settle.wasm -o .jco
 *   node scripts/test-component.mjs
 */

import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const WASM = "contract/target/wasm32-wasip2/release/z_tenant_settle.wasm";
const OUT = ".jco";

if (!existsSync(WASM)) {
  console.error(`✗ No component at ${WASM}`);
  console.error("  Build it:  cd contract && cargo build --target wasm32-wasip2 --release");
  process.exit(1);
}

// The component imports host:interfaces/logging, which Node's ESM loader cannot
// resolve as a bare specifier. jco's --map rewrites it to a local stub. The TEE
// supplies the real implementation; for testing, logging is a no-op.
mkdirSync(OUT, { recursive: true });
writeFileSync(
  `${OUT}/host-logging.js`,
  "export function info() { return { tag: 'ok', val: undefined }; }\n",
  "utf8",
);

console.log("· transpiling component…");
execSync(
  `npx jco transpile ${WASM} -o ${OUT} --map host:interfaces/logging=./host-logging.js`,
  { stdio: "pipe" },
);

const modUrl = pathToFileURL(resolve(OUT, "z_tenant_settle.js")).href;
const mod = await import(modUrl);
const contracts = mod.contracts ?? mod;

const enc = new TextEncoder();
const dec = new TextDecoder();

let pass = 0;
let fail = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    pass++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    console.log(`      ${e.message}`);
    fail++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function issue(claimed, observed) {
  const payload = {
    claim: {
      settlement_id: "4f2a",
      agent_did: "did:t3n:8f2c9a4e17bd35006ea1cc4820f9b7d3",
      job: "classify",
      units_claimed: claimed,
      amount_lamports: 250000000,
    },
    work: { settlement_id: "4f2a", units_observed: observed },
  };
  const out = contracts.issueReceipt({
    input: enc.encode(JSON.stringify(payload)),
    userProfile: undefined,
    context: undefined,
  });
  return JSON.parse(dec.decode(new Uint8Array(out)));
}

console.log("\n── component integration ───────────────────────────────────\n");

check("honest claim produces matching halves", () => {
  const r = issue(512, 512);
  assert(r.matched === true, `expected matched, got ${r.matched}`);
  assert(r.claim_hash === r.receipt_hash, "digests should be equal");
  assert(
    r.claim_hash.length === 64,
    `digest should be 64 hex chars (SHA-256), got ${r.claim_hash.length}`,
  );
  assert(/^[0-9a-f]{64}$/.test(r.claim_hash), "digest should be lowercase hex");
});

check("overstated claim diverges", () => {
  const r = issue(512, 500);
  assert(r.matched === false, "expected mismatch");
  assert(r.claim_hash !== r.receipt_hash, "digests should differ");
});

check("understated claim also diverges", () => {
  const r = issue(500, 512);
  assert(r.matched === false, "expected mismatch");
});

check("single-unit discrepancy is detected", () => {
  const r = issue(1000, 999);
  assert(r.matched === false, "a one-unit gap must not pass");
});

check("digest is deterministic across calls", () => {
  const a = issue(512, 512);
  const b = issue(512, 512);
  assert(a.claim_hash === b.claim_hash, "same input must yield same digest");
});

check("settlement id mismatch is rejected", () => {
  let threw = false;
  try {
    contracts.issueReceipt({
      input: enc.encode(
        JSON.stringify({
          claim: {
            settlement_id: "4f2a",
            agent_did: "did:t3n:x",
            job: "j",
            units_claimed: 1,
            amount_lamports: 1,
          },
          work: { settlement_id: "9z9z", units_observed: 1 },
        }),
      ),
      userProfile: undefined,
      context: undefined,
    });
  } catch {
    threw = true;
  }
  assert(threw, "mismatched settlement ids must be rejected");
});

check("zero amount is rejected", () => {
  let threw = false;
  try {
    contracts.issueReceipt({
      input: enc.encode(
        JSON.stringify({
          claim: {
            settlement_id: "4f2a",
            agent_did: "did:t3n:x",
            job: "j",
            units_claimed: 1,
            amount_lamports: 0,
          },
          work: { settlement_id: "4f2a", units_observed: 1 },
        }),
      ),
      userProfile: undefined,
      context: undefined,
    });
  } catch {
    threw = true;
  }
  assert(threw, "zero amount must be rejected");
});

check("malformed input is rejected, not silently accepted", () => {
  let threw = false;
  try {
    contracts.issueReceipt({
      input: enc.encode("{not json"),
      userProfile: undefined,
      context: undefined,
    });
  } catch {
    threw = true;
  }
  assert(threw, "malformed JSON must be rejected");
});

check("check-halves agrees with issue-receipt", () => {
  const r = issue(512, 500);
  const out = contracts.checkHalves({
    input: enc.encode(
      JSON.stringify({ claim_hash: r.claim_hash, receipt_hash: r.receipt_hash }),
    ),
    userProfile: undefined,
    context: undefined,
  });
  const v = JSON.parse(dec.decode(new Uint8Array(out)));
  assert(v.matched === false, "check-halves must agree with the receipt");
  assert(typeof v.reason === "string" && v.reason.length > 0, "reason should be present");
});

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
