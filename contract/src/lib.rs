//! Tallystick settlement contract.
//!
//! Compiled to a WASM component targeting `wasm32-wasip2` and registered
//! against a T3N tenant namespace. Exports two functions on the `contracts`
//! interface:
//!
//!   issue-receipt — takes an agent's signed claim plus the work record the
//!                   enclave can see, and returns both digests. The agent
//!                   cannot run this; that is the point.
//!   check-halves  — recomputes a verdict from two digests.
//!
//! Build:
//!   rustup target add wasm32-wasip2
//!   cargo build --target wasm32-wasip2 --release
//!
//! Test (host target, no WASM needed):
//!   cargo test

#[cfg(target_arch = "wasm32")]
wit_bindgen::generate!({
    world: "tenant-settle",
    path: "wit",
    additional_derives: [serde::Deserialize, serde::Serialize],
    generate_all,
});

pub mod digest;
pub mod settle;

#[cfg(target_arch = "wasm32")]
struct Component;

#[cfg(target_arch = "wasm32")]
impl exports::z::tenant_settle::contracts::Guest for Component {
    fn issue_receipt(
        req: exports::z::tenant_settle::contracts::GenericInput,
    ) -> Result<Vec<u8>, String> {
        let input = req.input.ok_or("issue-receipt: missing input")?;
        let out = settle::issue_receipt(&input)?;
        let _ = host::interfaces::logging::info("issued receipt");
        Ok(out)
    }

    fn check_halves(
        req: exports::z::tenant_settle::contracts::GenericInput,
    ) -> Result<Vec<u8>, String> {
        let input = req.input.ok_or("check-halves: missing input")?;
        settle::check_halves(&input)
    }
}

#[cfg(target_arch = "wasm32")]
export!(Component);
