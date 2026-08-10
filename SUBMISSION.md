# Terminal3 ADK — submission

**Bounty:** Create Agent ID, claim free tokens, & deploy first RUST contract
**Entrant:** nayrbryanGaming
**Repository:** https://github.com/bryankwandou/tallystick
**Live application:** https://tallystick.vercel.app
**DID:** _pending — see "Outstanding" below_

---

## Summary

I completed the ADK walkthrough by building a working contract rather than the
sample, and carried it through to a use case: a settlement layer where an agent's
signed claim is checked against a receipt written inside the enclave, with the
result committed to Solana devnet.

Along the way I hit six issues worth reporting, documented in
[docs/BUGS.md](docs/BUGS.md). The most substantive is that **declared WIT imports
are silently elided from the built component**, which undermines the documented
guarantee that a contract's imports are its capability set. I verified this with
a controlled experiment rather than inferring it.

## What was built

| Component | Status |
|---|---|
| Rust TEE contract, `wasm32-wasip2` | Builds; 9/9 unit tests pass |
| Compiled component | Verified via `wasm-tools`; exports `z:tenant-settle/contracts@0.1.0` |
| Component integration tests | 9/9 pass against the compiled `.wasm` |
| T3N authenticate / register scripts | Written; awaiting API key |
| Solana devnet settlement | Scripted; awaiting funded keypair |
| Web application | Live, four routes |

### The contract

`contract/` exports two functions on the `contracts` interface:

- `issue-receipt` — takes the agent's signed claim plus the work record the
  enclave can observe, returns both digests and whether they agree.
- `check-halves` — recomputes a verdict from two digests.

Both digests come from one function over a length-prefixed canonical encoding,
so `("ab","c")` and `("a","bc")` cannot collide — a mistake that would silently
stop the scheme committing to anything. There is a test for exactly that.

The interesting case is the failing one. When an agent claims 512 units of work
and the enclave observes 500, the digests diverge, the escrow does not release,
and the mismatch stays attributed to the agent's DID. This is the third
settlement in the demo data and it is visible at
[tallystick.vercel.app/verify](https://tallystick.vercel.app/verify) — enter
`c3d8`.

### Verification you can reproduce

```bash
git clone https://github.com/bryankwandou/tallystick
cd tallystick

# contract logic — no network, no key
cd contract && cargo test                    # 9 passed

# build and inspect the component
rustup target add wasm32-wasip2
cargo build --target wasm32-wasip2 --release
wasm-tools component wit target/wasm32-wasip2/release/z_tenant_settle.wasm

# exercise the compiled artifact
cd .. && npm install && npm run test:component   # 9 passed
```

## Findings

Full detail with reproductions in [docs/BUGS.md](docs/BUGS.md).

| # | Finding | Severity |
|---|---|---|
| 1 | Declared WIT imports are elided from the built component | Medium |
| 2 | Nine undeclared `wasi:*` interfaces present in every component | Medium |
| 3 | Quickstart omits vendored `wit/deps`, so the first build fails | Medium |
| 4 | `tenant-did()` returns bytes; docs' snippet treats it as a string | Low |
| 5 | Transpiled components need a manual import map to load | Low |
| 6 | Reported `handshake()` failure — not yet reproduced, needs a key | — |

**Finding #1 in brief.** Two crates with byte-identical `wit/world.wit` declaring
three host imports. Crate A calls only `logging::info`; crate B calls all three
interfaces. Their built components report different import sets. So auditing
`world.wit` overstates what a contract can reach, and the artifact is the only
authority. On a platform whose security model is stated as "imports are your
contract's entire capability set", that gap is worth closing — either by
documenting the artifact as authoritative, or by rejecting components at
registration whose imports do not match their declared world.

**Finding #3 cost the most time.** Following write-contract then build-contract
in order produces six compile errors. Five are downstream noise from the
`wit_bindgen::generate!` macro failing to expand; the real cause is
`package 'host:tenant@1.0.0' not found`. The fix is to copy `wit/deps` from
`Terminal-3/z-tenant-flight`, which the docs reference as an optional example
rather than a prerequisite.

## The use case

The bounty invites an initial use case beyond the first contract. This is that.

Agents are starting to hold budgets and pay for things. The unresolved question
is not whether an agent *can* transact — it is whose account of the work you
believe when settling. An agent that writes its own audit log is grading its own
homework.

T3N supplies the missing half. The enclave can observe the work and write a
receipt the agent cannot forge, because the agent cannot execute inside the
enclave. The agent's DID is issued by the platform rather than derived from a
keypair it controls, so a payment history survives redeployment and key rotation.
Solana provides settlement where the release condition is evaluated by something
neither party controls.

That combination — issued identity, enclave-written receipt, on-chain release
condition — is the product. Neither piece works alone.

## Outstanding

Two items require credentials I do not have yet. Both paths are scripted and
tested to the boundary:

1. **DID.** The API key is issued through browser SSO at
   `go.terminal3.io/adk-community`. `npm run t3n:auth` performs the handshake and
   authenticate flow and writes `DID.txt`. It prints the SDK's actual export
   surface first, so a shape change reports as a readable list rather than an
   undefined-property crash.

2. **Devnet signatures.** `npm run settle` runs three settlements and writes
   `settlements.json`. The public faucet is rate-limited on the CLI keypair
   (`C3otspAauyPNbAx9NA4wkH7P8hxhxhb1dyfqzhSmzaj9`, currently 0.000895 SOL —
   below the rent-exempt minimum, so it cannot sign at all).

The settlement records currently shown in the application are seeded from
`settlements.json` and will be replaced by real runs. Worth noting: the verifier
recomputes the match from both stored halves rather than reading a stored flag,
so seeded records fail verification the same way tampered records would. The page
does not lie about what it has.

## Notes for the team

- Publishing cadence is high — 4.32.0 landed 2026-08-09, one day before this
  work. Findings here are pinned to that version.
- The version-routing rule on the register-contract page (invocations route to
  the latest registered version for a tail, even when an older version is passed
  explicitly) is documented but deserves a louder warning. It means a
  re-registration silently changes behaviour for every existing caller.
- `http::call` being synchronous is a good default and clearly documented.
- The placeholder mechanism for PII in outbound calls is the strongest part of
  the ADK and is undersold in the docs. It is the reason a contract can hold a
  credential the agent never sees, which is what makes the split-halves model
  possible at all.
