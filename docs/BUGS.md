# Findings — T3N ADK

Issues hit while building a TEE contract and settlement flow against
`@terminal3/t3n-sdk`. Each entry states what was expected, what happened, and
how to reproduce it from a clean checkout.

Environment unless stated otherwise:

| | |
|---|---|
| SDK | `@terminal3/t3n-sdk@4.32.0` (published 2026-08-09) |
| Node | v22 (Windows 11, x64) |
| Rust | stable, target `wasm32-wasip2` |
| wit-bindgen | 0.49 |
| wasm-tools | 1.245.0 |
| Docs revision | as published 2026-08-10 |

---

## 1 · Declared WIT imports are silently elided from the built component

**Severity:** medium — it undermines a documented security property.

**Expected.** [Capabilities come from your WIT imports](https://docs.terminal3.io/developers/adk/tips/capabilities-from-wit-import.md)
states: *"Import only the host interfaces you use — they are your contract's
entire capability set."* Reading that, a reviewer would reasonably audit
`wit/world.wit` to determine what a contract can reach.

**Actual.** The built component's import list is derived from the **call graph**,
not from the declared world. Host interfaces that are declared but never called
are dropped from the artifact entirely.

**Reproduction.** Two crates, byte-identical `wit/world.wit` declaring three
imports (`host:tenant/tenant-context`, `host:interfaces/logging`,
`host:interfaces/kv-store`):

- Crate A calls only `logging::info`.
- Crate B calls `tenant_did`, `seq_no`, `logging::info`, and `kv_store::get`.

```bash
cargo build --target wasm32-wasip2 --release
wasm-tools component wit target/wasm32-wasip2/release/<name>.wasm
```

Crate A yields:

```
import host:interfaces/logging@2.1.0;
```

Crate B yields:

```
import host:tenant/tenant-context@1.0.0;
import host:interfaces/logging@2.1.0;
import host:interfaces/kv-store@2.1.0;
```

**Why it matters.** Auditing `world.wit` overstates a contract's capabilities,
and the reverse also holds: a contract can be granted a capability at registration
time based on a declaration that the artifact does not actually carry. If the
platform provisions map ACLs or egress policy from the declared world rather than
from the component's real import section, the two will disagree.

**Suggestion.** Either state plainly in the capabilities doc that the *built
component*, not `world.wit`, is the authority, and document
`wasm-tools component wit` as the audit command — or have registration reject a
component whose imports do not match its declared world.

---

## 2 · Nine undeclared `wasi:*` interfaces appear in every component

**Severity:** medium — same audit problem, opposite direction.

**Expected.** Given the capability framing above, a component's imports should be
the declared host interfaces.

**Actual.** Every component built for `wasm32-wasip2` also imports:

```
wasi:cli/environment    wasi:cli/exit         wasi:cli/stdin
wasi:cli/stdout         wasi:cli/stderr       wasi:io/error
wasi:io/streams         wasi:clocks/wall-clock
wasi:filesystem/types   wasi:filesystem/preopens
```

None are declared in `world.wit`. They arrive with the target's std shim.
`wasi:filesystem` and `wasi:cli/environment` are the notable ones — a reader
comparing this against "no I/O, no side-effects" would want to know whether the
enclave actually stubs them out.

**Reproduction.** Build any contract from the walkthrough and run
`wasm-tools component wit` on the artifact.

**Suggestion.** Document which `wasi:*` interfaces the TEE host stubs, denies, or
honours. If they are all denied at runtime, saying so once in the docs would
close the question. Building with `wasm32-unknown-unknown` plus an explicit
adapter would avoid them, but the walkthrough specifies `wasm32-wasip2`.

---

## 3 · Quickstart omits the vendored WIT dependencies, so the first build fails

**Severity:** medium — blocks the documented first-run path.

**Expected.** [Write your TEE contract](https://docs.terminal3.io/developers/adk/get-started/walkthrough/write-contract.md)
shows a `world.wit` importing `host:tenant/tenant-context@1.0.0` and friends, and
[Build your TEE contract](https://docs.terminal3.io/developers/adk/get-started/walkthrough/build-contract.md)
says the build needs only `rustup target add wasm32-wasip2` and `cargo build`.
Following those two pages in order should produce a `.wasm`.

**Actual.** `cargo build --target wasm32-wasip2 --release` fails:

```
error: failed to resolve directory while parsing WIT for path [.../wit]
         package 'host:tenant@1.0.0' not found. known packages:
error[E0433]: failed to resolve: use of unresolved module or unlinked crate `exports`
error[E0433]: failed to resolve: use of unresolved module or unlinked crate `host`
```

Six errors total. The `exports`/`host` errors are downstream noise from the
`wit_bindgen::generate!` macro failing to expand — the real cause is the first line.

**Cause.** The host interface packages must be vendored at
`wit/deps/host-tenant-1.0.0/`, `wit/deps/host-interfaces-2.1.0/`, and
`wit/deps/host-outbox-1.0.0/`. The write-contract page shows `wit/deps/` in its
project tree with the comment "vendored host interface packages" but never says
where to obtain them or that the build hard-fails without them. They exist in
`github.com/Terminal-3/z-tenant-flight`, which the page does mention — but as an
optional reference clone rather than a prerequisite.

**Fix that worked.**

```bash
git clone --depth 1 https://github.com/Terminal-3/z-tenant-flight.git
cp -r z-tenant-flight/wit/deps <your-contract>/wit/deps
```

**Suggestion.** Add the copy step to the build page as an explicit prerequisite,
or publish the three WIT packages somewhere fetchable (a `wit-deps` manifest, or
a documented `wkg` registry pull).

---

## 4 · `tenant-did()` returns bytes, not a string

**Severity:** low — documentation inconsistency.

**Expected.** The write-contract page's KV example reads:

```rust
let tid = tenant_context::tenant_did();
let map_name = format!("z:{}:secrets", tid);
```

which implies `tenant_did()` returns something that formats as the hex tail of
the DID.

**Actual.** The WIT declares `tenant-did: func() -> list<u8>` — a 20-byte raw
`CompactDid`. Interpolating it with `{}` does not compile (`Vec<u8>` is not
`Display`), and interpolating with `{:?}` yields `[143, 44, 154, …]`, producing a
map name that will never resolve.

**Reproduction.** Copy the KV snippet from the write-contract page verbatim into
a contract and build it.

**Suggestion.** Correct the snippet to show the hex encoding step, e.g.

```rust
let tid = tenant_context::tenant_did()
    .iter()
    .map(|b| format!("{b:02x}"))
    .collect::<String>();
let map_name = format!("z:{tid}:secrets");
```

The same page separately warns "obtain the tenant ID from `tenant_context::tenant_did()`
without re-encoding", which reads as contradicting the encoding that is actually
required. Worth reconciling the two statements.

---

## 5 · Transpiled components cannot be loaded without a manual import map

**Severity:** low — affects local testing, not production execution.

**Expected.** A component built per the walkthrough should be testable outside
the enclave. `jco transpile` is the standard route for that.

**Actual.** The transpiled module emits a bare ESM import for each host
interface:

```js
import { info } from 'host:interfaces/logging';
```

Node cannot resolve it:

```
Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]: Only URLs with a scheme in: file, data,
and node are supported by the default ESM loader. Received protocol 'host:'
```

**Workaround.** Supply a stub and map it at transpile time:

```bash
npx jco transpile z_tenant_settle.wasm -o .jco \
  --map host:interfaces/logging=./host-logging.js
```

Every imported host interface needs its own stub, and — because of finding #1 —
the set of interfaces requiring stubs is whatever the component actually calls,
not what `world.wit` declares. Working that out means running
`wasm-tools component wit` first.

**Suggestion.** Ship a `@terminal3/host-shims` package providing test doubles for
the host interfaces, or document the `--map` invocation in the test page of the
walkthrough. A contract author's first instinct is to test locally, and this is
the first wall they hit.

`scripts/test-component.mjs` in this repository implements the workaround and
runs 9 assertions against the compiled component.

---

## 6 · Reproducing the reported `handshake()` failure

Two other participants reported SDK-level problems on the bounty listing:

- `client.handshake()` failing with `unsafe_trust_server undefined` on testnet
  and sandbox.
- The published package being obfuscated (minified identifiers, strings assembled
  at runtime), which makes the first two findings above hard to diagnose from the
  package alone.

**Status: not yet reproduced.** These require a live API key, and the key is
issued through browser SSO at `go.terminal3.io/adk-community`. `scripts/01-authenticate.ts`
in this repository is written to exercise exactly this path and to print the
SDK's real export surface on failure, so the result can be recorded here as soon
as a key is available.

The obfuscation observation is independently confirmable without a key:

```bash
npm pack @terminal3/t3n-sdk@4.32.0
```

yields a 1.7 MB tarball, 5.2 MB unpacked across 20 files.

---

## Notes that are not bugs

- Registration routing to the **latest** version for a tail even when an older
  `version` is passed explicitly is documented on the register-contract page, but
  it is surprising enough that a louder warning would be justified — it means a
  re-registration silently changes behaviour for every caller.
- `http::call` being synchronous is a good default for contract authors and is
  clearly documented.
- Publishing cadence is high (v4.32.0 shipped 2026-08-09, one day before this
  work), which is a positive signal, but it also means findings here are pinned
  to that exact version.
