//! Deterministic digest over a work record.
//!
//! FNV-1a, 128-bit. Chosen because the contract must run inside the enclave
//! with no external crates beyond serde, and because the digest here is a
//! *commitment*, not a security boundary — the security boundary is that the
//! agent cannot execute this function. It runs in the TEE.
//!
//! If you are adapting this for production, swap in SHA-256 via a host
//! interface. The property that matters is that both halves are computed by
//! the same code path over canonicalised bytes, so a mismatch means the inputs
//! genuinely differed.

const OFFSET: u128 = 0x6c62272e07bb014262b821756295c58d;
const PRIME: u128 = 0x0000000001000000000000000000013b;

pub fn fnv1a_128(bytes: &[u8]) -> u128 {
    let mut hash = OFFSET;
    for b in bytes {
        hash ^= *b as u128;
        hash = hash.wrapping_mul(PRIME);
    }
    hash
}

pub fn hex32(value: u128) -> String {
    format!("{value:032x}")
}

/// Canonical byte encoding of a work record.
///
/// Field order is fixed and lengths are prefixed, so `("ab", "c")` and
/// `("a", "bc")` cannot collide. Getting this wrong is the classic way a
/// commitment scheme silently stops committing to anything.
pub fn canonical(fields: &[(&str, &str)]) -> Vec<u8> {
    let mut out = Vec::new();
    for (k, v) in fields {
        out.extend_from_slice(&(k.len() as u32).to_be_bytes());
        out.extend_from_slice(k.as_bytes());
        out.extend_from_slice(&(v.len() as u32).to_be_bytes());
        out.extend_from_slice(v.as_bytes());
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn digest_is_stable() {
        let a = canonical(&[("job", "reconcile"), ("units", "1284")]);
        assert_eq!(fnv1a_128(&a), fnv1a_128(&a));
    }

    #[test]
    fn length_prefix_prevents_field_smearing() {
        let a = canonical(&[("k", "ab"), ("j", "c")]);
        let b = canonical(&[("k", "a"), ("j", "bc")]);
        assert_ne!(fnv1a_128(&a), fnv1a_128(&b));
    }

    #[test]
    fn differing_unit_counts_diverge() {
        let claim = canonical(&[("job", "classify"), ("units", "512")]);
        let receipt = canonical(&[("job", "classify"), ("units", "500")]);
        assert_ne!(fnv1a_128(&claim), fnv1a_128(&receipt));
    }

    #[test]
    fn hex_is_padded_to_32() {
        assert_eq!(hex32(1).len(), 32);
        assert_eq!(hex32(u128::MAX).len(), 32);
    }
}
