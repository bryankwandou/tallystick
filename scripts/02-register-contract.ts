/**
 * Step 2 — register the compiled WASM component against the tenant namespace.
 *
 *   cargo build --target wasm32-wasip2 --release   (in contract/)
 *   npx tsx scripts/02-register-contract.ts
 *
 * Note the version-routing behaviour documented on the register-contract page:
 * once a higher version exists for a tail, invocations route to the latest
 * regardless of the version passed at exec time. Bump CONTRACT_VERSION
 * deliberately, not reflexively.
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import {
  requireApiKey,
  requireState,
  saveState,
  banner,
  ok,
  fail,
  step,
} from "./_util";

const WASM_PATH = "contract/target/wasm32-wasip2/release/z_tenant_settle.wasm";
const CONTRACT_TAIL = "settle";
const CONTRACT_VERSION = "0.1.0";

async function main() {
  banner("02 · register contract");
  const apiKey = requireApiKey();
  const tenantDid = requireState("tenantDid");

  if (!existsSync(WASM_PATH)) {
    fail(
      `No component at ${WASM_PATH}\n` +
        "   Build it first:  cd contract && cargo build --target wasm32-wasip2 --release",
    );
  }

  const wasmBytes = await readFile(WASM_PATH);
  step(`component: ${(wasmBytes.length / 1024).toFixed(1)} KB`);

  const sdk: Record<string, unknown> = await import("@terminal3/t3n-sdk");
  const TenantClient =
    (sdk.TenantClient as never) ?? (sdk.T3NClient as never) ?? (sdk.Client as never);
  if (!TenantClient) fail("No client constructor on the SDK surface.");

  const t3n = new (TenantClient as new (o: unknown) => {
    handshake: () => Promise<unknown>;
    contracts: {
      register: (a: {
        tail: string;
        version: string;
        wasm: Uint8Array;
      }) => Promise<{ contract_id: number }>;
    };
  })({ apiKey, environment: "testnet" });

  step("handshake()");
  await t3n.handshake();

  step(`register tail="${CONTRACT_TAIL}" version="${CONTRACT_VERSION}"`);
  const result = await t3n.contracts.register({
    tail: CONTRACT_TAIL,
    version: CONTRACT_VERSION,
    wasm: wasmBytes,
  });

  const contractId = result.contract_id;
  const tenantId = tenantDid.slice("did:t3n:".length);
  const scriptName = `z:${tenantId}:${CONTRACT_TAIL}`;

  ok(`registered ${scriptName}`);
  ok(`contract id ${contractId}`);
  saveState({
    contractId,
    scriptName,
    registeredAt: new Date().toISOString(),
  });
}

main().catch((e) => {
  console.error("\n✗ 02-register-contract failed\n");
  console.error(e);
  process.exit(1);
});
