# Positioning — an honest look at where this sits

Written after researching the agent-payments landscape properly, which happened
later than it should have. Some of what follows undercuts claims made earlier in
this project's own materials. Those claims were wrong and are corrected here
rather than quietly dropped.

## What the research actually found

### The category is not new, and the standard already names this slot

**ERC-8004** was ratified in January 2026. It defines three on-chain registries:
Identity, Reputation, and **Validation**. The Validation Registry is described as
accepting "independent validator attestations via TEE oracles, zkML verifiers, and
stake-secured re-execution."

That is this project's exact thesis, written into a ratified standard seven months
before this repository existed. Within the first month of mainnet, more than
45,000 agents registered across multiple chains.

Anyone claiming to have invented verifiable agent settlement in August 2026 has
not read the standards.

### Solana already ships an Agent Registry

`solana.com/agent-registry` exists and is interoperable with ERC-8004. This
project builds an agent-identity-plus-settlement layer on Solana without having
checked whether Solana already provides one. It does.

This is a research failure on our part, not a gap in the ecosystem.

### A direct competitor is already live

**Cascrow** runs agentic escrow on the XRP Ledger: locks RLUSD in a contract,
releases on verified milestone completion, ships an MCP server (`npx cascrow-mcp`),
a REST API, and a CLI. Verification-only mode costs $0.10 per verification for
agents that want proof without escrow.

Functionally this is the same product. It is live, priced, and integrated with
Claude Desktop today.

## Where that leaves the differentiator

One thing survives the comparison, and it is narrow but real.

**Cascrow verifies with a five-model AI majority vote. This verifies with a TEE.**

Those are not equivalent, and the difference matters in exactly the case the
product exists for:

| | Five-model vote | Enclave receipt |
|---|---|---|
| What produces the verdict | Five LLMs reading submitted evidence | Code executing over the work record |
| Can the verifier be wrong? | Yes — correlated failure across models is a real mode | Only if the code is wrong |
| Can the agent influence it? | Yes — it authors the evidence the models read | No — it cannot execute in the enclave |
| Is the verdict reproducible? | No — model outputs drift across versions | Yes — same inputs, same digest, forever |
| Does it prove *who* ran it? | No | Yes — attestation binds the output to the loaded code |

An LLM panel is a judgment about submitted evidence. An enclave receipt is a
measurement of the work. When an agent overstates output by 2%, a five-model vote
reading a plausible-looking summary has a decent chance of passing it. A digest
over the observed unit count does not.

The honest framing is therefore not "we invented this." It is:

> **The ERC-8004 Validation Registry deliberately left the attestation mechanism
> open, and its TEE branch is still under active revision with the TEE community
> through late 2026. This is a working TEE implementation of that slot, settled on
> Solana.**

That claim is defensible. "Novel category" is not.

## What this means strategically

**Do not compete on being first.** That position is gone and was gone before this
started.

**Do compete on the strength of the verdict.** Every competitor surveyed verifies
by asking a model what it thinks. This measures. That is the entire moat, and it
is a moat only for as long as the TEE path stays harder to build than a prompt —
which, given that the ERC-8004 TEE branch is still being specified, is a real
window rather than an imagined one.

**The riskiest assumption** is that anyone currently paying agents cares about the
2% overstatement case. Nobody in this research was found to be complaining about
it. Agents overstating output is a predicted problem, not yet an observed market
pain. That is the thing most likely to kill this, and no amount of TEE engineering
addresses it.

**The cheapest way to test that** is to instrument real agent workloads and measure
how often claimed output diverges from observed output. If the answer is "almost
never", the product is a solution without a problem and should be abandoned. If
the answer is "routinely, by small margins", the case makes itself.

That measurement has not been done. Until it is, this is a well-built bet, not a
validated business.

## Score, stated plainly

Asked for a novelty score of 99.5/100, the honest numbers are:

- **Novelty: ~6/10.** The category is standardised, a competitor is live, and the
  host chain ships its own registry. The TEE-versus-LLM-panel distinction is
  genuine but narrow.
- **Execution: ~8/10.** The contract builds and is tested against the compiled
  artifact, digests are cross-verified between two independent implementations,
  settlements ran on devnet including a correctly refused one, and six
  reproducible platform findings came out of the work.
- **Market validation: ~2/10.** The core assumption is untested.

Inflating the first number would have made this document useless.
