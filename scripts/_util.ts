import { readFileSync, writeFileSync, existsSync } from "node:fs";

const STATE = ".t3n-state.json";

export type State = {
  tenantDid?: string;
  address?: string;
  authenticatedAt?: string;
  contractId?: number | string;
  scriptName?: string;
  registeredAt?: string;
};

export function loadState(): State {
  if (!existsSync(STATE)) return {};
  try {
    return JSON.parse(readFileSync(STATE, "utf8")) as State;
  } catch {
    return {};
  }
}

export function saveState(patch: State): void {
  const next = { ...loadState(), ...patch };
  writeFileSync(STATE, JSON.stringify(next, null, 2) + "\n", "utf8");
}

export function requireApiKey(): string {
  const key = process.env.T3N_API_KEY;
  if (!key) {
    fail(
      "T3N_API_KEY is not set.\n\n" +
        "   Claim one at https://go.terminal3.io/adk-community (browser SSO),\n" +
        "   then:  $env:T3N_API_KEY=\"<key>\"   (PowerShell)\n" +
        "          export T3N_API_KEY=\"<key>\"  (bash)\n\n" +
        "   The key is shown once and cannot be recovered.",
    );
  }
  return key;
}

export function requireState<K extends keyof State>(k: K): NonNullable<State[K]> {
  const v = loadState()[k];
  if (v === undefined || v === null) {
    fail(`${String(k)} missing from ${STATE} — run the earlier script first.`);
  }
  return v as NonNullable<State[K]>;
}

export function banner(t: string): void {
  console.log(`\n── ${t} ${"─".repeat(Math.max(0, 56 - t.length))}\n`);
}

export function step(t: string): void {
  console.log(`  · ${t}`);
}

export function ok(t: string): void {
  console.log(`  ✓ ${t}`);
}

export function fail(t: string): never {
  console.error(`\n  ✗ ${t}\n`);
  process.exit(1);
}
