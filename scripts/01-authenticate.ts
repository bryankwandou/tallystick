/**
 * Step 1 — authenticate against T3N and record the tenant DID.
 *
 * Usage:
 *   export T3N_API_KEY="<key from go.terminal3.io/adk-community>"
 *   npx tsx scripts/01-authenticate.ts
 *
 * Writes .t3n-state.json so later steps do not re-derive the DID. The docs are
 * explicit that the tenant DID must never be hardcoded or derived from a wallet
 * address — it is an opaque platform-assigned id, so we persist whatever
 * authenticate() hands back rather than reconstructing it.
 */

import { writeFileSync } from "node:fs";
import { requireApiKey, saveState, banner, ok, fail, step } from "./_util";

async function main() {
  banner("01 · authenticate");
  const apiKey = requireApiKey();

  step("Importing @terminal3/t3n-sdk");
  const sdk: Record<string, unknown> = await import("@terminal3/t3n-sdk");

  // The SDK's export surface has shifted across 4.x. Resolve defensively and
  // report what is actually present rather than assuming a shape.
  const names = Object.keys(sdk).sort();
  console.log(`   exports (${names.length}): ${names.slice(0, 24).join(", ")}${names.length > 24 ? " …" : ""}`);

  const TenantClient =
    (sdk.TenantClient as never) ??
    (sdk.T3NClient as never) ??
    (sdk.Client as never) ??
    ((sdk.default as Record<string, unknown>)?.TenantClient as never);

  if (!TenantClient) {
    fail(
      "Could not find a client constructor on the SDK.\n" +
        `   Exports seen: ${names.join(", ")}\n` +
        "   This is a bug worth reporting — see docs/BUGS.md.",
    );
  }

  step("Constructing client (environment: testnet)");
  const t3n = new (TenantClient as new (o: unknown) => {
    handshake: () => Promise<unknown>;
    authenticate: (i: unknown) => Promise<{ value: string }>;
    setEnvironment?: (e: string) => void;
  })({ apiKey, environment: "testnet" });

  if (typeof t3n.setEnvironment === "function") t3n.setEnvironment("testnet");

  step("handshake()");
  await t3n.handshake();
  ok("handshake completed");

  step("authenticate()");
  const createEthAuthInput = sdk.createEthAuthInput as
    | ((a: string) => unknown)
    | undefined;
  const ethGetAddress = (sdk.eth_get_address ?? sdk.ethGetAddress) as
    | ((k: string) => string)
    | undefined;

  if (!createEthAuthInput || !ethGetAddress) {
    fail(
      "Missing createEthAuthInput / eth_get_address on the SDK surface.\n" +
        `   Exports seen: ${names.join(", ")}`,
    );
  }

  const address = ethGetAddress(apiKey);
  console.log(`   derived address: ${address}`);

  const did = await t3n.authenticate(createEthAuthInput(address));
  const tenantDid = did.value;

  if (!tenantDid?.startsWith("did:t3n:")) {
    fail(`authenticate() returned an unexpected DID shape: ${tenantDid}`);
  }

  ok(`tenant DID: ${tenantDid}`);
  saveState({ tenantDid, address, authenticatedAt: new Date().toISOString() });

  writeFileSync(
    "DID.txt",
    `${tenantDid}\n`,
    "utf8",
  );
  console.log("\n   Wrote DID.txt — this is the value the bounty form asks for.");
}

main().catch((e) => {
  console.error("\n✗ 01-authenticate failed\n");
  console.error(e);
  process.exit(1);
});
