//! Settlement logic: issue a receipt, and check a claim against it.

use crate::digest::{canonical, fnv1a_128, hex32};
use serde::{Deserialize, Serialize};

/// What the agent asserts it did. Signed by the agent, so the agent cannot
/// alter it after the fact — but it is still the agent's own account of events,
/// which is exactly why it is only one half.
#[derive(Debug, Deserialize)]
pub struct Claim {
    pub settlement_id: String,
    pub agent_did: String,
    pub job: String,
    /// Units of work the agent says it completed.
    pub units_claimed: u64,
    pub amount_lamports: u64,
}

/// What the enclave observed. `units_observed` comes from the work record the
/// contract can see, not from the claim.
#[derive(Debug, Deserialize)]
pub struct WorkRecord {
    pub settlement_id: String,
    pub units_observed: u64,
}

#[derive(Debug, Serialize)]
pub struct Receipt {
    pub settlement_id: String,
    pub agent_did: String,
    pub claim_hash: String,
    pub receipt_hash: String,
    pub amount_lamports: u64,
    pub units_claimed: u64,
    pub units_observed: u64,
    /// True only when both digests agree. Recomputed, never carried in.
    pub matched: bool,
}

#[derive(Debug, Deserialize)]
pub struct IssueInput {
    pub claim: Claim,
    pub work: WorkRecord,
}

fn digest_of(job: &str, units: u64, amount: u64, did: &str) -> String {
    let units_s = units.to_string();
    let amount_s = amount.to_string();
    hex32(fnv1a_128(&canonical(&[
        ("agent", did),
        ("job", job),
        ("units", &units_s),
        ("amount", &amount_s),
    ])))
}

pub fn issue_receipt(input: &[u8]) -> Result<Vec<u8>, String> {
    let parsed: IssueInput =
        serde_json::from_slice(input).map_err(|e| format!("issue-receipt: malformed input: {e}"))?;

    let IssueInput { claim, work } = parsed;

    if claim.settlement_id != work.settlement_id {
        return Err(format!(
            "issue-receipt: settlement id mismatch — claim {} vs work record {}",
            claim.settlement_id, work.settlement_id
        ));
    }
    if claim.amount_lamports == 0 {
        return Err("issue-receipt: amount_lamports must be greater than zero".into());
    }

    // The two halves. Same function, same field order — the only difference is
    // where the unit count came from.
    let claim_hash = digest_of(
        &claim.job,
        claim.units_claimed,
        claim.amount_lamports,
        &claim.agent_did,
    );
    let receipt_hash = digest_of(
        &claim.job,
        work.units_observed,
        claim.amount_lamports,
        &claim.agent_did,
    );

    let receipt = Receipt {
        matched: claim_hash == receipt_hash,
        settlement_id: claim.settlement_id,
        agent_did: claim.agent_did,
        claim_hash,
        receipt_hash,
        amount_lamports: claim.amount_lamports,
        units_claimed: claim.units_claimed,
        units_observed: work.units_observed,
    };

    serde_json::to_vec(&receipt).map_err(|e| format!("issue-receipt: encode failed: {e}"))
}

#[derive(Debug, Deserialize)]
pub struct CheckInput {
    pub claim_hash: String,
    pub receipt_hash: String,
}

#[derive(Debug, Serialize)]
pub struct Verdict {
    pub matched: bool,
    pub reason: String,
}

pub fn check_halves(input: &[u8]) -> Result<Vec<u8>, String> {
    let parsed: CheckInput =
        serde_json::from_slice(input).map_err(|e| format!("check-halves: malformed input: {e}"))?;

    let matched = parsed.claim_hash == parsed.receipt_hash;
    let verdict = Verdict {
        matched,
        reason: if matched {
            "Both halves produce the same digest.".to_string()
        } else {
            "Digests differ — the claim does not describe the observed work.".to_string()
        },
    };

    serde_json::to_vec(&verdict).map_err(|e| format!("check-halves: encode failed: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn input(claimed: u64, observed: u64) -> Vec<u8> {
        format!(
            r#"{{"claim":{{"settlement_id":"4f2a","agent_did":"did:t3n:abc",
                "job":"classify","units_claimed":{claimed},"amount_lamports":250000000}},
                "work":{{"settlement_id":"4f2a","units_observed":{observed}}}}}"#
        )
        .into_bytes()
    }

    #[test]
    fn honest_claim_matches() {
        let out = issue_receipt(&input(512, 512)).unwrap();
        let r: serde_json::Value = serde_json::from_slice(&out).unwrap();
        assert_eq!(r["matched"], true);
        assert_eq!(r["claim_hash"], r["receipt_hash"]);
    }

    #[test]
    fn overstated_claim_diverges() {
        let out = issue_receipt(&input(512, 500)).unwrap();
        let r: serde_json::Value = serde_json::from_slice(&out).unwrap();
        assert_eq!(r["matched"], false);
        assert_ne!(r["claim_hash"], r["receipt_hash"]);
    }

    #[test]
    fn mismatched_settlement_ids_are_rejected() {
        let bad = br#"{"claim":{"settlement_id":"4f2a","agent_did":"did:t3n:abc",
            "job":"j","units_claimed":1,"amount_lamports":1},
            "work":{"settlement_id":"9z9z","units_observed":1}}"#;
        assert!(issue_receipt(bad).is_err());
    }

    #[test]
    fn zero_amount_is_rejected() {
        let bad = br#"{"claim":{"settlement_id":"4f2a","agent_did":"did:t3n:abc",
            "job":"j","units_claimed":1,"amount_lamports":0},
            "work":{"settlement_id":"4f2a","units_observed":1}}"#;
        assert!(issue_receipt(bad).is_err());
    }

    #[test]
    fn check_halves_reports_both_verdicts() {
        let same = br#"{"claim_hash":"aa","receipt_hash":"aa"}"#;
        let diff = br#"{"claim_hash":"aa","receipt_hash":"bb"}"#;
        let a: serde_json::Value = serde_json::from_slice(&check_halves(same).unwrap()).unwrap();
        let b: serde_json::Value = serde_json::from_slice(&check_halves(diff).unwrap()).unwrap();
        assert_eq!(a["matched"], true);
        assert_eq!(b["matched"], false);
    }
}
