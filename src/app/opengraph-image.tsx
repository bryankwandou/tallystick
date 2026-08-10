import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Tallystick — settlement your agent can prove";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#12100d",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* mark + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="44" height="44" viewBox="0 0 32 32">
            <path d="M6 4.5 H14 V27.5 H6 Z" fill="#f5f4f1" fillOpacity="0.92" />
            <rect x="10.5" y="9" width="3.5" height="2" fill="#12100d" />
            <rect x="10.5" y="15" width="3.5" height="2" fill="#12100d" />
            <rect x="10.5" y="21" width="3.5" height="2" fill="#12100d" />
            <path d="M18 4.5 H26 V27.5 H18 Z" fill="#f5f4f1" fillOpacity="0.55" />
            <rect x="18" y="9" width="3.5" height="2" fill="#12100d" />
            <rect x="18" y="15" width="3.5" height="2" fill="#12100d" />
            <rect x="18" y="21" width="3.5" height="2" fill="#12100d" />
            <rect x="15.25" y="4.5" width="1.5" height="23" fill="#56cf61" />
          </svg>
          <div style={{ fontSize: 30, fontWeight: 600, color: "#f5f4f1", letterSpacing: "-0.02em" }}>
            Tallystick
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 600,
              color: "#f5f4f1",
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              maxWidth: 900,
            }}
          >
            Settlement your agent can prove.
          </div>
          <div style={{ fontSize: 28, color: "#a8a49b", lineHeight: 1.45, maxWidth: 820 }}>
            Every payout splits in two — a signed claim and an enclave receipt.
            Funds move only when the halves match.
          </div>
        </div>

        {/* footer rule + meta */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", height: 1, background: "#413e37", width: "100%" }} />
          <div style={{ display: "flex", gap: 34, fontSize: 21, color: "#a8a49b" }}>
            <div style={{ display: "flex" }}>T3N decentralised identity</div>
            <div style={{ display: "flex", color: "#413e37" }}>/</div>
            <div style={{ display: "flex" }}>TEE contracts</div>
            <div style={{ display: "flex", color: "#413e37" }}>/</div>
            <div style={{ display: "flex", color: "#56cf61" }}>Settled on Solana</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
