import type { SVGProps } from "react";

/**
 * The Tallystick mark.
 *
 * A tally stick cleft down its length. The left half carries three notches
 * (the agent's signed claim), the right half carries the same three notches
 * (the receipt written inside the enclave). The kerf — the saw slot — runs
 * between them. Notches align across the gap only when the halves match.
 *
 * The accent stroke marks the matched state and is the only place colour
 * appears. Set `matched={false}` to render the unsettled form, where the
 * right half is offset and the notches no longer line up.
 */
export function LogoMark({
  matched = true,
  ...props
}: SVGProps<SVGSVGElement> & { matched?: boolean }) {
  const rightShift = matched ? 0 : 3;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Tallystick"
      {...props}
    >
      {/* left half — the claim */}
      <path
        d="M6 4.5 H14 V27.5 H6 Z"
        className="fill-foreground"
        fillOpacity={0.92}
      />
      {/* notches cut into the left half's inner edge */}
      <g className="fill-background">
        <rect x="10.5" y="9" width="3.5" height="2" />
        <rect x="10.5" y="15" width="3.5" height="2" />
        <rect x="10.5" y="21" width="3.5" height="2" />
      </g>

      {/* right half — the receipt */}
      <g transform={`translate(0 ${rightShift})`}>
        <path
          d="M18 4.5 H26 V27.5 H18 Z"
          className="fill-foreground"
          fillOpacity={0.55}
        />
        <g className="fill-background">
          <rect x="18" y="9" width="3.5" height="2" />
          <rect x="18" y="15" width="3.5" height="2" />
          <rect x="18" y="21" width="3.5" height="2" />
        </g>
      </g>

      {/* the kerf — accent only when the halves match */}
      <rect
        x="15.25"
        y="4.5"
        width="1.5"
        height="23"
        className={matched ? "fill-primary" : "fill-muted-foreground"}
      />
    </svg>
  );
}

/** Wordmark lockup. Mark + name, aligned on the cap height. */
export function Logo({
  className,
  showWord = true,
}: {
  className?: string;
  showWord?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark className="h-[22px] w-[22px] shrink-0" />
      {showWord && (
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">
          Tallystick
        </span>
      )}
    </span>
  );
}
