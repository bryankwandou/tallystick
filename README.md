<div align="center">
  <img src="public/logo.svg" width="56" alt="Tallystick" />
  <h1>Tallystick</h1>
  <p><strong>Settlement your agent can prove.</strong></p>
  <p>
    <a href="https://tallystick.vercel.app">Live app</a> ·
    <a href="docs/BUGS.md">ADK findings</a> ·
    <a href="contract/">TEE contract</a> ·
    <a href="SUBMISSION.md">Bounty submission</a>
  </p>
</div>

---

An autonomous agent that spends money leaves one question open: what actually
happened, and whose account of it do you believe? Tallystick splits every payout
in two. The agent signs a claim. A Rust contract running inside a T3N trusted
execution environment writes the receipt. Funds move only when the two halves
produce the same digest.

The name is literal. A tally stick was a debt record cleft lengthwise, one half
held by each party; matching the grain proved the record genuine because neither
side could forge it alone.

## Why this rather than a signed log

An agent writing its own audit log is an agent grading its own homework. The
common alternatives all keep the agent in the loop:

| Approach | What it proves | Failure |
|---|---|---|
| Agent-written audit log | Nothing | The agent authors the evidence |
| Operator-side reconciliation | Operator's view | No third party can check it |
| Multisig on the payout | Humans approved | Does not scale to agent frequency |
| **Split claim + enclave receipt** | Both halves agree | Requires a TEE, which T3N provides |

The property that matters: **the half that authorises payment is not written by
the party being paid.**

## How it works

```
  agent                    T3N enclave                 Solana devnet
    │                           │                            │
    │  signs claim              │                            │
    │  (did:t3n:…, job, units)  │                            │
    ├──────────────────────────►│                            │
    │                           │  reads the work record     │
    │                           │  it can observe directly   │
    │                           │                            │
    │                           │  digest(claim)  ──┐        │
    │                           │  digest(observed) ─┤        │
    │                           │                   │        │
    │                           ├───────────────────┴───────►│
    │                           │   both halves committed    │
    │                           │                            │  equal?
    │                           │                            │  ├ yes → release
    │                           │                            │  └ no  → hold
```

Both digests come from the same function over the same canonical encoding. The
only difference is where the unit count originated — the agent's claim, or what
the enclave counted. A mismatch means the claim does not describe the work.

## Repository layout

```
contract/            Rust TEE contract, compiles to wasm32-wasip2
  src/digest.rs      canonical encoding + FNV-1a-128, with tests
  src/settle.rs      issue-receipt / check-halves, with tests
  wit/world.wit      exported interface and host imports
  wit/deps/          vendored host packages (see finding #3)
scripts/
  01-authenticate.ts   handshake + authenticate, writes DID.txt
  02-register-contract.ts  uploads the component, records contract_id
  03-settle-devnet.ts  runs settlements, writes settlements.json
src/                 Next.js app — landing, /verify, /ledger, /docs
docs/BUGS.md         four reproducible ADK findings
brand.md             palette, typography, and the rules behind them
```

## Running it

### 1. The contract

```bash
cd contract
rustup target add wasm32-wasip2
cargo test                                    # 9 tests, no network needed
cargo build --target wasm32-wasip2 --release
wasm-tools component wit target/wasm32-wasip2/release/z_tenant_settle.wasm
```

The last command should print `export z:tenant-settle/contracts@0.1.0`.

> **Note.** `wit/deps/` must be present or the build fails with
> `package 'host:tenant@1.0.0' not found`. The published walkthrough does not
> mention this — see [finding #3](docs/BUGS.md).

### 2. T3N

Claim a key at [go.terminal3.io/adk-community](https://go.terminal3.io/adk-community).
It is shown once.

```bash
export T3N_API_KEY="<key>"        # $env:T3N_API_KEY="<key>" on PowerShell
npx tsx scripts/01-authenticate.ts   # writes DID.txt
npx tsx scripts/02-register-contract.ts
```

`01-authenticate.ts` prints the SDK's actual export surface before it does
anything else, so a shape change shows up as a readable list rather than an
undefined-property crash.

### 3. Solana devnet

```bash
solana config set --url devnet
solana airdrop 1                  # or https://faucet.solana.com
npx tsx scripts/03-settle-devnet.ts
```

Three settlements run: two where the agent's claim matches what the enclave
observed, and one where the agent claims 512 units against 500 observed. The
third is the interesting one — it is recorded, attributed, and not paid.

Environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `SOLANA_RPC` | `api.devnet.solana.com` | RPC endpoint |
| `SOLANA_KEYPAIR` | `~/.config/solana/id.json` | Payer |
| `SETTLE_SCALE` | `0.0002` | Multiplier on settlement amounts |
| `AGENT_PAYOUT` | unset | Payout address; when unset, memo-only |

By default the script commits the digest pair via the memo program and does not
transfer lamports. The transfer is the *consequence* of a match, not the proof of
one, and sending value to your own address would demonstrate nothing while
burning rent. Set `AGENT_PAYOUT` to a second address for a full value-moving run.

### 4. The app

```bash
npm install
npm run dev
```

## Design

The palette, typography, and the constraints on both are documented in
[brand.md](brand.md). Two decisions worth stating here because they get
reverted by well-meaning contributors:

- **The accent colour marks one thing: verified state.** Not buttons in general,
  not section headings, not hover washes. The restraint is the point.
- **There are six motion primitives and no more.** Each communicates a state
  change and all are gated behind `prefers-reduced-motion`. The library-of-160-
  animations approach was considered and rejected.

## Status

Devnet only. The contract is tested and builds to a valid WASM component; the
T3N registration path is scripted but needs a key to exercise. Settlement records
shown in the app are seeded from `settlements.json` and are replaced by real
runs — the verifier recomputes the match from both stored halves rather than
reading a flag, so seeded data fails verification exactly the way tampered data
would.

## Licence

MIT.
