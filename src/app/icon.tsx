import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#12100d",
          borderRadius: 6,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
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
      </div>
    ),
    size,
  );
}
